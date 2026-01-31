import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GameStats {
  highScore: number;
  totalGamesPlayed: number;
  bestStreak: number;
  totalRecipesCompleted: number;
  totalTimePlayed: number;
  lastPlayedAt: string | null;
}

export function useGameStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalGamesPlayed: 0,
    bestStreak: 0,
    totalRecipesCompleted: 0,
    totalTimePlayed: 0,
    lastPlayedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({
        highScore: 0,
        totalGamesPlayed: 0,
        bestStreak: 0,
        totalRecipesCompleted: 0,
        totalTimePlayed: 0,
        lastPlayedAt: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_game_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStats({
          highScore: data.high_score || 0,
          totalGamesPlayed: data.total_games_played || 0,
          bestStreak: data.best_streak || 0,
          totalRecipesCompleted: data.total_recipes_completed || 0,
          totalTimePlayed: data.total_time_played || 0,
          lastPlayedAt: data.last_played_at,
        });
      }
    } catch (error) {
      console.error("Error fetching game stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveGameResult = useCallback(async (
    score: number,
    streak: number,
    recipesCompleted: number,
    timePlayed: number
  ) => {
    if (!user) return;

    try {
      // Get current stats
      const { data: currentStats } = await supabase
        .from("user_game_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const newHighScore = Math.max(score, currentStats?.high_score || 0);
      const newBestStreak = Math.max(streak, currentStats?.best_streak || 0);
      const newTotalGames = (currentStats?.total_games_played || 0) + 1;
      const newTotalRecipes = (currentStats?.total_recipes_completed || 0) + recipesCompleted;
      const newTotalTime = (currentStats?.total_time_played || 0) + timePlayed;

      if (currentStats) {
        // Update existing stats
        await supabase
          .from("user_game_stats")
          .update({
            high_score: newHighScore,
            best_streak: newBestStreak,
            total_games_played: newTotalGames,
            total_recipes_completed: newTotalRecipes,
            total_time_played: newTotalTime,
            last_played_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Insert new stats
        await supabase.from("user_game_stats").insert({
          user_id: user.id,
          high_score: score,
          best_streak: streak,
          total_games_played: 1,
          total_recipes_completed: recipesCompleted,
          total_time_played: timePlayed,
          last_played_at: new Date().toISOString(),
        });
      }

      // Update local state
      setStats({
        highScore: newHighScore,
        totalGamesPlayed: newTotalGames,
        bestStreak: newBestStreak,
        totalRecipesCompleted: newTotalRecipes,
        totalTimePlayed: newTotalTime,
        lastPlayedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    saveGameResult,
    refetch: fetchStats,
  };
}
