import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DailyUsageInfo {
  usesToday: number;
  remaining: number;
  limit: number;
}

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: string;
  subscriptionEnd: Date | null;
  planType: string | null;
  trialUsed: boolean;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
  dailyUsage: DailyUsageInfo | null;
  checkDailyUsage: () => Promise<{ allowed: boolean; message?: string }>;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  canUseFeature: (feature: 'balance_add' | 'planificador_modify' | 'learn' | 'food_guide' | 'general') => boolean;
  hasAnyAccess: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  isCancelled: boolean;
  isCancelledActive: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PREMIUM = 10;
// How long to keep showing premium optimistically while re-syncing (ms)
const OPTIMISTIC_GRACE_MS = 60 * 1000; // 1 minute

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Raw state — only updated after a confirmed sync result
  const [dbIsPremium, setDbIsPremium] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);

  // Tracks whether a resync is currently in-flight — during that time we keep
  // showing premium so the user never sees a flash of "free" mode.
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttemptRef = useRef(0); // prevents stale async races

  // ── DERIVED STATE ──────────────────────────────────────────────────────────

  const paidPeriodActive = useMemo(() => {
    // While a re-sync is running, stay optimistically premium if DB says so
    if (isSyncing && dbIsPremium) return true;
    if (!dbIsPremium) return false;
    if (!subscriptionEnd) return true;
    return new Date() < subscriptionEnd;
  }, [dbIsPremium, subscriptionEnd, isSyncing]);

  const isCancelledActive = useMemo(() => {
    return subscriptionStatus === 'cancelled' && paidPeriodActive;
  }, [subscriptionStatus, paidPeriodActive]);

  const isCancelled = isCancelledActive;

  // Trial fields kept as stubs (always false/0) — trial system removed
  const isTrialActive = false;
  const isTrialExpired = false;
  const trialDaysRemaining = 0;

  const isPremium = paidPeriodActive;
  const hasAccess = paidPeriodActive;

  const canUseFeature = useCallback((
    feature: 'balance_add' | 'planificador_modify' | 'learn' | 'food_guide' | 'general'
  ) => {
    if (paidPeriodActive) return true;
    if (feature === 'planificador_modify') return true;
    if (feature === 'balance_add') return true;
    const premiumOnly: typeof feature[] = ['learn'];
    if (premiumOnly.includes(feature)) return false;
    return true;
  }, [paidPeriodActive]);

  const daysRemaining = useMemo(() => {
    if (paidPeriodActive && subscriptionEnd) {
      const diff = subscriptionEnd.getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return null;
  }, [paidPeriodActive, subscriptionEnd]);

  // ── localStorage cache ────────────────────────────────────────────────────
  const premiumCacheKey = user ? `premium_state_${user.id}` : null;

  useEffect(() => {
    if (!premiumCacheKey) return;
    try {
      const cached = localStorage.getItem(premiumCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - (parsed.__ts ?? 0);
        if (cacheAge < 10 * 60 * 1000) {
          setDbIsPremium(parsed.is_premium ?? false);
          setPlanType(parsed.plan_type ?? 'free');
          setSubscriptionStatus(parsed.subscription_status ?? 'inactive');
          setSubscriptionEnd(parsed.subscription_end ? new Date(parsed.subscription_end) : null);
          console.log('[usePremium] Hydrated from localStorage cache');
        }
      }
    } catch {
      // ignore malformed cache
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premiumCacheKey]);

  // ── Core resync with Google Play (with exponential backoff retries) ────────
  /**
   * Calls sync-subscription (no token → DB-state + Google Play check).
   * Returns the synced data on success, or null if all attempts fail.
   * NEVER throws — callers decide what to do on null.
   */
  const callSyncSubscription = useCallback(async (maxAttempts = 3): Promise<{
    is_premium: boolean;
    expiration_date: string | null;
    subscription_status: string;
    plan_type: string | null;
  } | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[usePremium] sync-subscription attempt ${attempt}/${maxAttempts}...`);
        const { data, error } = await supabase.functions.invoke('sync-subscription', {});
        if (!error && data) {
          console.log('[usePremium] sync-subscription result:', data);
          return data;
        }
        if (error) console.warn(`[usePremium] sync-subscription error (attempt ${attempt}):`, error.message);
      } catch (e) {
        console.warn(`[usePremium] sync-subscription exception (attempt ${attempt}):`, e);
      }
      // Exponential backoff: 500ms, 1000ms, 2000ms …
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    }
    console.error('[usePremium] All sync-subscription attempts failed');
    return null;
  }, []);

  // ── Apply synced data to state ────────────────────────────────────────────
  const applySyncedData = useCallback((
    synced: { is_premium: boolean; expiration_date: string | null; subscription_status: string; plan_type: string | null },
    dailyUsesData: { daily_uses: number; last_use_date: string | null }
  ) => {
    const rawEnd = synced.expiration_date ? new Date(synced.expiration_date) : null;
    const now = new Date();

    let effectivePremium = synced.is_premium || false;
    if (synced.subscription_status === 'cancelled' && rawEnd && rawEnd > now) {
      effectivePremium = true;
    }

    setDbIsPremium(effectivePremium);
    setPlanType(synced.plan_type || 'free');
    setSubscriptionStatus(synced.subscription_status || 'inactive');
    setSubscriptionEnd(rawEnd);

    const today = now.toISOString().split('T')[0];
    const usesToday = (dailyUsesData.last_use_date === today) ? (dailyUsesData.daily_uses || 0) : 0;
    const strictPaid = effectivePremium && (!rawEnd || rawEnd > now);
    const userLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
    setDailyUsage({ usesToday, remaining: Math.max(0, userLimit - usesToday), limit: userLimit });

    if (premiumCacheKey) {
      try {
        localStorage.setItem(premiumCacheKey, JSON.stringify({
          is_premium: effectivePremium,
          plan_type: synced.plan_type || 'free',
          subscription_status: synced.subscription_status || 'inactive',
          subscription_end: rawEnd?.toISOString() ?? null,
          __ts: Date.now(),
        }));
      } catch { /* localStorage quota — non-fatal */ }
    }
  }, [premiumCacheKey]);

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setDbIsPremium(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
      setDailyUsage(null);
      setIsInitialized(true);
      setIsLoading(false);
      if (premiumCacheKey) localStorage.removeItem(premiumCacheKey);
      return;
    }

    const currentAttempt = ++syncAttemptRef.current;
    setIsLoading(true);

    // Safety timeout extended to 12s to allow for resync round-trip
    const safetyTimer = setTimeout(() => {
      if (syncAttemptRef.current !== currentAttempt) return;
      console.warn('[usePremium] Fetch timed out — keeping current state, setting initialized');
      setIsInitialized(true);
      setIsLoading(false);
      setIsSyncing(false);
    }, 12000);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (syncAttemptRef.current !== currentAttempt) return; // stale
      clearTimeout(safetyTimer);

      if (error) {
        console.error('[usePremium] Error fetching subscription:', error);
        // On DB error, keep whatever state we have — don't downgrade
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Safety net: no subscription record → create it (free plan)
      let subData = data;
      if (!subData) {
        console.log('[usePremium] No subscription found, creating free plan record...');
        const { data: inserted } = await supabase
          .from('user_subscriptions')
          .upsert({ user_id: user.id, is_premium: false, plan_type: 'free', subscription_status: 'inactive' }, { onConflict: 'user_id' })
          .select().maybeSingle();
        subData = inserted;
      }

      if (!subData) {
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      const rawEnd = subData.subscription_end ? new Date(subData.subscription_end) : null;
      const now = new Date();
      const isExpired = rawEnd && rawEnd <= now;

      // ── CRITICAL: If DB says premium but date expired, ALWAYS resync first ──
      if (subData.is_premium && isExpired) {
        console.log(`[usePremium] is_premium=true but subscription_end=${rawEnd?.toISOString()} is in the past — MUST resync before downgrading`);

        // Keep premium optimistically while we wait for Google Play response
        setIsSyncing(true);

        const syncResult = await callSyncSubscription(3);

        if (syncAttemptRef.current !== currentAttempt) return; // stale
        setIsSyncing(false);

        if (syncResult) {
          // Google Play responded — use its authoritative data
          applySyncedData(syncResult, { daily_uses: subData.daily_uses, last_use_date: subData.last_use_date });
        } else {
          // Resync failed completely — apply OPTIMISTIC GRACE:
          // Keep premium for OPTIMISTIC_GRACE_MS beyond the expired date
          // to avoid false negatives during transient network issues
          const gracePeriodEnd = new Date((rawEnd?.getTime() ?? now.getTime()) + OPTIMISTIC_GRACE_MS);
          const stillInGrace = now < gracePeriodEnd;

          console.warn(`[usePremium] Resync failed — ${stillInGrace ? 'applying grace period' : 'downgrading to free'}`);

          if (stillInGrace) {
            // Keep current state (premium), just update the end to grace period
            setSubscriptionEnd(gracePeriodEnd);
          } else {
            // Grace period also expired — downgrade to free
            setDbIsPremium(false);
            setPlanType('free');
            setSubscriptionStatus('expired');
            setSubscriptionEnd(rawEnd);
            const usesToday = (subData.last_use_date === now.toISOString().split('T')[0]) ? (subData.daily_uses || 0) : 0;
            setDailyUsage({ usesToday, remaining: Math.max(0, DAILY_LIMIT_FREE - usesToday), limit: DAILY_LIMIT_FREE });
            if (premiumCacheKey) {
              try {
                localStorage.setItem(premiumCacheKey, JSON.stringify({
                  is_premium: false, plan_type: 'free', subscription_status: 'expired',
                  subscription_end: rawEnd?.toISOString() ?? null, __ts: Date.now(),
                }));
              } catch { /* non-fatal */ }
            }
          }
        }

      } else {
        // Not expired (or never was premium) — apply DB data directly
        let effectivePremium = subData.is_premium || false;
        if (subData.subscription_status === 'cancelled' && rawEnd && rawEnd > now) {
          effectivePremium = true;
        }

        setDbIsPremium(effectivePremium);
        setPlanType(subData.plan_type || 'free');
        setSubscriptionStatus(subData.subscription_status || 'inactive');
        setSubscriptionEnd(rawEnd);

        const today = now.toISOString().split('T')[0];
        const usesToday = (subData.last_use_date === today) ? (subData.daily_uses || 0) : 0;
        const strictPaid = effectivePremium && (!rawEnd || rawEnd > now);
        const userLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
        setDailyUsage({ usesToday, remaining: Math.max(0, userLimit - usesToday), limit: userLimit });

        if (premiumCacheKey) {
          try {
            localStorage.setItem(premiumCacheKey, JSON.stringify({
              is_premium: effectivePremium,
              plan_type: subData.plan_type || 'free',
              subscription_status: subData.subscription_status || 'inactive',
              subscription_end: rawEnd?.toISOString() ?? null,
              __ts: Date.now(),
            }));
          } catch { /* non-fatal */ }
        }
      }

    } catch (err) {
      if (syncAttemptRef.current !== currentAttempt) return;
      clearTimeout(safetyTimer);
      console.error('[usePremium] Error in fetchSubscription:', err);
      // On unexpected error — keep current state, don't downgrade
    } finally {
      if (syncAttemptRef.current === currentAttempt) {
        setIsInitialized(true);
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  }, [user, premiumCacheKey, callSyncSubscription, applySyncedData]);

  const checkDailyUsage = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!user) {
      return { allowed: false, message: 'Necesitás iniciar sesión para generar recetas' };
    }

    try {
      setIsLoading(true);
      const { data: subData, error } = await supabase
        .from('user_subscriptions')
        .select('daily_uses, last_use_date, is_premium, subscription_end, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking daily usage:', error);
        return { allowed: false, message: 'Error al verificar el uso diario' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const usesToday = (subData?.last_use_date === today) ? (subData?.daily_uses || 0) : 0;

      const rawEnd = subData?.subscription_end ? new Date(subData.subscription_end) : null;
      const inGracePeriod = subData?.subscription_status === 'cancelled' && rawEnd && rawEnd > now;
      const strictPaid = (subData?.is_premium === true || inGracePeriod) && (!rawEnd || rawEnd > now);
      const currentLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
      const remaining = Math.max(0, currentLimit - usesToday);

      setDailyUsage({ usesToday, remaining, limit: currentLimit });

      if (usesToday > currentLimit) {
        return {
          allowed: false,
          message: strictPaid
            ? `¡Alcanzaste el límite de ${currentLimit} recetas de hoy! Volvé mañana 🍳`
            : `Hoy ya usaste tus ${DAILY_LIMIT_FREE} recetas gratuitas. ¡Suscribite para generar más! 🌟`
        };
      }

      return { allowed: true };
    } catch (err) {
      console.error('Error in checkDailyUsage:', err);
      return { allowed: false, message: 'Error al verificar el uso diario' };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Silent background re-sync when the app becomes visible again.
  // Does NOT set isLoading=true so it never causes a UI flicker.
  useEffect(() => {
    if (!user) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if ((window as any).__purchaseInProgress) {
        console.log('[usePremium] Skipping visibility sync — purchase in progress');
        return;
      }
      // Debounce: avoid multiple rapid syncs when the OS triggers several events
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log('[usePremium] App visible — silent background sync');
        // Silent sync: call DB directly without touching isLoading
        try {
          const { data } = await supabase
            .from('user_subscriptions')
            .select('is_premium, subscription_end, subscription_status, plan_type, daily_uses, last_use_date')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!data) return;
          const rawEnd = data.subscription_end ? new Date(data.subscription_end) : null;
          const now = new Date();
          let effectivePremium = data.is_premium || false;
          if (data.subscription_status === 'cancelled' && rawEnd && rawEnd > now) effectivePremium = true;
          // Only trigger resync with Google Play if needed (expired but DB says premium)
          if (data.is_premium && rawEnd && rawEnd <= now) {
            fetchSubscription(); // Full sync needed — let it run normally
            return;
          }
          // Safe to apply silently
          setDbIsPremium(effectivePremium);
          setPlanType(data.plan_type || 'free');
          setSubscriptionStatus(data.subscription_status || 'inactive');
          setSubscriptionEnd(rawEnd);
        } catch { /* non-fatal — keep current state */ }
      }, 1500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [user, fetchSubscription]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setDbIsPremium(false);
        setPlanType('free');
        setSubscriptionStatus('inactive');
        setSubscriptionEnd(null);
        setDailyUsage(null);
        setIsInitialized(false);
        setIsSyncing(false);
        try {
          if (session?.user?.id) {
            localStorage.removeItem(`premium_state_${session.user.id}`);
          } else {
            Object.keys(localStorage)
              .filter((k) => k.startsWith('premium_state_'))
              .forEach((k) => localStorage.removeItem(k));
          }
        } catch { /* non-fatal */ }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <PremiumContext.Provider value={{
      isPremium,
      isLoading,
      subscriptionStatus,
      subscriptionEnd,
      planType,
      trialUsed: false,
      daysRemaining,
      refetch: fetchSubscription,
      dailyUsage,
      checkDailyUsage,
      isTrialActive,
      isTrialExpired,
      trialDaysRemaining,
      canUseFeature,
      hasAnyAccess: hasAccess,
      showPaywall,
      setShowPaywall,
      isCancelled,
      isCancelledActive,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    return {
      isPremium: false,
      isLoading: false,
      subscriptionStatus: 'free',
      subscriptionEnd: null,
      planType: 'free',
      trialUsed: false,
      daysRemaining: null,
      refetch: async () => {},
      dailyUsage: null,
      checkDailyUsage: async () => ({ allowed: true }),
      isTrialActive: false,
      isTrialExpired: false,
      trialDaysRemaining: 0,
      canUseFeature: () => true,
      hasAnyAccess: false,
      showPaywall: false,
      setShowPaywall: () => {},
      isCancelled: false,
      isCancelledActive: false,
    } as PremiumContextType;
  }
  return context;
}
