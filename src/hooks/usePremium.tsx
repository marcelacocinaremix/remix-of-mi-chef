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
  hasAnyAccess: boolean; // premium OR trial active
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  isCancelled: boolean;
  isCancelledActive: boolean; // cancelled but still within paid period
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
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [trialUsedDb, setTrialUsedDb] = useState(false);

  // ── DERIVED STATE ──────────────────────────────────────────────────────────

  // Paid period is active: is_premium=true AND subscription hasn't expired
  // This includes BOTH 'active' and 'cancelled' statuses while within the paid window
  const paidPeriodActive = useMemo(() => {
    if (!dbIsPremium) return false;
    if (!subscriptionEnd) return true; // no end date = indefinite/lifetime
    return new Date() < subscriptionEnd;
  }, [dbIsPremium, subscriptionEnd]);

  // Cancelled but still within the paid period (grace period)
  const isCancelledActive = useMemo(() => {
    return subscriptionStatus === 'cancelled' && paidPeriodActive;
  }, [subscriptionStatus, paidPeriodActive]);

  // Legacy alias
  const isCancelled = isCancelledActive;

  // Trial active: trial_used=true AND not expired AND no paid plan running
  const isTrialActive = useMemo(() => {
    if (!isInitialized) return false;
    if (paidPeriodActive) return false;      // paid overrides trial display
    if (!trialUsedDb) return false;
    if (!trialEndDate) return false;
    return new Date() < trialEndDate;
  }, [isInitialized, paidPeriodActive, trialUsedDb, trialEndDate]);

  // Trial expired and no active paid plan
  const isTrialExpired = useMemo(() => {
    if (paidPeriodActive) return false;
    if (!trialEndDate) return false;
    return trialUsedDb && new Date() >= trialEndDate;
  }, [paidPeriodActive, trialUsedDb, trialEndDate]);

  const trialDaysRemaining = useMemo(() => {
    if (!isTrialActive || !trialEndDate) return 0;
    const diff = trialEndDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [isTrialActive, trialEndDate]);

  // isPremium = only paid period (used for "Premium" badge)
  const isPremium = paidPeriodActive;

  // hasAnyAccess = paid OR trial (gates premium features)
  const hasAccess = paidPeriodActive || isTrialActive;

  const effectiveLimit = paidPeriodActive ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

  const canUseFeature = useCallback((
    feature: 'balance_add' | 'planificador_modify' | 'learn' | 'food_guide' | 'general'
  ) => {
    if (paidPeriodActive) return true;
    if (isTrialActive) return true;
    const premiumOnly: typeof feature[] = ['balance_add', 'planificador_modify', 'learn', 'food_guide'];
    if (premiumOnly.includes(feature)) return false;
    return true;
  }, [paidPeriodActive, isTrialActive]);

  const daysRemaining = useMemo(() => {
    if (paidPeriodActive && subscriptionEnd) {
      const diff = subscriptionEnd.getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    if (isTrialActive) return trialDaysRemaining;
    return null;
  }, [paidPeriodActive, subscriptionEnd, isTrialActive, trialDaysRemaining]);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setDbIsPremium(false);
      setPlanType('free');
      setSubscriptionStatus('inactive');
      setSubscriptionEnd(null);
      setTrialEndDate(null);
      setTrialUsedDb(false);
      setDailyUsage(null);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      // Safety net: no subscription record → create it
      if (!data) {
        console.log('No subscription found, initializing trial...');
        await supabase.functions.invoke('start-trial');
        const refetch = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        data = refetch.data;
      }

      if (data) {
        // ── CRITICAL: subscription_end beats everything ──────────────────────
        // If subscription_end is in the future, is_premium is authoritative.
        // The trigger handles expiry server-side, but we double-check client-side
        // for cancelled-but-active (grace period) case.
        const rawEnd = data.subscription_end ? new Date(data.subscription_end) : null;
        const now = new Date();

        // A cancelled subscription with future end date = still premium
        let effectivePremium = data.is_premium || false;
        if (data.subscription_status === 'cancelled' && rawEnd && rawEnd > now) {
          effectivePremium = true; // grace period — client override
        }

        setDbIsPremium(effectivePremium);
        setPlanType(data.plan_type || 'free');
        setSubscriptionStatus(data.subscription_status || 'inactive');
        setSubscriptionEnd(rawEnd);
        setTrialUsedDb(data.trial_used === true);
        if (data.trial_end_date) setTrialEndDate(new Date(data.trial_end_date));

        // Daily usage
        const today = now.toISOString().split('T')[0];
        const usesToday = (data.last_use_date === today) ? (data.daily_uses || 0) : 0;
        const strictPaid = effectivePremium && (!rawEnd || rawEnd > now);
        const userLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
        setDailyUsage({
          usesToday,
          remaining: Math.max(0, userLimit - usesToday),
          limit: userLimit
        });
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [user]);

  const checkDailyUsage = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!user) {
      return { allowed: false, message: 'Necesitás iniciar sesión para generar recetas' };
    }

    try {
      setIsLoading(true);
      const { data: subData, error } = await supabase
        .from('user_subscriptions')
        .select('daily_uses, last_use_date, is_premium, subscription_end, subscription_status, trial_used, trial_end_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking daily usage:', error);
        return { allowed: false, message: 'Error al verificar el uso diario' };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const usesToday = (subData?.last_use_date === today) ? (subData?.daily_uses || 0) : 0;

      // Grace period: cancelled but end date still in future
      const rawEnd = subData?.subscription_end ? new Date(subData.subscription_end) : null;
      const inGracePeriod = subData?.subscription_status === 'cancelled' && rawEnd && rawEnd > now;
      const strictPaid = (subData?.is_premium === true || inGracePeriod) &&
        (!rawEnd || rawEnd > now);
      const currentLimit = strictPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
      const remaining = Math.max(0, currentLimit - usesToday);

      setDailyUsage({ usesToday, remaining, limit: currentLimit });

      if (usesToday >= currentLimit) {
        const isPaidOrTrial = strictPaid ||
          (subData?.trial_used && subData?.trial_end_date && new Date(subData.trial_end_date) > now);
        return {
          allowed: false,
          message: isPaidOrTrial
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

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── AUTO-SYNC: refetch when app regains visibility ────────────────────────
  // Skips the sync if a purchase flow is actively running (avoids race condition
  // where visibilitychange fires right after the PaywallModal closes mid-purchase).
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Guard: if a purchase is in flight, let useAndroidPurchase own the refetch
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

  // ── AUTH CHANGE: reset state on logout immediately ────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setDbIsPremium(false);
        setPlanType('free');
        setSubscriptionStatus('inactive');
        setSubscriptionEnd(null);
        setTrialEndDate(null);
        setTrialUsedDb(false);
        setDailyUsage(null);
        setIsInitialized(false);
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
      trialUsed: trialUsedDb,
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
