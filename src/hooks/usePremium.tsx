import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DailyUsageInfo {
  usesToday: number;
  remaining: number;
  limit: number;
}

interface PremiumContextType {
  // Always free now - these are kept for compatibility but always return free values
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: string;
  subscriptionEnd: Date | null;
  planType: string | null;
  trialUsed: boolean;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
  // New daily usage tracking
  dailyUsage: DailyUsageInfo | null;
  checkDailyUsage: () => Promise<{ allowed: boolean; message?: string }>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const DAILY_LIMIT = 8;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);

  const fetchDailyUsage = useCallback(async () => {
    if (!user) {
      setDailyUsage(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('daily_uses, last_use_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching daily usage:', error);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastUseDate = data?.last_use_date;
      const usesToday = (lastUseDate === today) ? (data?.daily_uses || 0) : 0;

      setDailyUsage({
        usesToday,
        remaining: Math.max(0, DAILY_LIMIT - usesToday),
        limit: DAILY_LIMIT
      });
    } catch (err) {
      console.error('Error in fetchDailyUsage:', err);
    }
  }, [user]);

  const checkDailyUsage = useCallback(async (): Promise<{ allowed: boolean; message?: string }> => {
    if (!user) {
      return { allowed: false, message: 'Necesitás iniciar sesión para generar recetas' };
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('check_and_increment_daily_uses', {
        p_user_id: user.id,
        p_daily_limit: DAILY_LIMIT
      });

      if (error) {
        console.error('Error checking daily usage:', error);
        return { allowed: false, message: 'Error al verificar el uso diario' };
      }

      // Update local state - cast data to proper type
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as { allowed: boolean; uses_today: number; remaining: number; message?: string };
        
        setDailyUsage({
          usesToday: result.uses_today,
          remaining: result.remaining,
          limit: DAILY_LIMIT
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
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  return (
    <PremiumContext.Provider value={{
      // Always free - compatibility values
      isPremium: false,
      isLoading,
      subscriptionStatus: 'free',
      subscriptionEnd: null,
      planType: 'free',
      trialUsed: false,
      daysRemaining: null,
      refetch: fetchDailyUsage,
      // Daily usage
      dailyUsage,
      checkDailyUsage
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}