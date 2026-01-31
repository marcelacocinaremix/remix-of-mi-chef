import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CookedRecipe {
  id: string;
  recipe_name: string;
  recipe_data: any;
  cooked_at: string;
}

export function useCookedRecipes() {
  const { user } = useAuth();
  const [cookedRecipes, setCookedRecipes] = useState<CookedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCookedRecipes = useCallback(async () => {
    if (!user) {
      setCookedRecipes([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cooked_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false });

      if (error) throw error;
      setCookedRecipes(data || []);
    } catch (error) {
      console.error("Error fetching cooked recipes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCookedRecipes();
  }, [fetchCookedRecipes]);

  const getRecentRecipeNames = (days: number = 30): string[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return cookedRecipes
      .filter((recipe) => new Date(recipe.cooked_at) >= cutoffDate)
      .map((recipe) => recipe.recipe_name.toLowerCase());
  };

  const hasBeenCookedRecently = (recipeName: string, days: number = 7): boolean => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return cookedRecipes.some(
      (recipe) =>
        recipe.recipe_name.toLowerCase() === recipeName.toLowerCase() &&
        new Date(recipe.cooked_at) >= cutoffDate
    );
  };

  const addCookedRecipe = useCallback(async (recipe: { name: string; [key: string]: any }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("cooked_recipes")
        .insert([{
          user_id: user.id,
          recipe_name: recipe.name,
          recipe_data: JSON.parse(JSON.stringify(recipe)),
        }]);

      if (error) throw error;
      
      // Refresh the list
      await fetchCookedRecipes();
      return true;
    } catch (error) {
      console.error("Error adding cooked recipe:", error);
      return false;
    }
  }, [user, fetchCookedRecipes]);

  return {
    cookedRecipes,
    isLoading,
    refetch: fetchCookedRecipes,
    getRecentRecipeNames,
    hasBeenCookedRecently,
    addCookedRecipe,
  };
}
