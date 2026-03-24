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

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authIsLoading } = useAuth();

  // isLoading is ONLY true during the very first fetch — NEVER set back to true after initial load
  const [isLoading, setIsLoadingInternal] = useState(true);
  const hasEverLoadedRef = useRef(false); // once true, isLoading can NEVER go back to true
  const [isInitialized, setIsInitialized] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const [dbIsPremium, setDbIsPremium] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);

  // Tracks whether a background resync is running — keeps UI in premium optimistically
  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttemptRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  // Safe setter: once the app has loaded once, isLoading can NEVER be set to true again
  const setIsLoading = useCallback((val: boolean) => {
    if (val === true && hasEverLoadedRef.current) return; // block — prevents white screen on refetch
    setIsLoadingInternal(val);
    if (val === false) hasEverLoadedRef.current = true;
  }, []);

  // ── DERIVED STATE ──────────────────────────────────────────────────────────
  const paidPeriodActive = useMemo(() => {
    if ((isSyncing || isSyncingRef.current) && dbIsPremium) return true;
    if (!dbIsPremium) return false;
    if (!subscriptionEnd) return true;
    return new Date() < subscriptionEnd;
  }, [dbIsPremium, subscriptionEnd, isSyncing]);

  const isCancelledActive = useMemo(() => {
    return subscriptionStatus === 'cancelled' && paidPeriodActive;
  }, [subscriptionStatus, paidPeriodActive]);

  const isCancelled = isCancelledActive;
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
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premiumCacheKey]);

  // ── Call sync-subscription in background (NEVER touches isLoading) ────────
  const callSyncSubscriptionSilent = useCallback(async (): Promise<{
    is_premium: boolean;
    expiration_date: string | null;
    subscription_status: string;
    plan_type: string | null;
  } | null> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('sync-subscription', {});
        if (!error && data) return data;
        if (error) console.warn(`[usePremium] sync attempt ${attempt}/3:`, error.message);
      } catch (e) {
        console.warn(`[usePremium] sync exception attempt ${attempt}/3:`, e);
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt));
    }
    return null;
  }, []);

  // ── Apply data to state ────────────────────────────────────────────────────
  const applySubData = useCallback((
    sub: { is_premium: boolean; expiration_date?: string | null; subscription_end?: string | null; subscription_status: string; plan_type: string | null },
    dailyData: { daily_uses?: number | null; last_use_date?: string | null }
  ) => {
    const rawEnd = (sub.expiration_date || sub.subscription_end)
      ? new Date((sub.expiration_date ?? sub.subscription_end)!)
      : null;
    const now = new Date();

    let effectivePremium = sub.is_premium || false;
    if (sub.subscription_status === 'cancelled' && rawEnd && rawEnd > now) {
      effectivePremium = true;
    }

    setDbIsPremium(effectivePremium);
    setPlanType(sub.plan_type || 'free');
    setSubscriptionStatus(sub.subscription_status || 'inactive');
    setSubscriptionEnd(rawEnd);

    const today = now.toISOString().split('T')[0];
    const usesToday = (dailyData.last_use_date === today) ? (dailyData.daily_uses || 0) : 0;
    const strictPaid = effectivePremium && (!rawEnd || rawEnd > now);
    const userLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
    setDailyUsage({ usesToday, remaining: Math.max(0, userLimit - usesToday), limit: userLimit });

    if (premiumCacheKey) {
      try {
        localStorage.setItem(premiumCacheKey, JSON.stringify({
          is_premium: effectivePremium,
          plan_type: sub.plan_type || 'free',
          subscription_status: sub.subscription_status || 'inactive',
          subscription_end: rawEnd?.toISOString() ?? null,
          __ts: Date.now(),
        }));
      } catch { /* non-fatal */ }
    }
  }, [premiumCacheKey]);

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      // No authenticated user — reset to free state and release loading.
      // NOTE: this branch only runs AFTER authIsLoading=false (see useEffect guard),
      // so we're safe to release isLoading here without causing a premature flash.
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

    // Only show loading spinner on very first load (not on background refetches)
    const isFirstLoad = !initialLoadDoneRef.current;
    if (isFirstLoad) setIsLoading(true);

    // Safety timeout — prevents infinite loading state
    const safetyTimer = setTimeout(() => {
      if (syncAttemptRef.current !== currentAttempt) return;
      console.warn('[usePremium] Safety timeout — releasing loading');
      setIsInitialized(true);
      setIsLoading(false);
      setIsSyncing(false);
      isSyncingRef.current = false;
    }, 10000);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (syncAttemptRef.current !== currentAttempt) return;
      clearTimeout(safetyTimer);

      if (error) {
        console.error('[usePremium] DB error:', error);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      let subData = data;
      if (!subData) {
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
      const isExpiredInDb = subData.is_premium && rawEnd && rawEnd <= now;

      if (isExpiredInDb) {
        // Apply current DB state immediately (don't block UI)
        applySubData(subData, { daily_uses: subData.daily_uses, last_use_date: subData.last_use_date });
        setIsInitialized(true);
        setIsLoading(false);
        initialLoadDoneRef.current = true;

        // Then silently resync with Google Play in background — no loading state
        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log('[usePremium] subscription_end expired — background resync with Google Play');

        const syncResult = await callSyncSubscriptionSilent();

        if (syncAttemptRef.current !== currentAttempt) return;
        isSyncingRef.current = false;
        setIsSyncing(false);

        if (syncResult) {
          applySubData(syncResult, { daily_uses: subData.daily_uses, last_use_date: subData.last_use_date });
        }
      } else {
        // Normal case — apply DB state directly, no resync needed
        applySubData(subData, { daily_uses: subData.daily_uses, last_use_date: subData.last_use_date });
        setIsInitialized(true);
        setIsLoading(false);
        initialLoadDoneRef.current = true;
      }

    } catch (err) {
      if (syncAttemptRef.current !== currentAttempt) return;
      clearTimeout(safetyTimer);
      console.error('[usePremium] Error:', err);
    } finally {
      if (syncAttemptRef.current === currentAttempt) {
        setIsInitialized(true);
        setIsLoading(false);
        setIsSyncing(false);
        isSyncingRef.current = false;
        initialLoadDoneRef.current = true;
      }
    }
  }, [user, premiumCacheKey, callSyncSubscriptionSilent, applySubData]);

  // ── checkDailyUsage — NEVER touches isLoading ─────────────────────────────
  const checkDailyUsage = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!user) return { allowed: false, message: 'Necesitás iniciar sesión para generar recetas' };

    try {
      const { data: subData, error } = await supabase
        .from('user_subscriptions')
        .select('daily_uses, last_use_date, is_premium, subscription_end, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) return { allowed: false, message: 'Error al verificar el uso diario' };

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const usesToday = (subData?.last_use_date === today) ? (subData?.daily_uses || 0) : 0;

      const rawEnd = subData?.subscription_end ? new Date(subData.subscription_end) : null;
      const inGracePeriod = subData?.subscription_status === 'cancelled' && rawEnd && rawEnd > now;
      const strictPaid = (subData?.is_premium === true || inGracePeriod) && (!rawEnd || rawEnd > now);
      const currentLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
      const remaining = Math.max(0, currentLimit - usesToday);

      // Update daily usage display without touching isLoading
      setDailyUsage({ usesToday, remaining, limit: currentLimit });

      if (usesToday >= currentLimit) {
        return {
          allowed: false,
          message: strictPaid
            ? `¡Alcanzaste el límite de ${currentLimit} recetas de hoy! Volvé mañana 🍳`
            : `Hoy ya usaste tus ${DAILY_LIMIT_FREE} recetas gratuitas. ¡Suscribite para generar más! 🌟`
        };
      }

      return { allowed: true };
    } catch (err) {
      console.error('[usePremium] checkDailyUsage error:', err);
      return { allowed: false, message: 'Error al verificar el uso diario' };
    }
  }, [user]);

  // ── If auth is still loading, keep isLoading=true so UI doesn't flash ─────
  // This prevents showing "free" state briefly before the real session loads.
  useEffect(() => {
    if (authIsLoading && !hasEverLoadedRef.current) {
      setIsLoadingInternal(true);
    }
  }, [authIsLoading]);

  // ── Initial load — wait for Auth to finish restoring session ─────────────
  // CRITICAL: if authIsLoading=true, user is still null (not yet resolved).
  // Running fetchSubscription before auth is ready causes a race condition:
  //   1. fetchSubscription sees user=null → resets to free
  //   2. Auth resolves → user is set → fetchSubscription runs again
  //   3. This double-fire causes the white screen / UI loop after purchase.
  useEffect(() => {
    if (authIsLoading) return; // wait until Supabase session is restored
    fetchSubscription();
  }, [authIsLoading, fetchSubscription]);

  // ── Silent visibility resync (no isLoading changes ever) ─────────────────
  useEffect(() => {
    if (!user) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const doSilentRefresh = async () => {
      if ((window as any).__purchaseInProgress) return;
      try {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('is_premium, subscription_end, subscription_status, plan_type, daily_uses, last_use_date, auto_renew')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!data) return;
        const rawEnd = data.subscription_end ? new Date(data.subscription_end) : null;
        const isExpired = rawEnd && rawEnd <= new Date();
        // If expired but auto_renew=true, trigger background Google Play revalidation
        if (data.is_premium && isExpired && !isSyncingRef.current) {
          isSyncingRef.current = true;
          setIsSyncing(true);
          const syncResult = await callSyncSubscriptionSilent();
          isSyncingRef.current = false;
          setIsSyncing(false);
          if (syncResult) {
            applySubData(syncResult, { daily_uses: data.daily_uses, last_use_date: data.last_use_date });
          }
        } else {
          applySubData(data, { daily_uses: data.daily_uses, last_use_date: data.last_use_date });
        }
      } catch { /* non-fatal */ }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSilentRefresh, 1500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Periodic revalidation every 30 minutes ──────────────────────────────
    // Ensures premium doesn't silently fall to free between app uses.
    const periodicInterval = setInterval(doSilentRefresh, 30 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(periodicInterval);
    };
  }, [user, callSyncSubscriptionSilent, applySubData]);

  // ── Auth state changes ────────────────────────────────────────────────────
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
        isSyncingRef.current = false;
        initialLoadDoneRef.current = false;
        // Allow isLoading to show spinner for the NEXT user's login
        hasEverLoadedRef.current = false;
        setIsLoadingInternal(true);
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
