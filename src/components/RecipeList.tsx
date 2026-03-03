import { useState, useEffect } from "react";
import { Clock, ChefHat, Users, Heart, ChevronDown, ChevronUp, Flame, Dumbbell, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Recipe {
  name: string;
  time: number;
  difficulty: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tip: string;
  variation?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
}

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export function RecipeList({ recipes, onSelectRecipe }: RecipeListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [favoriteNames, setFavoriteNames] = useState<Set<string>>(new Set());

  // Load which recipes are already favorites
  useEffect(() => {
    if (!user || recipes.length === 0) return;
    const names = recipes.map(r => r.name);
    supabase
      .from("favorite_recipes")
      .select("recipe_name")
      .eq("user_id", user.id)
      .in("recipe_name", names)
      .then(({ data }) => {
        if (data) {
          setFavoriteNames(new Set(data.map(d => d.recipe_name)));
        }
      });
  }, [user, recipes]);

  const handleToggleFavorite = async (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar recetas.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(recipe.name);
    const isFav = favoriteNames.has(recipe.name);

    try {
      if (isFav) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_name", recipe.name);
        if (error) throw error;
        setFavoriteNames(prev => {
          const next = new Set(prev);
          next.delete(recipe.name);
          return next;
        });
        toast({
          title: "Receta eliminada",
          description: `${recipe.name} se quitó de tus favoritas.`,
        });
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorite_recipes").insert([{
          user_id: user.id,
          recipe_name: recipe.name,
          recipe_data: JSON.parse(JSON.stringify(recipe)),
        }]);
        if (error) throw error;
        setFavoriteNames(prev => new Set(prev).add(recipe.name));
        toast({
          title: "¡Receta guardada!",
          description: `${recipe.name} se agregó a tus favoritas.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isFav ? "No se pudo quitar la receta." : "No se pudo guardar la receta.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "fácil":
        return "bg-green-100 text-green-700";
      case "media":
        return "bg-yellow-100 text-yellow-700";
      case "difícil":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">
        🍽️ Preparé {recipes.length === 1 ? 'esta opción' : `estas ${recipes.length} opciones`} con tus ingredientes
      </h2>
      
      <div className="grid gap-4">
        {recipes.map((recipe, index) => (
          <div
            key={index}
            onClick={() => onSelectRecipe(recipe)}
            className={cn(
              "bg-card rounded-xl p-4 border border-border/50",
              "shadow-card hover:shadow-elevated transition-all duration-300",
              "cursor-pointer hover:scale-[1.01]"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    getDifficultyColor(recipe.difficulty)
                  )}>
                    {recipe.difficulty}
                  </span>
                  {recipe.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {recipe.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recipe.time} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {recipe.servings} porciones
                  </span>
                </div>

                {/* Nutrition Summary */}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="flex items-center gap-1 text-orange-600">
                    <Flame className="w-3 h-3" />
                    {recipe.nutrition.calories} kcal
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Dumbbell className="w-3 h-3" />
                    {recipe.nutrition.protein}g prot
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Wheat className="w-3 h-3" />
                    {recipe.nutrition.carbs}g carbs
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleToggleFavorite(recipe, e)}
                disabled={savingId === recipe.name}
                className="flex-shrink-0"
              >
                <Heart className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  favoriteNames.has(recipe.name) || savingId === recipe.name
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground"
                )} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
