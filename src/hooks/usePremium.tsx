import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from "react";
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Raw DB state
  const [dbIsPremium, setDbIsPremium] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);

  // ── DERIVED STATE ──────────────────────────────────────────────────────────

  const paidPeriodActive = useMemo(() => {
    if (!dbIsPremium) return false;
    if (!subscriptionEnd) return true;
    return new Date() < subscriptionEnd;
  }, [dbIsPremium, subscriptionEnd]);

  const isCancelledActive = useMemo(() => {
    return subscriptionStatus === 'cancelled' && paidPeriodActive;
  }, [subscriptionStatus, paidPeriodActive]);

  const isCancelled = isCancelledActive;

  // Trial fields kept as stubs (always false/0) — trial system removed
  const isTrialActive = false;
  const isTrialExpired = false;
  const trialDaysRemaining = 0;

  const isPremium = paidPeriodActive;

  // hasAnyAccess = only paid (trial removed)
  const hasAccess = paidPeriodActive;

  const canUseFeature = useCallback((
    feature: 'balance_add' | 'planificador_modify' | 'learn' | 'food_guide' | 'general'
  ) => {
    if (paidPeriodActive) return true;
    // These features are free for everyone
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

  // ── localStorage cache key ────────────────────────────────────────────────
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

    setIsLoading(true);

    // Safety timeout: if DB never responds, default to free plan after 5s
    const safetyTimer = setTimeout(() => {
      console.warn('[usePremium] Subscription fetch timed out — defaulting to free plan');
      setDbIsPremium(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
      setDailyUsage({ usesToday: 0, remaining: DAILY_LIMIT_FREE, limit: DAILY_LIMIT_FREE });
      setIsInitialized(true);
      setIsLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      clearTimeout(safetyTimer);

      if (error) {
        console.error('Error fetching subscription:', error);
        // Default to free plan on error — don't block the UI
        setDbIsPremium(false);
        setPlanType('free');
        setSubscriptionStatus('inactive');
        setDailyUsage({ usesToday: 0, remaining: DAILY_LIMIT_FREE, limit: DAILY_LIMIT_FREE });
        return;
      }

      // Safety net: no subscription record → create it (free plan, no trial)
      let subData = data;
      if (!subData) {
        console.log('No subscription found, creating free plan record...');
        const { data: inserted } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            is_premium: false,
            plan_type: 'free',
            subscription_status: 'inactive',
          }, { onConflict: 'user_id' })
          .select()
          .maybeSingle();
        subData = inserted;
      }

      if (subData) {
        const rawEnd = subData.subscription_end ? new Date(subData.subscription_end) : null;
        const now = new Date();

        let effectivePremium = subData.is_premium || false;
        if (subData.subscription_status === 'cancelled' && rawEnd && rawEnd > now) {
          effectivePremium = true;
        }

        setDbIsPremium(effectivePremium);
        setPlanType(subData.plan_type || 'free');
        setSubscriptionStatus(subData.subscription_status || 'inactive');
        setSubscriptionEnd(rawEnd);

        // Daily usage
        const today = now.toISOString().split('T')[0];
        const usesToday = (subData.last_use_date === today) ? (subData.daily_uses || 0) : 0;
        const strictPaid = effectivePremium && (!rawEnd || rawEnd > now);
        const userLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
        setDailyUsage({
          usesToday,
          remaining: Math.max(0, userLimit - usesToday),
          limit: userLimit
        });

        if (premiumCacheKey) {
          try {
            localStorage.setItem(premiumCacheKey, JSON.stringify({
              is_premium: effectivePremium,
              plan_type: subData.plan_type || 'free',
              subscription_status: subData.subscription_status || 'inactive',
              subscription_end: rawEnd?.toISOString() ?? null,
              __ts: Date.now(),
            }));
          } catch {
            // localStorage quota — non-fatal
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [user, premiumCacheKey]);

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
      const strictPaid = (subData?.is_premium === true || inGracePeriod) &&
        (!rawEnd || rawEnd > now);
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

  useEffect(() => {
    if (!user) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if ((window as any).__purchaseInProgress) {
          console.log('[usePremium] Skipping visibility sync — purchase in progress');
          return;
        }
        console.log('[usePremium] App visible — syncing subscription state');
        fetchSubscription();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
