import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
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
  // Trial system
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  canUseFeature: (feature: 'balance_add' | 'planificador_modify' | 'general') => boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PREMIUM = 10;
const TRIAL_DAYS = 15;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Trial & premium state
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState<string | null>('free');
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');

  const isTrialActive = (() => {
    if (isPremium) return false;
    if (!trialEndDate) return true; // No trial data yet, assume active
    return new Date() < trialEndDate;
  })();

  const isTrialExpired = (() => {
    if (isPremium) return false;
    if (!trialEndDate) return false;
    return new Date() >= trialEndDate;
  })();

  const trialDaysRemaining = (() => {
    if (!trialEndDate) return TRIAL_DAYS;
    const now = new Date();
    const diff = trialEndDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const canUseFeature = useCallback((feature: 'balance_add' | 'planificador_modify' | 'general') => {
    if (isPremium) return true;
    if (isTrialActive) return true;
    // Trial expired, block certain features
    if (feature === 'balance_add' || feature === 'planificador_modify') return false;
    return true; // General viewing is still allowed
  }, [isPremium, isTrialActive]);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setPlanType('free');
      setTrialStartDate(null);
      setTrialEndDate(null);
      setDailyUsage(null);
      return;
    }

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
        setIsPremium(data.is_premium || false);
        setPlanType(data.plan_type || 'free');
        setSubscriptionStatus(data.subscription_status || 'free');
        
        if (data.trial_start_date) setTrialStartDate(new Date(data.trial_start_date));
        if (data.trial_end_date) setTrialEndDate(new Date(data.trial_end_date));

        // Daily usage
        const today = new Date().toISOString().split('T')[0];
        const lastUseDate = data.last_use_date;
        const usesToday = (lastUseDate === today) ? (data.daily_uses || 0) : 0;
        const userLimit = (data.is_premium) ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
        setDailyUsage({
          usesToday,
          remaining: Math.max(0, userLimit - usesToday),
          limit: userLimit
        });
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
    }
  }, [user]);

  const checkDailyUsage = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!user) {
      return { allowed: false, message: 'Necesitás iniciar sesión para generar recetas' };
    }

    try {
      setIsLoading(true);
      const userLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
      const { data, error } = await supabase.rpc('check_and_increment_daily_uses', {
        p_user_id: user.id,
        p_daily_limit: userLimit
      });

      if (error) {
        console.error('Error checking daily usage:', error);
        return { allowed: false, message: 'Error al verificar el uso diario' };
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as { allowed: boolean; uses_today: number; remaining: number; message?: string };
        
        setDailyUsage({
          usesToday: result.uses_today,
          remaining: result.remaining,
          limit: userLimit
        });

        return {
          allowed: result.allowed,
          message: result.message
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

  return (
    <PremiumContext.Provider value={{
      isPremium,
      isLoading,
      subscriptionStatus,
      subscriptionEnd: null,
      planType,
      trialUsed: false,
      daysRemaining: trialDaysRemaining,
      refetch: fetchSubscription,
      dailyUsage,
      checkDailyUsage,
      isTrialActive,
      isTrialExpired,
      trialDaysRemaining,
      canUseFeature,
      showPaywall,
      setShowPaywall,
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
      isTrialActive: true,
      isTrialExpired: false,
      trialDaysRemaining: TRIAL_DAYS,
      canUseFeature: () => true,
      showPaywall: false,
      setShowPaywall: () => {},
    } as PremiumContextType;
  }
  return context;
}
