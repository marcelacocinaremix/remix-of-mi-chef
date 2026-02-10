import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus } from "lucide-react";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { toast } from "sonner";

// Simple nutrition estimation from recipe data
const estimateFromRecipe = (recipe: any) => {
  const name = (recipe.recipe_name || recipe.name || "").toLowerCase();
  let protein = 15, carbs = 30, fats = 10, calories = 300;

  if (name.includes("pollo") || name.includes("carne") || name.includes("pescado")) {
    protein += 20; calories += 100;
  }
  if (name.includes("ensalada") || name.includes("verdura")) {
    carbs -= 10; fats -= 5; calories -= 100;
  }
  if (name.includes("pasta") || name.includes("arroz") || name.includes("fideos")) {
    carbs += 30; calories += 150;
  }
  if (name.includes("frito") || name.includes("milanesa")) {
    fats += 15; calories += 200;
  }
  if (name.includes("torta") || name.includes("postre")) {
    carbs += 40; fats += 10; calories += 250;
  }

  return {
    protein: Math.max(5, Math.min(60, protein)),
    carbs: Math.max(10, Math.min(80, carbs)),
    fats: Math.max(5, Math.min(40, fats)),
    calories: Math.max(150, Math.min(800, calories)),
  };
};

interface RecipeMealPickerProps {
  onAdd: (meal: Omit<MealLogInsert, "meal_type" | "meal_date">) => Promise<boolean>;
}

export function RecipeMealPicker({ onAdd }: RecipeMealPickerProps) {
  const { cookedRecipes, isLoading } = useCookedRecipes();
  const [isAdding, setIsAdding] = useState(false);

  // Get unique recent recipes (last 30 days, deduplicated)
  const recentRecipes = cookedRecipes
    .filter((r) => {
      const d = new Date(r.cooked_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    })
    .reduce((acc, r) => {
      if (!acc.find((x) => x.recipe_name === r.recipe_name)) acc.push(r);
      return acc;
    }, [] as typeof cookedRecipes)
    .slice(0, 20);

  const handleAdd = async (recipe: (typeof cookedRecipes)[0]) => {
    setIsAdding(true);
    const nutrition = estimateFromRecipe(recipe);
    const success = await onAdd({
      food_name: recipe.recipe_name,
      source: "recipe",
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      portion: "1 porción",
      recipe_data: recipe.recipe_data,
    });
    if (success) {
      toast.success(`${recipe.recipe_name} agregada`);
    }
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">Cargando recetas...</div>
    );
  }

  if (recentRecipes.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <ChefHat className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No tenés recetas recientes. Generá recetas en la sección Cocinar y volvé acá para agregarlas a tu nutrición.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Elegí una receta que hayas cocinado para agregarla a tu registro:
      </p>
      <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
        {recentRecipes.map((recipe) => {
          const nutrition = estimateFromRecipe(recipe);
          return (
            <div
              key={recipe.id}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{recipe.recipe_name}</p>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>{nutrition.calories} kcal</span>
                  <span>P:{nutrition.protein}g</span>
                  <span>C:{nutrition.carbs}g</span>
                  <span>G:{nutrition.fats}g</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary shrink-0"
                onClick={() => handleAdd(recipe)}
                disabled={isAdding}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
