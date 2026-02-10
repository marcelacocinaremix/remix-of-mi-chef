import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { toast } from "sonner";

interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
  category: string;
}

const COMMON_FOODS: CommonFood[] = [
  // Desayuno
  { name: "Tostada con manteca", calories: 120, protein: 2, carbs: 15, fats: 6, portion: "1 unidad", category: "Desayuno" },
  { name: "Medialunas", calories: 180, protein: 4, carbs: 22, fats: 8, portion: "2 unidades", category: "Desayuno" },
  { name: "Yogur natural", calories: 100, protein: 8, carbs: 12, fats: 3, portion: "1 vaso", category: "Lácteos" },
  { name: "Yogur con granola", calories: 220, protein: 10, carbs: 30, fats: 7, portion: "1 vaso", category: "Desayuno" },
  { name: "Café con leche", calories: 80, protein: 4, carbs: 8, fats: 3, portion: "1 taza", category: "Bebidas" },
  { name: "Mate con galletitas", calories: 150, protein: 2, carbs: 20, fats: 6, portion: "porción", category: "Desayuno" },
  { name: "Huevos revueltos", calories: 200, protein: 14, carbs: 2, fats: 15, portion: "2 huevos", category: "Proteínas" },
  { name: "Avena con leche", calories: 200, protein: 8, carbs: 32, fats: 5, portion: "1 bowl", category: "Desayuno" },
  { name: "Tostada con palta", calories: 180, protein: 4, carbs: 15, fats: 12, portion: "1 unidad", category: "Desayuno" },
  // Almuerzo / Cena
  { name: "Milanesa de pollo", calories: 350, protein: 30, carbs: 20, fats: 18, portion: "1 unidad", category: "Proteínas" },
  { name: "Milanesa de carne", calories: 400, protein: 28, carbs: 22, fats: 22, portion: "1 unidad", category: "Proteínas" },
  { name: "Arroz blanco", calories: 200, protein: 4, carbs: 44, fats: 1, portion: "1 taza", category: "Carbohidratos" },
  { name: "Fideos con salsa", calories: 350, protein: 12, carbs: 55, fats: 8, portion: "1 plato", category: "Carbohidratos" },
  { name: "Ensalada mixta", calories: 80, protein: 3, carbs: 10, fats: 3, portion: "1 plato", category: "Verduras" },
  { name: "Ensalada César", calories: 250, protein: 15, carbs: 12, fats: 16, portion: "1 plato", category: "Verduras" },
  { name: "Pollo a la plancha", calories: 250, protein: 35, carbs: 0, fats: 10, portion: "1 pechuga", category: "Proteínas" },
  { name: "Carne a la plancha", calories: 300, protein: 30, carbs: 0, fats: 18, portion: "1 porción", category: "Proteínas" },
  { name: "Hamburguesa completa", calories: 500, protein: 25, carbs: 35, fats: 28, portion: "1 unidad", category: "Comida rápida" },
  { name: "Pizza (2 porciones)", calories: 450, protein: 18, carbs: 50, fats: 20, portion: "2 porciones", category: "Comida rápida" },
  { name: "Empanadas", calories: 350, protein: 12, carbs: 28, fats: 20, portion: "2 unidades", category: "Comida rápida" },
  { name: "Tarta de verduras", calories: 280, protein: 10, carbs: 25, fats: 16, portion: "1 porción", category: "Tartas" },
  { name: "Sopa de verduras", calories: 120, protein: 4, carbs: 18, fats: 3, portion: "1 bowl", category: "Sopas" },
  { name: "Guiso de lentejas", calories: 350, protein: 20, carbs: 45, fats: 8, portion: "1 plato", category: "Legumbres" },
  { name: "Puré de papa", calories: 180, protein: 3, carbs: 30, fats: 6, portion: "1 porción", category: "Guarniciones" },
  { name: "Verduras salteadas", calories: 100, protein: 3, carbs: 12, fats: 5, portion: "1 porción", category: "Verduras" },
  // Snacks
  { name: "Banana", calories: 100, protein: 1, carbs: 26, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Manzana", calories: 80, protein: 0, carbs: 20, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Barra de cereal", calories: 120, protein: 2, carbs: 22, fats: 3, portion: "1 unidad", category: "Snacks" },
  { name: "Frutos secos mix", calories: 200, protein: 6, carbs: 8, fats: 18, portion: "puñado", category: "Snacks" },
  { name: "Galletitas de arroz", calories: 70, protein: 1, carbs: 16, fats: 0, portion: "2 unidades", category: "Snacks" },
  // Bebidas
  { name: "Jugo de naranja", calories: 90, protein: 1, carbs: 22, fats: 0, portion: "1 vaso", category: "Bebidas" },
  { name: "Licuado de frutas", calories: 150, protein: 4, carbs: 30, fats: 2, portion: "1 vaso", category: "Bebidas" },
  { name: "Mate", calories: 5, protein: 0, carbs: 1, fats: 0, portion: "varios", category: "Bebidas" },
];

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
