import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { COMMON_FOODS, CommonFood } from "@/data/commonFoods";
import { toast } from "sonner";

interface CommonFoodSearchProps {
  onAdd: (meal: Omit<MealLogInsert, "meal_type" | "meal_date">) => Promise<boolean>;
}

export function CommonFoodSearch({ onAdd }: CommonFoodSearchProps) {
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMON_FOODS;
    const q = query.toLowerCase();
    return COMMON_FOODS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleAdd = async (food: CommonFood) => {
    setIsAdding(true);
    const success = await onAdd({
      food_name: food.name,
      source: "search",
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      portion: food.portion,
    });
    if (success) {
      toast.success(`${food.name} agregado`);
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar comida... ej: pollo, ensalada, banana"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-6">
            No se encontraron resultados. Probá con otro término o cargalo manualmente.
          </p>
        ) : (
          filtered.map((food, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{food.name}</p>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>{food.calories} kcal</span>
                  <span>P:{food.protein}g</span>
                  <span>C:{food.carbs}g</span>
                  <span>G:{food.fats}g</span>
                  <span className="text-muted-foreground/60">• {food.portion}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary shrink-0"
                onClick={() => handleAdd(food)}
                disabled={isAdding}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
