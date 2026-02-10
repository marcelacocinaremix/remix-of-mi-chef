import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { findCommonFood } from "@/data/commonFoods";
import { toast } from "sonner";

interface ManualMealEntryProps {
  onAdd: (meal: Omit<MealLogInsert, "meal_type" | "meal_date">) => Promise<boolean>;
}

export function ManualMealEntry({ onAdd }: ManualMealEntryProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [portion, setPortion] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Autocomplete values when name matches a known food
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    const match = findCommonFood(value);
    if (match) {
      setCalories(String(match.calories));
      setProtein(String(match.protein));
      setCarbs(String(match.carbs));
      setFats(String(match.fats));
      if (!portion) setPortion(match.portion);
      setAutoFilled(true);
    } else {
      if (autoFilled) {
        // Only clear if previously autofilled (don't wipe manual values)
        setCalories("");
        setProtein("");
        setCarbs("");
        setFats("");
        setPortion("");
        setAutoFilled(false);
      }
    }
  }, [portion, autoFilled]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Ingresá el nombre de la comida");
      return;
    }
    setIsAdding(true);
    const success = await onAdd({
      food_name: name.trim(),
      source: "manual",
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      portion: portion.trim() || undefined,
    });
    if (success) {
      toast.success(`${name} agregado`);
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Escribí el nombre de la comida. Si la reconocemos, los valores se completan solos.
      </p>

      <div className="space-y-3">
        <div>
          <Label htmlFor="food-name">Nombre de la comida *</Label>
          <Input
            id="food-name"
            placeholder="Ej: Banana, Pollo a la plancha"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus
          />
          {autoFilled && (
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[11px] text-primary">Valores completados automáticamente</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="portion">Porción</Label>
          <Input
            id="portion"
            placeholder="Ej: 1 plato, 2 unidades"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="calories">Calorías (kcal)</Label>
            <Input
              id="calories"
              type="number"
              placeholder="0"
              value={calories}
              onChange={(e) => { setCalories(e.target.value); setAutoFilled(false); }}
            />
          </div>
          <div>
            <Label htmlFor="protein">Proteínas (g)</Label>
            <Input
              id="protein"
              type="number"
              placeholder="0"
              value={protein}
              onChange={(e) => { setProtein(e.target.value); setAutoFilled(false); }}
            />
          </div>
          <div>
            <Label htmlFor="carbs">Carbohidratos (g)</Label>
            <Input
              id="carbs"
              type="number"
              placeholder="0"
              value={carbs}
              onChange={(e) => { setCarbs(e.target.value); setAutoFilled(false); }}
            />
          </div>
          <div>
            <Label htmlFor="fats">Grasas (g)</Label>
            <Input
              id="fats"
              type="number"
              placeholder="0"
              value={fats}
              onChange={(e) => { setFats(e.target.value); setAutoFilled(false); }}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isAdding} className="w-full">
        {isAdding ? "Agregando..." : "Agregar comida"}
      </Button>
    </div>
  );
}
