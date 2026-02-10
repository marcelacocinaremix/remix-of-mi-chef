import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MealType = "desayuno" | "almuerzo" | "merienda" | "cena" | "entre_comidas";

export interface MealLog {
  id: string;
  user_id: string;
  meal_date: string;
  meal_type: MealType;
  food_name: string;
  source: "manual" | "search" | "recipe" | "ai";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string | null;
  recipe_data: any;
  created_at: string;
}

export interface MealLogInsert {
  meal_date?: string;
  meal_type: MealType;
  food_name: string;
  source?: "manual" | "search" | "recipe" | "ai";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion?: string;
  recipe_data?: any;
}

export function useMealLogs() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const fetchMeals = useCallback(async () => {
    if (!user) {
      setMeals([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("meal_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeals((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching meal logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = useCallback(
    async (meal: MealLogInsert): Promise<boolean> => {
      if (!user) return false;
      try {
        const { error } = await supabase.from("meal_logs" as any).insert([
          {
            user_id: user.id,
            meal_date: meal.meal_date || selectedDate,
            meal_type: meal.meal_type,
            food_name: meal.food_name,
            source: meal.source || "manual",
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            portion: meal.portion || null,
            recipe_data: meal.recipe_data || null,
          } as any,
        ]);
        if (error) throw error;
        await fetchMeals();
        return true;
      } catch (error) {
        console.error("Error adding meal:", error);
        return false;
      }
    },
    [user, selectedDate, fetchMeals]
  );

  const deleteMeal = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      try {
        const { error } = await supabase
          .from("meal_logs" as any)
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) throw error;
        await fetchMeals();
        return true;
      } catch (error) {
        console.error("Error deleting meal:", error);
        return false;
      }
    },
    [user, fetchMeals]
  );

  // Meals for selected date
  const dailyMeals = useMemo(() => {
    return meals.filter((m) => m.meal_date === selectedDate);
  }, [meals, selectedDate]);

  // Meals for a period
  const getMealsForPeriod = useCallback(
    (period: "day" | "week" | "month" | "year") => {
      const now = new Date();
      let cutoff: Date;
      if (period === "day") {
        cutoff = new Date(selectedDate);
      } else if (period === "week") {
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (period === "month") {
        cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - 1);
      } else {
        cutoff = new Date(now);
        cutoff.setFullYear(cutoff.getFullYear() - 1);
      }

      if (period === "day") {
        return meals.filter((m) => m.meal_date === selectedDate);
      }
      return meals.filter((m) => new Date(m.meal_date) >= cutoff);
    },
    [meals, selectedDate]
  );

  // Totals for period
  const getTotalsForPeriod = useCallback(
    (period: "day" | "week" | "month" | "year") => {
      const periodMeals = getMealsForPeriod(period);
      return periodMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + Number(m.calories),
          protein: acc.protein + Number(m.protein),
          carbs: acc.carbs + Number(m.carbs),
          fats: acc.fats + Number(m.fats),
          count: acc.count + 1,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 }
      );
    },
    [getMealsForPeriod]
  );

  // Daily totals for selected date
  const dailyTotals = useMemo(() => {
    return dailyMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + Number(m.calories),
        protein: acc.protein + Number(m.protein),
        carbs: acc.carbs + Number(m.carbs),
        fats: acc.fats + Number(m.fats),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [dailyMeals]);

  return {
    meals,
    dailyMeals,
    dailyTotals,
    isLoading,
    selectedDate,
    setSelectedDate,
    addMeal,
    deleteMeal,
    getMealsForPeriod,
    getTotalsForPeriod,
    refetch: fetchMeals,
  };
}
