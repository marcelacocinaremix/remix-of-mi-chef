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
  canUseFeature: (feature: 'balance_add' | 'planificador_modify' | 'learn' | 'general') => boolean;
  hasAnyAccess: boolean; // premium OR trial active
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  isCancelled: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PREMIUM = 10;
const TRIAL_DAYS = 15;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // true until first fetch completes
  const [isInitialized, setIsInitialized] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Raw DB state
  const [dbIsPremium, setDbIsPremium] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [trialUsedDb, setTrialUsedDb] = useState(false);

  // Derived: is the paid period still valid?
  const paidPeriodActive = useMemo(() => {
    if (!dbIsPremium) return false;
    // If no end date, premium is indefinite (lifetime or no expiry set)
    if (!subscriptionEnd) return true;
    return new Date() < subscriptionEnd;
  }, [dbIsPremium, subscriptionEnd]);

  // Derived: cancelled but still within paid period
  const isCancelled = useMemo(() => {
    return subscriptionStatus === 'cancelled' && paidPeriodActive;
  }, [subscriptionStatus, paidPeriodActive]);

  // Derived: trial status (fallback when premium expires)
  const isTrialActive = useMemo(() => {
    if (!isInitialized) return false; // Don't assume active until data loaded
    if (paidPeriodActive) return false;
    if (!trialEndDate) return false; // No trial data = not in trial
    return new Date() < trialEndDate;
  }, [isInitialized, paidPeriodActive, trialEndDate]);

  const isTrialExpired = useMemo(() => {
    if (paidPeriodActive) return false;
    if (!trialEndDate) return false;
    return new Date() >= trialEndDate;
  }, [paidPeriodActive, trialEndDate]);

  const trialDaysRemaining = useMemo(() => {
    if (!trialEndDate) return 0; // No trial set → 0 days, not 15
    const diff = trialEndDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [trialEndDate]);

  // Effective premium: paid period active OR trial still active
  const isPremium = paidPeriodActive;

  // Has access to premium sections? Either paid or within trial
  const hasAccess = paidPeriodActive || isTrialActive;

  // Daily limit depends on paid status
  const effectiveLimit = paidPeriodActive ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

  const canUseFeature = useCallback((feature: 'balance_add' | 'planificador_modify' | 'learn' | 'general') => {
    if (paidPeriodActive) return true;
    if (isTrialActive) return true;
    // Trial expired and no active paid period — block premium features
    if (feature === 'balance_add' || feature === 'planificador_modify' || feature === 'learn') return false;
    return true; // General viewing still allowed
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
      setTrialStartDate(null);
      setTrialEndDate(null);
      setDailyUsage(null);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data) {
        setDbIsPremium(data.is_premium || false);
        setPlanType(data.plan_type || 'free');
        setSubscriptionStatus(data.subscription_status || 'inactive');
        setSubscriptionEnd(data.subscription_end ? new Date(data.subscription_end) : null);
        if (data.trial_start_date) setTrialStartDate(new Date(data.trial_start_date));
        if (data.trial_end_date) setTrialEndDate(new Date(data.trial_end_date));

        // Daily usage
        const today = new Date().toISOString().split('T')[0];
        const lastUseDate = data.last_use_date;
        const usesToday = (lastUseDate === today) ? (data.daily_uses || 0) : 0;
        const isPaid = data.is_premium && (!data.subscription_end || new Date() < new Date(data.subscription_end));
        const userLimit = isPaid ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
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
      // READ-ONLY check: just read current usage without incrementing
      // The edge function is the ONLY place that increments daily_uses
      const { data: subData, error } = await supabase
        .from('user_subscriptions')
        .select('daily_uses, last_use_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking daily usage:', error);
        return { allowed: false, message: 'Error al verificar el uso diario' };
      }

      const today = new Date().toISOString().split('T')[0];
      const usesToday = (subData?.last_use_date === today) ? (subData?.daily_uses || 0) : 0;
      const remaining = effectiveLimit - usesToday;

      setDailyUsage({
        usesToday,
        remaining,
        limit: effectiveLimit
      });

      if (usesToday >= effectiveLimit) {
        return {
          allowed: false,
          message: `¡Se acabaron tus recetas de hoy! Volvé mañana para seguir cocinando 🍳`
        };
      }

      return { allowed: true };
    } catch (err) {
      console.error('Error in checkDailyUsage:', err);
      return { allowed: false, message: 'Error al verificar el uso diario' };
    } finally {
      setIsLoading(false);
    }
  }, [user, effectiveLimit]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

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
    } as PremiumContextType;
  }
  return context;
}
