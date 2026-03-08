import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChefHat, Clock, Users, Plus, X, Sparkles, 
  Lightbulb, RefreshCw, Utensils, Heart, History,
  Sun, Moon, ChevronLeft, ChevronRight, Trash2, AlertTriangle,
  GripVertical, Copy, Check, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/components/RecipeList";
import { RecipeDetail } from "@/components/RecipeDetail";

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
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface MealPlan {
  id?: string;
  dayOfWeek: number;
  mealType: 'almuerzo' | 'cena';
  recipe: Recipe;
  date?: Date;
}

interface PlanificadorProps {
  ingredients: string[];
  pantryItems?: string[];
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

// Step definitions for guided flow
const PLANNER_STEPS = [
  { id: 1, label: "Ver Semana", description: "Navegá por tu calendario", icon: CalendarIcon },
  { id: 2, label: "Agregar", description: "Añadí recetas a cada día", icon: Plus },
  { id: 3, label: "Generar con IA", description: "Dejá que Marcela arme tu semana", icon: Sparkles },
];

export function Planificador({ ingredients, pantryItems = [], onStateChange }: PlanificadorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const shoppingList = useShoppingList();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState<{ day: number; meal: 'almuerzo' | 'cena'; date?: Date } | null>(null);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Drag & Drop state
  const [draggedMeal, setDraggedMeal] = useState<MealPlan | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Duplicate dialog state
  const [duplicateRecipe, setDuplicateRecipe] = useState<{ recipe: Recipe; day: number; meal: 'almuerzo' | 'cena' } | null>(null);

  // Recipe selector tab
  const [recipeSelectorTab, setRecipeSelectorTab] = useState<'favoritos' | 'recientes'>('favoritos');

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
      fetchRecentRecipes();
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
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const recipes: Recipe[] = (data || []).map(item => item.recipe_data as unknown as Recipe);
      setFavoriteRecipes(recipes);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    }
  };

  const fetchRecentRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cooked_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('cooked_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const recipes: Recipe[] = (data || []).map(item => item.recipe_data as unknown as Recipe);
      setRecentRecipes(recipes);
    } catch (error) {
      console.error('Error fetching recent recipes:', error);
    }
  };

  const calculateIngredientSuggestions = (plans: MealPlan[]) => {
    const ingredientCount: Record<string, number> = {};
    
    plans.forEach(plan => {
      plan.recipe.ingredients.forEach(ing => {
        const normalized = ing.toLowerCase().split(' ').slice(-1)[0];
        ingredientCount[normalized] = (ingredientCount[normalized] || 0) + 1;
      });
    });

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

  // Get meals for a specific date (for month view)
  const getMealsForDate = (date: Date): MealPlan[] => {
    const weekStart = getWeekStart(date);
    const dayIndex = (date.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
    return mealPlans.filter(p => {
      const planWeekStart = currentWeek.toISOString().split('T')[0];
      const targetWeekStart = weekStart.toISOString().split('T')[0];
      return planWeekStart === targetWeekStart && p.dayOfWeek === dayIndex;
    });
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!user || !showRecipeSelector) return;

    const { day, meal } = showRecipeSelector;
    const weekStartStr = currentWeek.toISOString().split('T')[0];
    const existingPlan = getMealForSlot(day, meal);

    // Optimistic update
    const tempId = existingPlan?.id || `temp-${Date.now()}`;
    const newPlan: MealPlan = { id: tempId, dayOfWeek: day, mealType: meal, recipe };
    setMealPlans(prev => existingPlan
      ? prev.map(p => p.dayOfWeek === day && p.mealType === meal ? newPlan : p)
      : [...prev, newPlan]
    );
    setShowRecipeSelector(null);

    try {
      if (existingPlan?.id) {
        const { error } = await supabase
          .from('meal_plans')
          .update({
            recipe_data: JSON.parse(JSON.stringify(recipe)),
            recipe_name: recipe.name,
          })
          .eq('id', existingPlan.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            week_start: weekStartStr,
            day_of_week: day,
            meal_type: meal,
            recipe_data: JSON.parse(JSON.stringify(recipe)),
            recipe_name: recipe.name,
          })
          .select()
          .single();
        if (error) throw error;
        // Replace temp id with real id
        if (data) {
          setMealPlans(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
        }
      }

      toast({
        title: "¡Receta agregada!",
        description: `${recipe.name} agregada para el ${DAYS[day].name}`,
      });
    } catch (error) {
      console.error('Error adding recipe:', error);
      // Rollback
      await fetchMealPlans();
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

    // Optimistic removal
    setMealPlans(prev => prev.filter(p => !(p.dayOfWeek === dayIndex && p.mealType === mealType)));

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      toast({
        title: "Receta eliminada",
        description: "Se quitó la receta del calendario",
      });
    } catch (error) {
      console.error('Error removing recipe:', error);
      // Rollback
      await fetchMealPlans();
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
          title: "¡Semana armada!",
          description: "Tu plan semanal está listo con recetas que aprovechan ingredientes",
        });
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
      toast({
        title: "Plan borrado",
        description: "Tu plan semanal fue eliminado. ¡Podés armarlo de nuevo!",
      });
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

    toast({
      title: "¡Lista actualizada!",
      description: `Se agregaron ${count} ingredientes a tu lista de compras`,
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
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
    
    if (sourceDay === targetDay && sourceMeal === targetMeal) {
      handleDragEnd();
      return;
    }

    const weekStartStr = currentWeek.toISOString().split('T')[0];

    try {
      const existingTarget = getMealForSlot(targetDay, targetMeal);
      
      if (existingTarget?.id) {
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
        if (draggedMeal.id) {
          await supabase
            .from('meal_plans')
            .update({
              day_of_week: targetDay,
              meal_type: targetMeal,
            })
            .eq('id', draggedMeal.id);
        } else {
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
          await supabase
            .from('meal_plans')
            .update({
              recipe_data: JSON.parse(JSON.stringify(duplicateRecipe.recipe)),
              recipe_name: duplicateRecipe.recipe.name,
            })
            .eq('id', existing.id);
        } else {
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

  // Handle month day click
  const handleMonthDayClick = (date: Date) => {
    const weekStart = getWeekStart(date);
    setCurrentWeek(weekStart);
    setSelectedDate(date);
    const dayIndex = (date.getDay() + 6) % 7;
    setShowRecipeSelector({ day: dayIndex, meal: 'almuerzo', date });
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


  // Month view calendar modifiers
  const daysWithMeals = mealPlans.map(p => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + p.dayOfWeek);
    return date;
  });

  return (
    <div className="animate-slide-up space-y-6">
      {/* Step Indicators */}
      <div className="bg-card rounded-2xl p-4 shadow-elevated border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Planificador Semanal
          </h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {mealPlans.length}/14 comidas
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {PLANNER_STEPS.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = step.id < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all duration-300",
                  "border-2",
                  isActive 
                    ? "border-primary bg-primary/10 shadow-lg scale-[1.02]" 
                    : isCompleted
                      ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
                      : "border-border/50 hover:border-primary/30 hover:bg-accent/30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Step Description */}
        <div className="mt-4 p-3 bg-accent/30 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            {PLANNER_STEPS[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* STEP 1 & 2: Calendar View */}
      {(currentStep === 1 || currentStep === 2) && (
      <div className={cn(
        "bg-card rounded-2xl p-4 md:p-6",
        "shadow-elevated border border-border/50"
      )}>
        {/* Header - View toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/60 rounded-xl p-1 border border-border/50">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  viewMode === 'week'
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] ring-2 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <CalendarIcon className={cn("w-4 h-4", viewMode === 'week' && "animate-pulse")} />
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  viewMode === 'month'
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] ring-2 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <CalendarIcon className={cn("w-4 h-4", viewMode === 'month' && "animate-pulse")} />
                Mes
              </button>
            </div>
          </div>
        </div>

        {/* Week Progress */}
        <WeekProgress 
          totalSlots={14} 
          filledSlots={mealPlans.length} 
          className="mb-6"
        />

        {/* Action buttons for when there are meals */}
        {mealPlans.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" onClick={handleAddToShoppingList}>
              <Package className="w-4 h-4" />
              Al super
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowClearConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="w-4 h-4" />
              Borrar
            </Button>
          </div>
        )}

        {/* Smart suggestions */}
        {ingredientSuggestions.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  💡 Ingredientes que se repiten
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  ¡Comprá más para aprovecharlos!: 
                  <span className="font-semibold"> {ingredientSuggestions.join(', ')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium text-sm md:text-base px-4 py-2 bg-secondary/50 rounded-lg">
                📅 {formatWeekRange(currentWeek)}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
              {DAYS.map((day, dayIndex) => {
                const hasAlmuerzo = !!getMealForSlot(dayIndex, 'almuerzo');
                const hasCena = !!getMealForSlot(dayIndex, 'cena');
                const isFilled = hasAlmuerzo && hasCena;
                const isPartial = hasAlmuerzo || hasCena;
                
                return (
                  <div
                    key={day.name}
                    className={cn(
                      "rounded-xl p-3 border transition-all duration-300",
                      "flex flex-col min-h-[180px]",
                      isFilled 
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/50" 
                        : isPartial 
                          ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/50 dark:border-amber-800/50"
                          : "bg-secondary/30 border-border/30"
                    )}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{day.emoji}</span>
                        <span className="font-semibold text-foreground text-sm md:text-base">{day.short}</span>
                      </div>
                      {isFilled && <Check className="w-4 h-4 text-green-500" />}
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
                );
              })}
            </div>
          </>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium text-sm md:text-base px-4 py-2 bg-secondary/50 rounded-lg capitalize">
                📆 {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Month calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && handleMonthDayClick(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={es}
                className="rounded-lg border p-4 pointer-events-auto"
                modifiers={{
                  hasMeals: daysWithMeals,
                  today: [new Date()],
                }}
                modifiersStyles={{
                  hasMeals: {
                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                  },
                  today: {
                    border: '2px solid hsl(var(--primary))',
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20" />
                <span>Con recetas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-primary" />
                <span>Hoy</span>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-4">
              Tocá un día para agregar o ver recetas
            </p>
          </>
        )}

      </div>
      )}

      {/* STEP 3: AI Section */}
      {currentStep === 3 && (
      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-elevated border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Generación con IA</h3>
            <p className="text-xs text-muted-foreground">Dejá que Marcela arme tu semana</p>
          </div>
        </div>

        {/* Empty state message */}
        {mealPlans.length === 0 && (
          <div className="text-center mb-6 py-4 bg-accent/30 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Utensils className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              Tu planificador está vacío
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ¡Perfecto para que la IA lo complete!
            </p>
          </div>
        )}

        <h4 className="font-medium text-foreground mb-3 text-sm">Preferencias</h4>
        <AdvancedFilters filters={filters} onChange={setFilters} />

        <div className="flex flex-wrap gap-2 mt-6">
          <WeekTemplates 
            onSelectTemplate={handleTemplateSelect}
            isLoading={isGeneratingAI}
          />
          
          <Button
            onClick={handleBuildWeekAI}
            disabled={isGeneratingAI || !user}
            className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white shadow-lg"
          >
            <Sparkles className={cn("w-4 h-4", isGeneratingAI && "animate-spin")} />
            {isGeneratingAI ? "Armando..." : "🤖 Armame la semana"}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          La IA generará recetas basadas en tus ingredientes y preferencias
        </p>
      </div>
      )}


      {/* Recipe selector modal */}
      <Dialog open={!!showRecipeSelector} onOpenChange={() => setShowRecipeSelector(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Elegir receta para {showRecipeSelector && DAYS[showRecipeSelector.day].name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Meal type selector */}
          {showRecipeSelector && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={showRecipeSelector.meal === 'almuerzo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRecipeSelector({ ...showRecipeSelector, meal: 'almuerzo' })}
                className="flex-1"
              >
                <Sun className="w-4 h-4 mr-1" />
                Almuerzo
              </Button>
              <Button
                variant={showRecipeSelector.meal === 'cena' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRecipeSelector({ ...showRecipeSelector, meal: 'cena' })}
                className="flex-1"
              >
                <Moon className="w-4 h-4 mr-1" />
                Cena
              </Button>
            </div>
          )}

          {/* Tab selector */}
          <Tabs value={recipeSelectorTab} onValueChange={(v) => setRecipeSelectorTab(v as 'favoritos' | 'recientes')}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="favoritos" className="flex-1">
                <Heart className="w-4 h-4 mr-1" />
                Favoritos ({favoriteRecipes.length})
              </TabsTrigger>
              <TabsTrigger value="recientes" className="flex-1">
                <History className="w-4 h-4 mr-1" />
                Recientes ({recentRecipes.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[400px] pr-4">
              <TabsContent value="favoritos" className="mt-0">
                {favoriteRecipes.length > 0 ? (
                  <div className="space-y-2">
                    {favoriteRecipes.map((recipe, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddRecipe(recipe)}
                        className={cn(
                          "w-full p-3 rounded-lg border border-border/50",
                          "hover:bg-primary/10 hover:border-primary/30 transition-all",
                          "text-left group"
                        )}
                      >
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{recipe.name}</p>
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
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No tenés recetas favoritas
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recientes" className="mt-0">
                {recentRecipes.length > 0 ? (
                  <div className="space-y-2">
                    {recentRecipes.map((recipe, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddRecipe(recipe)}
                        className={cn(
                          "w-full p-3 rounded-lg border border-border/50",
                          "hover:bg-primary/10 hover:border-primary/30 transition-all",
                          "text-left group"
                        )}
                      >
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{recipe.name}</p>
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
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No tenés recetas recientes
                    </p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* AI option */}
          <div className="pt-4 border-t border-border/50">
            <Button
              onClick={() => {
                setShowRecipeSelector(null);
                handleBuildWeekAI();
              }}
              disabled={isGeneratingAI}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white"
            >
              <Sparkles className="w-4 h-4" />
              Armame la semana con IA
            </Button>
          </div>
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
