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
  celebrationMilestone: number | null;
  recordActivity: () => Promise<void>;
  dismissCelebration: () => void;
  refetch: () => Promise<void>;
}

const MILESTONE_MESSAGES: Record<number, { emoji: string; title: string; message: string }> = {
  3:  { emoji: "🔥", title: "¡3 días seguidos!", message: "¡Buen comienzo! Seguí cocinando." },
  7:  { emoji: "🔥", title: "¡Una semana de racha!", message: "¡7 días usando la app!" },
  14: { emoji: "🔥", title: "¡Dos semanas de racha!", message: "¡14 días sin parar!" },
  30: { emoji: "🏆", title: "¡Un mes de racha!", message: "¡Un mes cocinando con la app!" },
  60: { emoji: "👑", title: "¡Dos meses de racha!", message: "¡60 días de hábito culinario!" },
  90: { emoji: "⭐", title: "¡Tres meses de racha!", message: "¡90 días cocinando!" },
};

export function getMilestoneInfo(milestone: number) {
  return MILESTONE_MESSAGES[milestone] ?? null;
}

export function useStreak(): StreakResult {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);
  // Guard to avoid double-calling recordActivity in StrictMode
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
        // Use local date (not UTC) to match server-side Argentina timezone logic
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
        is_new_day: boolean;
        milestone_reached: number;
        already_active_today: boolean;
      };

      const today = new Date().toISOString().split("T")[0];
      setStreakData({
        currentStreak: result.current_streak,
        longestStreak: result.longest_streak,
        lastActivityDate: today,
        alreadyActiveToday: true,
      });

      // Show celebration only for new milestones on new days
      if (result.milestone_reached > 0 && result.is_new_day) {
        setCelebrationMilestone(result.milestone_reached);

        // Unlock permanent achievement for major milestones
        if ([30, 60, 90].includes(result.milestone_reached)) {
          await supabase.rpc("unlock_achievement", {
            p_achievement_type: `daily_streak_${result.milestone_reached}`,
            p_recipe_count: 0,
          });
        }
      }
    } catch (err) {
      console.error("Error recording streak activity:", err);
    } finally {
      activityInProgress.current = false;
    }
  }, [user]);

  const dismissCelebration = useCallback(() => {
    setCelebrationMilestone(null);
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streakData,
    isLoading,
    celebrationMilestone,
    recordActivity,
    dismissCelebration,
    refetch: fetchStreak,
  };
}
