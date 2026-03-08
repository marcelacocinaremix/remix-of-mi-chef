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
      // Use server-side RPC that validates and caps values — prevents direct API manipulation
      const { data, error } = await supabase.rpc("save_game_result" as any, {
        p_score: score,
        p_streak: streak,
        p_recipes_completed: recipesCompleted,
        p_time_played: timePlayed,
        p_mode: mode,
        p_xp_earned: xpEarned,
      });

      if (error) throw error;

      // Refresh stats from DB (server has the authoritative values after the trigger)
      await fetchStats();
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  }, [user, fetchStats]);

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

/** Fetches the country for the current user — checks profile first, then auth metadata.
 *  If found in auth metadata but not in profile, syncs it to the profile automatically. */
export async function getUserCountry(userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", userId)
    .single();

  if ((profile as any)?.country) return (profile as any).country;

  // Fallback: check auth user metadata (set during registration)
  const { data: { user } } = await supabase.auth.getUser();
  const metaCountry = user?.user_metadata?.country ?? null;

  // If found in metadata, sync to profile so it persists
  if (metaCountry) {
    await supabase
      .from("profiles")
      .upsert({ id: userId, country: metaCountry, updated_at: new Date().toISOString() });
  }

  return metaCountry;
}
