import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  isUnlocked: boolean;
}

export interface CookingStats {
  totalRecipesCooked: number;
  currentStreak: number;
  longestStreak: number;
  lastCookedAt: string | null;
}

// Define all available achievements with translation keys
const ACHIEVEMENTS_CONFIG = [
  { type: "first_recipe", titleKey: "achievementFirstRecipe", descKey: "achievementFirstRecipeDesc", icon: "🎉", requiredRecipes: 1 },
  { type: "five_recipes", titleKey: "achievementFiveRecipes", descKey: "achievementFiveRecipesDesc", icon: "👨‍🍳", requiredRecipes: 5 },
  { type: "ten_recipes", titleKey: "achievementTenRecipes", descKey: "achievementTenRecipesDesc", icon: "⭐", requiredRecipes: 10 },
  { type: "twenty_recipes", titleKey: "achievementTwentyRecipes", descKey: "achievementTwentyRecipesDesc", icon: "🏆", requiredRecipes: 20 },
  { type: "fifty_recipes", titleKey: "achievementFiftyRecipes", descKey: "achievementFiftyRecipesDesc", icon: "👑", requiredRecipes: 50 },
  { type: "streak_3", titleKey: "achievementStreak3", descKey: "achievementStreak3Desc", icon: "🔥", requiredStreak: 3 },
  { type: "streak_7", titleKey: "achievementStreak7", descKey: "achievementStreak7Desc", icon: "💪", requiredStreak: 7 },
  // Game achievements
  { type: "game_chef", titleKey: "achievementGameChef", descKey: "achievementGameChefDesc", icon: "🎮", isGameAchievement: true },
  { type: "game_master", titleKey: "achievementGameMaster", descKey: "achievementGameMasterDesc", icon: "🕹️", isGameAchievement: true },
  // Daily streak achievements
  { type: "daily_streak_30", titleKey: "achievementDailyStreak30", descKey: "achievementDailyStreak30Desc", icon: "🏆", isDailyStreak: true },
  { type: "daily_streak_60", titleKey: "achievementDailyStreak60", descKey: "achievementDailyStreak60Desc", icon: "👑", isDailyStreak: true },
  { type: "daily_streak_90", titleKey: "achievementDailyStreak90", descKey: "achievementDailyStreak90Desc", icon: "⭐", isDailyStreak: true },
];

export function useAchievements() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<CookingStats>({
    totalRecipesCooked: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCookedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [marcelaMessage, setMarcelaMessage] = useState("");

  const tRef = { current: t };
  tRef.current = t;

  const updateMarcelaMessage = useCallback((totalRecipes: number, streak: number) => {
    const tr = tRef.current;
    if (totalRecipes === 0) {
      setMarcelaMessage(tr("marcelaMsgNoRecipes"));
    } else if (streak >= 3) {
      setMarcelaMessage(tr("marcelaMsgStreak"));
    } else if (totalRecipes >= 10) {
      setMarcelaMessage(tr("marcelaMsgManyRecipes"));
    } else {
      setMarcelaMessage(tr("marcelaMsgFewRecipes"));
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setStats({ totalRecipesCooked: 0, currentStreak: 0, longestStreak: 0, lastCookedAt: null });
      setIsLoading(false);
      updateMarcelaMessage(0, 0);
      return;
    }

    try {
      // Fetch user achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (achievementsError) throw achievementsError;

      // Fetch cooking stats
      const { data: statsData, error: statsError } = await supabase
        .from("user_cooking_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statsError) throw statsError;

      // Count from cooked_recipes if stats don't exist
      const { count, error: countError } = await supabase
        .from("cooked_recipes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) throw countError;

      const totalRecipes = statsData?.total_recipes_cooked ?? count ?? 0;
      const currentStreak = statsData?.current_streak ?? 0;
      const longestStreak = statsData?.longest_streak ?? 0;

      // Map achievements with unlocked status
      const unlockedTypes = new Set(achievementsData?.map(a => a.achievement_type) || []);
      const mappedAchievements: Achievement[] = ACHIEVEMENTS_CONFIG.map(config => ({
        id: config.type,
        type: config.type,
        title: tRef.current(config.titleKey as any),
        description: tRef.current(config.descKey as any),
        icon: config.icon,
        unlockedAt: achievementsData?.find(a => a.achievement_type === config.type)?.unlocked_at || null,
        isUnlocked: unlockedTypes.has(config.type),
      }));

      setAchievements(mappedAchievements);
      setStats({
        totalRecipesCooked: totalRecipes,
        currentStreak,
        longestStreak,
        lastCookedAt: statsData?.last_cooked_at || null,
      });
      updateMarcelaMessage(totalRecipes, currentStreak);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, updateMarcelaMessage, t]);

  const checkAndUnlockAchievements = useCallback(async (newTotal: number, newStreak: number) => {
    if (!user) return;

    const toUnlock: string[] = [];

    for (const config of ACHIEVEMENTS_CONFIG) {
      if (config.requiredRecipes && newTotal >= config.requiredRecipes) {
        toUnlock.push(config.type);
      }
      if (config.requiredStreak && newStreak >= config.requiredStreak) {
        toUnlock.push(config.type);
      }
    }

    // Get already unlocked
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("achievement_type")
      .eq("user_id", user.id);

    const existingTypes = new Set(existing?.map(e => e.achievement_type) || []);
    const newAchievements = toUnlock.filter(type => !existingTypes.has(type));

    // Insert new achievements via validated server-side function
    if (newAchievements.length > 0) {
      await Promise.all(
        newAchievements.map(type =>
          supabase.rpc("unlock_achievement", {
            p_achievement_type: type,
            p_recipe_count: newTotal,
          })
        )
      );
    }
  }, [user]);

  const recordCookedRecipe = useCallback(async () => {
    if (!user) return;

    try {
      // Get current stats
      const { data: currentStats } = await supabase
        .from("user_cooking_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newTotal = 1;
      let newStreak = 1;
      let newLongestStreak = 1;

      if (currentStats) {
        newTotal = (currentStats.total_recipes_cooked || 0) + 1;

        // Calculate streak
        if (currentStats.last_cooked_at) {
          const lastCooked = new Date(currentStats.last_cooked_at);
          lastCooked.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((today.getTime() - lastCooked.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day
            newStreak = (currentStats.current_streak || 0) + 1;
          } else if (diffDays === 0) {
            // Same day
            newStreak = currentStats.current_streak || 1;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }

        newLongestStreak = Math.max(newStreak, currentStats.longest_streak || 0);

        // Update existing stats
        await supabase
          .from("user_cooking_stats")
          .update({
            total_recipes_cooked: newTotal,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_cooked_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Insert new stats
        await supabase.from("user_cooking_stats").insert({
          user_id: user.id,
          total_recipes_cooked: 1,
          current_streak: 1,
          longest_streak: 1,
          last_cooked_at: new Date().toISOString(),
        });
      }

      // Check and unlock achievements
      await checkAndUnlockAchievements(newTotal, newStreak);

      // Refresh data
      await fetchAchievements();
    } catch (error) {
      console.error("Error recording cooked recipe:", error);
    }
  }, [user, checkAndUnlockAchievements, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Get next achievement to unlock
  const getNextAchievement = useCallback(() => {
    const locked = achievements.filter(a => !a.isUnlocked);
    if (locked.length === 0) return null;

    // Find the closest recipe-based achievement
    const recipeAchievements = ACHIEVEMENTS_CONFIG
      .filter(c => c.requiredRecipes && c.requiredRecipes > stats.totalRecipesCooked)
      .sort((a, b) => (a.requiredRecipes || 0) - (b.requiredRecipes || 0));

    if (recipeAchievements.length > 0) {
      const next = recipeAchievements[0];
      return {
        ...next,
        title: t(next.titleKey as any),
        description: t(next.descKey as any),
        progress: stats.totalRecipesCooked,
        target: next.requiredRecipes || 0,
      };
    }

    return null;
  }, [achievements, stats.totalRecipesCooked, t]);

  // Unlock game achievements
  const unlockGameAchievement = useCallback(async (achievementType: string) => {
    if (!user) return;
    
    // Check if already unlocked
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", user.id)
      .eq("achievement_type", achievementType)
      .maybeSingle();
    
    if (existing) return; // Already unlocked
    
    // Insert via validated server-side function
    await supabase.rpc("unlock_achievement", {
      p_achievement_type: achievementType,
      p_recipe_count: stats.totalRecipesCooked,
    });
    
    // Refresh achievements
    await fetchAchievements();
  }, [user, stats.totalRecipesCooked, fetchAchievements]);

  return {
    achievements,
    stats,
    isLoading,
    marcelaMessage,
    recordCookedRecipe,
    refetch: fetchAchievements,
    getNextAchievement,
    unlockGameAchievement,
  };
}
