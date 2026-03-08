import { useState, useEffect } from "react";
import { 
  Calendar, ChefHat, Clock, Users, Plus, X, Sparkles, 
  ShoppingCart, ArrowLeft, Lightbulb, RefreshCw, Utensils,
  Sun, Moon, ChevronLeft, ChevronRight, Trash2, Save, AlertTriangle,
  GripVertical, Copy
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/components/RecipeList";
import { RecipeDetail } from "@/components/RecipeDetail";
import { ShoppingList } from "@/components/ShoppingList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdvancedFilters, FiltersState } from "@/components/AdvancedFilters";
import { MealSlotDraggable } from "@/components/MealSlotDraggable";
import { WeekTemplates, WeekTemplate } from "@/components/WeekTemplates";
import { WeekProgress } from "@/components/WeekProgress";
import { DuplicateMealDialog } from "@/components/DuplicateMealDialog";

interface MealPlan {
  id?: string;
  dayOfWeek: number;
  mealType: 'almuerzo' | 'cena';
  recipe: Recipe;
}

interface WeeklyCalendarProps {
  ingredients: string[];
  pantryItems?: string[];
  onBack: () => void;
  onStateChange?: (state: { isActive: boolean; isGeneratingAI: boolean; mealsPlanned: number }) => void;
}

const DAYS = [
  { name: 'Lunes', short: 'Lun', emoji: '🌙' },
  { name: 'Martes', short: 'Mar', emoji: '🔥' },
  { name: 'Miércoles', short: 'Mié', emoji: '💧' },
  { name: 'Jueves', short: 'Jue', emoji: '⚡' },
  { name: 'Viernes', short: 'Vie', emoji: '🎉' },
  { name: 'Sábado', short: 'Sáb', emoji: '🌟' },
  { name: 'Domingo', short: 'Dom', emoji: '☀️' },
];

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${weekStart.toLocaleDateString('es-AR', options)} - ${weekEnd.toLocaleDateString('es-AR', options)}`;
};

const initialFilters: FiltersState = {
  difficulty: null,
  diet: [],
  excludeIngredients: [],
  servings: null,
  cookingMethod: null,
  budget: null,
  maxTime: null,
};

export function WeeklyCalendar({ ingredients, pantryItems = [], onBack, onStateChange }: WeeklyCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const shoppingList = useShoppingList();
  
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{ day: number; meal: 'almuerzo' | 'cena' } | null>(null);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Drag & Drop state
  const [draggedMeal, setDraggedMeal] = useState<MealPlan | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Duplicate dialog state
  const [duplicateRecipe, setDuplicateRecipe] = useState<{ recipe: Recipe; day: number; meal: 'almuerzo' | 'cena' } | null>(null);

  // Update parent state
  useEffect(() => {
    onStateChange?.({
      isActive: true,
      isGeneratingAI,
      mealsPlanned: mealPlans.length
    });
  }, [isGeneratingAI, mealPlans.length, onStateChange]);

  // Fetch meal plans for current week
  useEffect(() => {
    if (user) {
      fetchMealPlans();
      fetchFavoriteRecipes();
    }
  }, [user, currentWeek]);

  const fetchMealPlans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const weekStartStr = currentWeek.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr);

      if (error) throw error;

      const plans: MealPlan[] = (data || []).map(item => ({
        id: item.id,
        dayOfWeek: item.day_of_week,
        mealType: item.meal_type as 'almuerzo' | 'cena',
        recipe: item.recipe_data as unknown as Recipe,
      }));

      setMealPlans(plans);
      calculateIngredientSuggestions(plans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoriteRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recipes: Recipe[] = (data || []).map(item => item.recipe_data as unknown as Recipe);
      setFavoriteRecipes(recipes);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    }
  };

  const calculateIngredientSuggestions = (plans: MealPlan[]) => {
    // Count ingredient occurrences
    const ingredientCount: Record<string, number> = {};
    
    plans.forEach(plan => {
      plan.recipe.ingredients.forEach(ing => {
        const normalized = ing.toLowerCase().split(' ').slice(-1)[0]; // Get main ingredient
        ingredientCount[normalized] = (ingredientCount[normalized] || 0) + 1;
      });
    });

    // Find ingredients used multiple times
    const suggestions = Object.entries(ingredientCount)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ing]) => ing);

    setIngredientSuggestions(suggestions);
  };

  const getMealForSlot = (dayIndex: number, mealType: 'almuerzo' | 'cena'): MealPlan | undefined => {
    return mealPlans.find(p => p.dayOfWeek === dayIndex && p.mealType === mealType);
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!user || !showRecipeSelector) return;

    const { day, meal } = showRecipeSelector;
    const weekStartStr = currentWeek.toISOString().split('T')[0];

    try {
      // Check if exists
      const existingPlan = getMealForSlot(day, meal);

      if (existingPlan?.id) {
        // Update
        const { error } = await supabase
          .from('meal_plans')
          .update({
            recipe_data: JSON.parse(JSON.stringify(recipe)),
            recipe_name: recipe.name,
          })
          .eq('id', existingPlan.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            week_start: weekStartStr,
            day_of_week: day,
            meal_type: meal,
            recipe_data: JSON.parse(JSON.stringify(recipe)),
            recipe_name: recipe.name,
          });

        if (error) throw error;
      }

      await fetchMealPlans();
      setShowRecipeSelector(null);
      toast({
        title: "¡Receta agregada!",
        description: `${recipe.name} agregada para el ${DAYS[day].name}`,
      });
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la receta",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRecipe = async (dayIndex: number, mealType: 'almuerzo' | 'cena') => {
    const plan = getMealForSlot(dayIndex, mealType);
    if (!plan?.id) return;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      await fetchMealPlans();
      toast({
        title: "Receta eliminada",
        description: "Se quitó la receta del calendario",
      });
    } catch (error) {
      console.error('Error removing recipe:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la receta",
        variant: "destructive",
      });
    }
  };

  const handleBuildWeekAI = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para usar esta función",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      const allIngredients = [...new Set([...ingredients, ...pantryItems])];
      
      const { data, error } = await supabase.functions.invoke('generate-weekly-calendar', {
        body: {
          ingredients: allIngredients,
          existingPlans: mealPlans.map(p => ({
            day: p.dayOfWeek,
            meal: p.mealType,
            recipeName: p.recipe.name
          })),
          filters: {
            difficulty: filters.difficulty,
            diet: filters.diet,
            excludeIngredients: filters.excludeIngredients,
            servings: filters.servings,
            cookingMethod: filters.cookingMethod,
            budget: filters.budget,
            maxTime: filters.maxTime,
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.weeklyPlan) {
        const weekStartStr = currentWeek.toISOString().split('T')[0];
        
        // Save all generated recipes
        for (const plan of data.weeklyPlan) {
          const existingPlan = getMealForSlot(plan.dayOfWeek, plan.mealType);
          
          if (!existingPlan) {
            await supabase.from('meal_plans').insert({
              user_id: user.id,
              week_start: weekStartStr,
              day_of_week: plan.dayOfWeek,
              meal_type: plan.mealType,
              recipe_data: JSON.parse(JSON.stringify(plan.recipe)),
              recipe_name: plan.recipe.name,
            });
          }
        }

        await fetchMealPlans();
      toast({ title: t("weeklyBuildDone"), description: t("weeklyBuildDoneDesc") });
      }
    } catch (error) {
      console.error('Error generating AI plan:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el plan",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleClearWeek = async () => {
    if (!user || mealPlans.length === 0) return;

    setIsClearing(true);
    try {
      const weekStartStr = currentWeek.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr);

      if (error) throw error;

      setMealPlans([]);
      setIngredientSuggestions([]);
      setShowClearConfirm(false);
      toast({ title: t("weeklyDeletedToast"), description: t("weeklyDeletedToastDesc") });
    } catch (error) {
      console.error('Error clearing week:', error);
      toast({
        title: "Error",
        description: "No se pudo borrar el plan",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const generateShoppingListFromPlan = (): Record<string, string[]> => {
    const categories: Record<string, string[]> = {
      'Verduras': [],
      'Carnes': [],
      'Lácteos': [],
      'Almacén': [],
      'Condimentos': [],
      'Otros': [],
    };

    const allIngredients = new Set<string>();
    
    mealPlans.forEach(plan => {
      plan.recipe.ingredients.forEach(ing => {
        if (!allIngredients.has(ing)) {
          allIngredients.add(ing);
          // Simple categorization
          const lowerIng = ing.toLowerCase();
          if (lowerIng.includes('carne') || lowerIng.includes('pollo') || lowerIng.includes('cerdo') || lowerIng.includes('pescado')) {
            categories['Carnes'].push(ing);
          } else if (lowerIng.includes('leche') || lowerIng.includes('queso') || lowerIng.includes('crema') || lowerIng.includes('yogur')) {
            categories['Lácteos'].push(ing);
          } else if (lowerIng.includes('sal') || lowerIng.includes('pimienta') || lowerIng.includes('orégano') || lowerIng.includes('ajo')) {
            categories['Condimentos'].push(ing);
          } else if (lowerIng.includes('tomate') || lowerIng.includes('cebolla') || lowerIng.includes('papa') || lowerIng.includes('zanahoria') || lowerIng.includes('lechuga')) {
            categories['Verduras'].push(ing);
          } else if (lowerIng.includes('arroz') || lowerIng.includes('fideos') || lowerIng.includes('harina') || lowerIng.includes('aceite')) {
            categories['Almacén'].push(ing);
          } else {
            categories['Otros'].push(ing);
          }
        }
      });
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) delete categories[key];
    });

    return categories;
  };

  const handleAddToShoppingList = async () => {
    const items = generateShoppingListFromPlan();
    let count = 0;

    for (const [category, categoryItems] of Object.entries(items)) {
      for (const item of categoryItems) {
        await shoppingList.addItem(item, category);
        count++;
      }
    }

      toast({ title: `${t("weeklyListUpdated")}`, description: `${t("weeklyListUpdatedDesc").replace("{count}", String(count))}` });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  // Drag & Drop handlers
  const handleDragStart = (meal: MealPlan) => {
    setDraggedMeal(meal);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedMeal(null);
    setIsDragging(false);
  };

  const handleDrop = async (targetDay: number, targetMeal: 'almuerzo' | 'cena') => {
    if (!user || !draggedMeal) return;
    
    const sourceDay = draggedMeal.dayOfWeek;
    const sourceMeal = draggedMeal.mealType;
    
    // Don't drop on same slot
    if (sourceDay === targetDay && sourceMeal === targetMeal) {
      handleDragEnd();
      return;
    }

    const weekStartStr = currentWeek.toISOString().split('T')[0];

    try {
      // Check if target slot has a meal
      const existingTarget = getMealForSlot(targetDay, targetMeal);
      
      if (existingTarget?.id) {
        // Swap: update target slot with source recipe, then update source with target recipe
        await supabase
          .from('meal_plans')
          .update({
            recipe_data: JSON.parse(JSON.stringify(draggedMeal.recipe)),
            recipe_name: draggedMeal.recipe.name,
          })
          .eq('id', existingTarget.id);
          
        if (draggedMeal.id) {
          await supabase
            .from('meal_plans')
            .update({
              recipe_data: JSON.parse(JSON.stringify(existingTarget.recipe)),
              recipe_name: existingTarget.recipe.name,
            })
            .eq('id', draggedMeal.id);
        }
        
        toast({
          title: "¡Recetas intercambiadas!",
          description: `${DAYS[sourceDay].name} ↔ ${DAYS[targetDay].name}`,
        });
      } else {
        // Move: update source to new position
        if (draggedMeal.id) {
          await supabase
            .from('meal_plans')
            .update({
              day_of_week: targetDay,
              meal_type: targetMeal,
            })
            .eq('id', draggedMeal.id);
        } else {
          // Insert new
          await supabase
            .from('meal_plans')
            .insert({
              user_id: user.id,
              week_start: weekStartStr,
              day_of_week: targetDay,
              meal_type: targetMeal,
              recipe_data: JSON.parse(JSON.stringify(draggedMeal.recipe)),
              recipe_name: draggedMeal.recipe.name,
            });
        }
        
        toast({
          title: "¡Receta movida!",
          description: `Movida a ${DAYS[targetDay].name} - ${targetMeal}`,
        });
      }

      await fetchMealPlans();
    } catch (error) {
      console.error('Error moving meal:', error);
      toast({
        title: "Error",
        description: "No se pudo mover la receta",
        variant: "destructive",
      });
    } finally {
      handleDragEnd();
    }
  };

  // Duplicate meal handler
  const handleDuplicateMeal = async (targets: { dayIndex: number; mealType: 'almuerzo' | 'cena' }[]) => {
    if (!user || !duplicateRecipe) return;

    const weekStartStr = currentWeek.toISOString().split('T')[0];

    try {
      for (const target of targets) {
        const existing = getMealForSlot(target.dayIndex, target.mealType);
        
        if (existing?.id) {
          // Update existing
          await supabase
            .from('meal_plans')
            .update({
              recipe_data: JSON.parse(JSON.stringify(duplicateRecipe.recipe)),
              recipe_name: duplicateRecipe.recipe.name,
            })
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('meal_plans')
            .insert({
              user_id: user.id,
              week_start: weekStartStr,
              day_of_week: target.dayIndex,
              meal_type: target.mealType,
              recipe_data: JSON.parse(JSON.stringify(duplicateRecipe.recipe)),
              recipe_name: duplicateRecipe.recipe.name,
            });
        }
      }

      await fetchMealPlans();
      toast({
        title: "¡Receta copiada!",
        description: `"${duplicateRecipe.recipe.name}" copiada a ${targets.length} ${targets.length === 1 ? 'lugar' : 'lugares'}`,
      });
    } catch (error) {
      console.error('Error duplicating meal:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar la receta",
        variant: "destructive",
      });
    }
  };

  // Template handler
  const handleTemplateSelect = async (template: WeekTemplate) => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para usar plantillas",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      const allIngredients = [...new Set([...ingredients, ...pantryItems])];
      
      const { data, error } = await supabase.functions.invoke('generate-weekly-calendar', {
        body: {
          ingredients: allIngredients,
          existingPlans: mealPlans.map(p => ({
            day: p.dayOfWeek,
            meal: p.mealType,
            recipeName: p.recipe.name
          })),
          filters: {
            difficulty: template.characteristics.difficulty === 'fácil' ? 'facil' : template.characteristics.difficulty,
            diet: template.tags,
            maxTime: template.characteristics.avgTime + 10,
          },
          templateStyle: template.id,
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.weeklyPlan) {
        const weekStartStr = currentWeek.toISOString().split('T')[0];
        
        for (const plan of data.weeklyPlan) {
          const existingPlan = getMealForSlot(plan.dayOfWeek, plan.mealType);
          
          if (!existingPlan) {
            await supabase.from('meal_plans').insert({
              user_id: user.id,
              week_start: weekStartStr,
              day_of_week: plan.dayOfWeek,
              meal_type: plan.mealType,
              recipe_data: JSON.parse(JSON.stringify(plan.recipe)),
              recipe_name: plan.recipe.name,
            });
          }
        }

        await fetchMealPlans();
        toast({
          title: `¡Plantilla "${template.name}" aplicada!`,
          description: "Tu plan semanal está listo",
        });
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo aplicar la plantilla",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (selectedRecipe) {
    return (
      <RecipeDetail 
        recipe={selectedRecipe} 
        onBack={() => setSelectedRecipe(null)}
        pantryItems={pantryItems}
        onAddToShoppingList={shoppingList.addItem}
      />
    );
  }

  if (showShoppingList) {
    return (
      <ShoppingList 
        shoppingList={generateShoppingListFromPlan()}
        pantryItems={pantryItems}
        onBack={() => setShowShoppingList(false)} 
      />
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("weeklyBackToHome")}
      </Button>

      <div className={cn(
        "bg-card rounded-2xl p-4 md:p-6",
        "shadow-elevated border border-border/50"
      )}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {t("weeklyPlanTitle")}
            </h2>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium text-sm md:text-base px-3">
              {formatWeekRange(currentWeek)}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Week Progress */}
        <WeekProgress 
          totalSlots={14} 
          filledSlots={mealPlans.length} 
          className="mb-6"
        />

        {/* Filters */}
        <div className="mb-6">
          <AdvancedFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={handleBuildWeekAI}
            disabled={isGeneratingAI || !user}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white"
          >
            <Sparkles className={cn("w-4 h-4", isGeneratingAI && "animate-spin")} />
            {isGeneratingAI ? "Armando..." : "Armarme la semana"}
          </Button>
          
          <WeekTemplates 
            onSelectTemplate={handleTemplateSelect}
            isLoading={isGeneratingAI}
          />
          
          {mealPlans.length > 0 && (
            <>
              <Button variant="outline" onClick={() => setShowShoppingList(true)}>
                <ShoppingCart className="w-4 h-4" />
                Ver lista de compras
              </Button>
              <Button variant="outline" onClick={handleAddToShoppingList}>
                <Plus className="w-4 h-4" />
                Agregar todo al super
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowClearConfirm(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-4 h-4" />
                Borrar plan
              </Button>
            </>
          )}
        </div>

        {/* Smart suggestions */}
        {ingredientSuggestions.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  💡 Sugerencia inteligente
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Estos ingredientes se repiten en tu plan. ¡Comprá más para aprovecharlos!: 
                  <span className="font-semibold"> {ingredientSuggestions.join(', ')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
          {DAYS.map((day, dayIndex) => (
            <div
              key={day.name}
              className={cn(
                "bg-secondary/30 rounded-xl p-3 border border-border/30",
                "flex flex-col min-h-[180px]"
              )}
            >
              {/* Day header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                <span className="text-lg">{day.emoji}</span>
                <span className="font-semibold text-foreground text-sm md:text-base">{day.short}</span>
              </div>

              {/* Almuerzo slot */}
              <MealSlotDraggable
                meal={getMealForSlot(dayIndex, 'almuerzo')}
                mealType="almuerzo"
                dayIndex={dayIndex}
                onAdd={() => setShowRecipeSelector({ day: dayIndex, meal: 'almuerzo' })}
                onView={(recipe) => setSelectedRecipe(recipe)}
                onRemove={() => handleRemoveRecipe(dayIndex, 'almuerzo')}
                onDuplicate={(recipe) => setDuplicateRecipe({ recipe, day: dayIndex, meal: 'almuerzo' })}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                isDragging={isDragging}
                draggedMeal={draggedMeal}
              />

              {/* Cena slot */}
              <MealSlotDraggable
                meal={getMealForSlot(dayIndex, 'cena')}
                mealType="cena"
                dayIndex={dayIndex}
                onAdd={() => setShowRecipeSelector({ day: dayIndex, meal: 'cena' })}
                onView={(recipe) => setSelectedRecipe(recipe)}
                onRemove={() => handleRemoveRecipe(dayIndex, 'cena')}
                onDuplicate={(recipe) => setDuplicateRecipe({ recipe, day: dayIndex, meal: 'cena' })}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                isDragging={isDragging}
                draggedMeal={draggedMeal}
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {mealPlans.length === 0 && !isLoading && (
          <div className="text-center py-8 mt-4">
            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Tu calendario está vacío. ¡Agregá recetas o usá "Armarme la semana"!
            </p>
          </div>
        )}
      </div>

      {/* Recipe selector modal */}
      <Dialog open={!!showRecipeSelector} onOpenChange={() => setShowRecipeSelector(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Elegir receta para {showRecipeSelector && DAYS[showRecipeSelector.day].name} - {showRecipeSelector?.meal === 'almuerzo' ? 'Almuerzo' : 'Cena'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            {favoriteRecipes.length > 0 ? (
              <div className="space-y-2">
                {favoriteRecipes.map((recipe, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddRecipe(recipe)}
                    className={cn(
                      "w-full p-3 rounded-lg border border-border/50",
                      "hover:bg-primary/10 hover:border-primary/30 transition-all",
                      "text-left"
                    )}
                  >
                    <p className="font-medium text-foreground">{recipe.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.time} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No tenés recetas favoritas. ¡Guardá algunas recetas primero!
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Clear confirmation dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ¿Borrar todo el plan?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará todas las recetas de esta semana ({formatWeekRange(currentWeek)}). 
              Después podrás armar un nuevo plan desde cero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearWeek}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Borrando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Sí, borrar plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate meal dialog */}
      <DuplicateMealDialog
        open={!!duplicateRecipe}
        onClose={() => setDuplicateRecipe(null)}
        recipe={duplicateRecipe?.recipe || null}
        currentDay={duplicateRecipe?.day ?? 0}
        currentMeal={duplicateRecipe?.meal || 'almuerzo'}
        existingSlots={mealPlans.map(p => ({ dayIndex: p.dayOfWeek, mealType: p.mealType }))}
        onDuplicate={handleDuplicateMeal}
      />
    </div>
  );
}