import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCountryFlag } from "@/data/countries";

export interface GameStats {
  highScore: number;
  totalGamesPlayed: number;
  bestStreak: number;
  totalRecipesCompleted: number;
  totalTimePlayed: number;
  totalXP: number;
  lastPlayedAt: string | null;
}

export interface GameSession {
  id: string;
  mode: string;
  score: number;
  streak: number;
  recipesCompleted: number;
  timePlayed: number;
  xpEarned: number;
  playedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXP: number;
  totalGamesPlayed: number;
  rank: number;
  country: string | null; // flag emoji or null
}

export function useGameStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalGamesPlayed: 0,
    bestStreak: 0,
    totalRecipesCompleted: 0,
    totalTimePlayed: 0,
    totalXP: 0,
    lastPlayedAt: null,
  });
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({ highScore: 0, totalGamesPlayed: 0, bestStreak: 0, totalRecipesCompleted: 0, totalTimePlayed: 0, totalXP: 0, lastPlayedAt: null });
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      const [statsRes, sessionsRes] = await Promise.all([
        supabase.from("user_game_stats").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("game_sessions").select("*").eq("user_id", user.id).order("played_at", { ascending: false }).limit(20),
      ]);

      if (statsRes.data) {
        setStats({
          highScore: statsRes.data.high_score || 0,
          totalGamesPlayed: statsRes.data.total_games_played || 0,
          bestStreak: statsRes.data.best_streak || 0,
          totalRecipesCompleted: statsRes.data.total_recipes_completed || 0,
          totalTimePlayed: statsRes.data.total_time_played || 0,
          totalXP: (statsRes.data as any).total_xp || 0,
          lastPlayedAt: statsRes.data.last_played_at,
        });
      }

      if (sessionsRes.data) {
        setSessions(sessionsRes.data.map((s: any) => ({
          id: s.id,
          mode: s.mode,
          score: s.score,
          streak: s.streak,
          recipesCompleted: s.recipes_completed,
          timePlayed: s.time_played,
          xpEarned: s.xp_earned,
          playedAt: s.played_at,
        })));
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
    timePlayed: number,
    mode: string = "recipe",
    xpEarned: number = 0
  ) => {
    if (!user) return;

    try {
      const { data: currentStats } = await supabase
        .from("user_game_stats").select("*").eq("user_id", user.id).maybeSingle();

      const newHighScore = Math.max(score, currentStats?.high_score || 0);
      const newBestStreak = Math.max(streak, currentStats?.best_streak || 0);
      const newTotalGames = (currentStats?.total_games_played || 0) + 1;
      const newTotalRecipes = (currentStats?.total_recipes_completed || 0) + recipesCompleted;
      const newTotalTime = (currentStats?.total_time_played || 0) + timePlayed;
      const newTotalXP = ((currentStats as any)?.total_xp || 0) + xpEarned;

      await Promise.all([
        currentStats
          ? supabase.from("user_game_stats").update({
              high_score: newHighScore, best_streak: newBestStreak,
              total_games_played: newTotalGames, total_recipes_completed: newTotalRecipes,
              total_time_played: newTotalTime, last_played_at: new Date().toISOString(),
              total_xp: newTotalXP,
            } as any).eq("user_id", user.id)
          : supabase.from("user_game_stats").insert({
              user_id: user.id, high_score: score, best_streak: streak,
              total_games_played: 1, total_recipes_completed: recipesCompleted,
              total_time_played: timePlayed, last_played_at: new Date().toISOString(),
              total_xp: xpEarned,
            } as any),
        supabase.from("game_sessions").insert({
          user_id: user.id,
          mode,
          score,
          streak,
          recipes_completed: recipesCompleted,
          time_played: timePlayed,
          xp_earned: xpEarned,
        }),
      ]);

      setStats({
        highScore: newHighScore, totalGamesPlayed: newTotalGames, bestStreak: newBestStreak,
        totalRecipesCompleted: newTotalRecipes, totalTimePlayed: newTotalTime,
        totalXP: newTotalXP, lastPlayedAt: new Date().toISOString(),
      });

      const { data: newSessions } = await supabase
        .from("game_sessions").select("*").eq("user_id", user.id)
        .order("played_at", { ascending: false }).limit(20);
      if (newSessions) {
        setSessions(newSessions.map((s: any) => ({
          id: s.id, mode: s.mode, score: s.score, streak: s.streak,
          recipesCompleted: s.recipes_completed, timePlayed: s.time_played,
          xpEarned: s.xp_earned, playedAt: s.played_at,
        })));
      }
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, sessions, isLoading, saveGameResult, refetch: fetchStats };
}

export function useGameLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase.rpc("get_xp_leaderboard" as any);
        if (error) throw error;
        if (data) {
          setLeaderboard((data as any[]).map((row) => ({
            userId: row.user_id,
            displayName: row.display_name || "Chef",
            avatarUrl: row.avatar_url,
            totalXP: row.total_xp,
            totalGamesPlayed: row.total_games_played,
            rank: Number(row.rank),
            country: row.country ? getCountryFlag(row.country) : null,
          })));
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { leaderboard, isLoading };
}

/** Fetches only the country for the current user's profile */
export async function getUserCountry(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", userId)
    .single();
  return (data as any)?.country ?? null;
}
