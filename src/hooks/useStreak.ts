import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  alreadyActiveToday: boolean;
}

export interface StreakResult {
  streakData: StreakData | null;
  isLoading: boolean;
  recordActivity: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useStreak(): StreakResult {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activityInProgress = useRef(false);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreakData(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        setStreakData({
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastActivityDate: data.last_activity_date,
          alreadyActiveToday: data.last_activity_date === todayLocal,
        });
      } else {
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          alreadyActiveToday: false,
        });
      }
    } catch (err) {
      console.error("Error fetching streak:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const recordActivity = useCallback(async () => {
    if (!user || activityInProgress.current) return;
    activityInProgress.current = true;

    try {
      const { data, error } = await supabase.rpc("record_streak_activity");
      if (error) throw error;

      const result = data as {
        current_streak: number;
        longest_streak: number;
        already_active_today: boolean;
        milestone_reached: number;
      };

      const now = new Date();
      const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setStreakData({
        currentStreak: result.current_streak,
        longestStreak: result.longest_streak,
        lastActivityDate: todayLocal,
        alreadyActiveToday: true,
      });

      // Unlock permanent achievement for major milestones (silent, no popup)
      if ([30, 60, 90].includes(result.milestone_reached)) {
        await supabase.rpc("unlock_achievement", {
          p_achievement_type: `daily_streak_${result.milestone_reached}`,
          p_recipe_count: 0,
        });
      }
    } catch (err) {
      console.error("Error recording streak activity:", err);
    } finally {
      activityInProgress.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streakData,
    isLoading,
    recordActivity,
    refetch: fetchStreak,
  };
}
