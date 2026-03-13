import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Sparkles, BookOpen, X,
  Coffee, Sun, Cookie, Moon
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isTomorrow, addMonths, subMonths, startOfWeek, endOfWeek,
  getDay, differenceInCalendarDays
} from "date-fns";

import { es } from "date-fns/locale";

  const MEAL_TYPES = [
  { id: "desayuno", labelKey: "breakfast", icon: Coffee, color: "text-amber-500" },
  { id: "almuerzo", labelKey: "lunch", icon: Sun, color: "text-orange-500" },
  { id: "merienda", labelKey: "snack", icon: Cookie, color: "text-pink-500" },
  { id: "cena", labelKey: "dinner", icon: Moon, color: "text-indigo-500" },
] as const;

type MealType = typeof MEAL_TYPES[number]["id"];

interface DayMeal {
  id: string;
  mealType: MealType;
  recipeName: string;
  recipeData: Recipe;
}

// Helper to get week_start (Monday) and day_of_week from a Date
const getWeekStartAndDay = (date: Date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + mondayOffset);
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
  return {
    weekStart: weekStart.toISOString().split("T")[0],
    dayOfWeek: dayIndex,
  };
};

const dateFromWeekStartAndDay = (weekStart: string, dayOfWeek: number): Date => {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + dayOfWeek);
  return d;
};

interface MonthlyCalendarProps {
  onNavigateToCooking: () => void;
  onBlockedAction?: () => void;
}

export function MonthlyCalendar({ onNavigateToCooking, onBlockedAction }: MonthlyCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allMeals, setAllMeals] = useState<Record<string, DayMeal[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState<MealType | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [viewingAssignedRecipe, setViewingAssignedRecipe] = useState<Recipe | null>(null);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recipeTab, setRecipeTab] = useState<"favoritos" | "recientes">("favoritos");

  // Long press preview state
  const [longPressDay, setLongPressDay] = useState<Date | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const startLongPress = useCallback((day: Date, meals: DayMeal[]) => {
    if (meals.length === 0) return;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setLongPressDay(day);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Fetch meals for visible range
  useEffect(() => {
    if (user) {
      fetchMealsForRange();
      fetchFavoriteRecipes();
      fetchRecentRecipes();
    }
  }, [user, currentMonth]);

  const fetchMealsForRange = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Get all unique week_starts that could appear in this month view
      const weeks = new Set<string>();
      calendarDays.forEach((day) => {
        const { weekStart } = getWeekStartAndDay(day);
        weeks.add(weekStart);
      });

      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .in("week_start", Array.from(weeks));

      if (error) throw error;

      const mealsMap: Record<string, DayMeal[]> = {};
      (data || []).forEach((item) => {
        const date = dateFromWeekStartAndDay(item.week_start, item.day_of_week);
        const key = format(date, "yyyy-MM-dd");
        if (!mealsMap[key]) mealsMap[key] = [];
        mealsMap[key].push({
          id: item.id,
          mealType: item.meal_type as MealType,
          recipeName: item.recipe_name,
          recipeData: item.recipe_data as unknown as Recipe,
        });
      });
      setAllMeals(mealsMap);
    } catch (err) {
      console.error("Error fetching meals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoriteRecipes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setFavoriteRecipes((data || []).map((r) => r.recipe_data as unknown as Recipe));
    } catch {}
  };

  const fetchRecentRecipes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("cooked_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false })
        .limit(20);
      setRecentRecipes((data || []).map((r) => r.recipe_data as unknown as Recipe));
    } catch {}
  };

  const getMealsForDate = (date: Date): DayMeal[] => {
    return allMeals[format(date, "yyyy-MM-dd")] || [];
  };

  const handleAddRecipe = async (recipe: Recipe, mealType: MealType) => {
    if (!user || !selectedDate) return;

    const { weekStart, dayOfWeek } = getWeekStartAndDay(selectedDate);
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const existing = getMealsForDate(selectedDate).find((m) => m.mealType === mealType);
    // Only treat as existing if it has a real DB id (not a temp id)
    const hasRealId = existing && !existing.id.startsWith("temp-");
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    setAllMeals(prev => {
      const dayMeals = prev[dateKey] || [];
      const newMeal: DayMeal = { id: hasRealId ? existing.id : tempId, mealType, recipeName: recipe.name, recipeData: recipe };
      return {
        ...prev,
        [dateKey]: hasRealId
          ? dayMeals.map(m => m.mealType === mealType ? newMeal : m)
          : [...dayMeals.filter(m => m.mealType !== mealType), newMeal],
      };
    });
    setShowRecipeSelector(null);

    try {
      if (hasRealId) {
        const { error } = await supabase
          .from("meal_plans")
          .update({ recipe_data: JSON.parse(JSON.stringify(recipe)), recipe_name: recipe.name })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // If there's a stale temp entry for this meal type, delete it first
        if (existing) {
          await supabase.from("meal_plans")
            .delete()
            .eq("user_id", user.id)
            .eq("week_start", weekStart)
            .eq("day_of_week", dayOfWeek)
            .eq("meal_type", mealType);
        }
        const { data, error } = await supabase.from("meal_plans").insert({
          user_id: user.id,
          week_start: weekStart,
          day_of_week: dayOfWeek,
          meal_type: mealType,
          recipe_data: JSON.parse(JSON.stringify(recipe)),
          recipe_name: recipe.name,
        }).select().single();
        if (error) throw error;
        // Replace temp id with real id
        if (data) {
          setAllMeals(prev => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).map(m => m.id === tempId ? { ...m, id: data.id } : m),
          }));
        }
      }
      toast({ title: t("calendarRecipeAdded"), description: `${recipe.name} · ${format(selectedDate, "EEEE d", { locale: es })}` });
    } catch (err) {
      console.error("Error adding recipe to calendar:", err);
      // Rollback
      await fetchMealsForRange();
      toast({ title: t("error"), description: t("calendarAddError"), variant: "destructive" });
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    // Optimistic removal
    setAllMeals(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].filter(m => m.id !== mealId);
      }
      return updated;
    });

    try {
      const { error } = await supabase.from("meal_plans").delete().eq("id", mealId);
      if (error) throw error;
      toast({ title: t("calendarRecipeRemoved") });
    } catch {
      // Rollback
      await fetchMealsForRange();
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  const dayMeals = selectedDate ? getMealsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Help banner */}
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-bold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const inMonth = day.getMonth() === currentMonth.getMonth();
            const meals = getMealsForDate(day);
            const hasMeals = meals.length > 0;
            const today = isToday(day);
            const tomorrow = isTomorrow(day);
            const now = new Date();
            const diff = differenceInCalendarDays(day, now);
            const isNear = diff >= 2 && diff <= 4;

            return (
              <button
                key={i}
                onClick={() => {
                  if (!longPressFired.current) setSelectedDate(day);
                }}
                onMouseDown={() => startLongPress(day, meals)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(day, meals)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                className={cn(
                  "relative flex flex-col items-center justify-start p-1 min-h-[52px] sm:min-h-[64px] border-b border-r border-border/20 transition-colors select-none",
                  inMonth ? "bg-background" : "bg-muted/30",
                  // Proximity highlights (no meals)
                  !hasMeals && today && "bg-primary/15 ring-2 ring-primary ring-inset",
                  !hasMeals && tomorrow && "bg-primary/8",
                  !hasMeals && isNear && inMonth && "bg-primary/4",
                  // Green bg when has meals
                  hasMeals && "bg-emerald-500/15",
                  hasMeals && today && "bg-emerald-500/25 ring-2 ring-emerald-500 ring-inset",
                  hasMeals && tomorrow && "bg-emerald-500/20",
                  hasMeals && isNear && inMonth && "bg-emerald-500/18",
                  // Selection
                  selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-primary/60 ring-inset",
                  "hover:bg-accent/50 active:scale-95"
                )}
              >
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium",
                    !inMonth && "text-muted-foreground/40",
                    today && "text-primary font-bold",
                    tomorrow && "text-primary/80 font-semibold"
                  )}
                >
                  {format(day, "d")}
                </span>
                {hasMeals && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {meals.length <= 2 ? (
                      meals.map((m, j) => (
                        <span key={j} className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight line-clamp-1 max-w-full text-center">
                          {m.recipeName.length > 8 ? m.recipeName.slice(0, 8) + "…" : m.recipeName}
                        </span>
                      ))
                    ) : (
                      <div className="flex gap-0.5">
                        {meals.map((_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail modal */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              📅 {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </DialogTitle>
            <DialogDescription>{t("calendarOrganize")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {MEAL_TYPES.map((mt) => {
              const Icon = mt.icon;
              const meal = dayMeals.find((m) => m.mealType === mt.id);

              return (
                <div
                  key={mt.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30"
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", mt.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{t(mt.labelKey as any)}</p>
                    {meal ? (
                      <button
                        className="text-sm font-semibold truncate text-left hover:text-primary transition-colors"
                        onClick={() => setViewingAssignedRecipe(meal.recipeData)}
                      >
                        {meal.recipeName}
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{meal ? meal.recipeName : t("calendarNotAssigned")}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {meal ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (onBlockedAction) { onBlockedAction(); return; }
                          handleRemoveMeal(meal.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (onBlockedAction) { onBlockedAction(); return; }
                        setShowRecipeSelector(mt.id);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => {
                setSelectedDate(null);
                onNavigateToCooking();
              }}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {t("calendarGenerateRecipe")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe selector modal */}
      <Dialog open={!!showRecipeSelector && !previewRecipe} onOpenChange={(open) => !open && setShowRecipeSelector(null)}>
        <DialogContent className="max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{t("calendarChooseRecipe")}</DialogTitle>
            <DialogDescription>
              {showRecipeSelector && `${t("calendarForMealType")} ${t(MEAL_TYPES.find((m) => m.id === showRecipeSelector)?.labelKey as any)}`}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={recipeTab === "favoritos" ? "default" : "outline"}
              size="sm"
              onClick={() => setRecipeTab("favoritos")}
            >
              <span className="font-semibold text-sm text-foreground">{t("calendarFavorites")}</span>
            </Button>
            <Button
              variant={recipeTab === "recientes" ? "default" : "outline"}
              size="sm"
              onClick={() => setRecipeTab("recientes")}
            >
              <span className="font-semibold text-sm text-foreground">{t("calendarRecent")}</span>
            </Button>
          </div>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {(recipeTab === "favoritos" ? favoriteRecipes : recentRecipes).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {recipeTab === "favoritos"
                    ? t("calendarNoFavorites")
                    : t("calendarNoRecent")}
                </p>
              ) : (
                (recipeTab === "favoritos" ? favoriteRecipes : recentRecipes).map((recipe, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewRecipe(recipe)}
                    className="w-full text-left p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{recipe.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {recipe.time} min · {recipe.difficulty}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Generate new */}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              setShowRecipeSelector(null);
              setSelectedDate(null);
              onNavigateToCooking();
            }}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {t("calendarGenerateNew")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Recipe preview modal */}
      <Dialog open={!!previewRecipe} onOpenChange={(open) => !open && setPreviewRecipe(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{previewRecipe?.name}</DialogTitle>
            <DialogDescription>
              {previewRecipe?.time} min · {previewRecipe?.difficulty}
              {previewRecipe?.servings ? ` · ${previewRecipe.servings}` : ""}
            </DialogDescription>
          </DialogHeader>

          {previewRecipe && (
            <div className="space-y-4">
              {/* Ingredients */}
              {previewRecipe.ingredients && previewRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {t("calendarIngredients")}
                  </h4>
                  <ul className="space-y-1">
                    {previewRecipe.ingredients.map((ing, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {previewRecipe.steps && previewRecipe.steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t("calendarPreparation")}
                  </h4>
                  <ol className="space-y-2">
                    {previewRecipe.steps.map((step, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewRecipe(null)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("calendarBack")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (showRecipeSelector && previewRecipe) {
                      handleAddRecipe(previewRecipe, showRecipeSelector);
                      setPreviewRecipe(null);
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("calendarAdd")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assigned recipe detail modal */}
      <Dialog open={!!viewingAssignedRecipe} onOpenChange={(open) => !open && setViewingAssignedRecipe(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{viewingAssignedRecipe?.name}</DialogTitle>
            <DialogDescription>
              {viewingAssignedRecipe?.time} min · {viewingAssignedRecipe?.difficulty}
              {viewingAssignedRecipe?.servings ? ` · ${viewingAssignedRecipe.servings}` : ""}
            </DialogDescription>
          </DialogHeader>

          {viewingAssignedRecipe && (
            <div className="space-y-4">
              {viewingAssignedRecipe.ingredients && viewingAssignedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {t("calendarIngredients")}
                  </h4>
                  <ul className="space-y-1">
                    {viewingAssignedRecipe.ingredients.map((ing, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingAssignedRecipe.steps && viewingAssignedRecipe.steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t("calendarPreparation")}
                  </h4>
                  <ol className="space-y-2">
                    {viewingAssignedRecipe.steps.map((step, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setViewingAssignedRecipe(null)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("calendarBack")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Long press preview modal */}
      <Dialog open={!!longPressDay} onOpenChange={(open) => !open && setLongPressDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize text-base">
              📅 {longPressDay && format(longPressDay, "EEEE d 'de' MMMM", { locale: es })}
            </DialogTitle>
            <DialogDescription>{t("calendarQuickView")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {longPressDay && getMealsForDate(longPressDay).map((meal) => {
              const mt = MEAL_TYPES.find((m) => m.id === meal.mealType);
              const Icon = mt?.icon ?? Sun;
              return (
                <div key={meal.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
                  <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", mt?.color)} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{mt ? t(mt.labelKey as any) : ""}</p>
                    <p className="text-sm font-semibold leading-snug">{meal.recipeName}</p>
                    {meal.recipeData?.time && (
                      <p className="text-xs text-muted-foreground mt-0.5">{meal.recipeData.time} min · {meal.recipeData.difficulty}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            className="w-full mt-1"
            onClick={() => {
              if (longPressDay) setSelectedDate(longPressDay);
              setLongPressDay(null);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("calendarEditDay")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
