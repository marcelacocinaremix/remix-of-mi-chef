import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { findCommonFood } from "@/data/commonFoods";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fillFromAI = useCallback(async (foodName: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-nutrition', {
        body: { food_name: foodName, portion: portion || undefined },
      });
      if (error) throw error;
      if (data && typeof data.calories === 'number') {
        setCalories(String(data.calories));
        setProtein(String(data.protein));
        setCarbs(String(data.carbs));
        setFats(String(data.fats));
        // Don't auto-fill portion, let the user decide
        setAutoFilled(true);
        setAiSource(true);
      }
    } catch (err) {
      console.error('AI nutrition error:', err);
    } finally {
      setAiLoading(false);
    }
  }, [portion]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    
    // First try local DB
    const match = findCommonFood(value);
    if (match) {
      setCalories(String(match.calories));
      setProtein(String(match.protein));
      setCarbs(String(match.carbs));
      setFats(String(match.fats));
      // Don't auto-fill portion from local DB either
      setAutoFilled(true);
      setAiSource(false);
      // Cancel any pending AI call
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // If no local match and name is long enough, try AI after debounce
    if (value.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fillFromAI(value.trim());
      }, 2000);
    } else {
      if (autoFilled) {
        setCalories("");
        setProtein("");
        setCarbs("");
        setFats("");
        setPortion("");
        setAutoFilled(false);
        setAiSource(false);
      }
    }
  }, [portion, autoFilled, fillFromAI]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Ingresá el nombre de la comida");
      return;
    }
    setIsAdding(true);
    const success = await onAdd({
      food_name: name.trim(),
      source: aiSource ? "ai" : "manual",
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
        Escribí lo que comiste y la IA calcula los valores nutricionales automáticamente ✨
      </p>

      <div className="space-y-3">
        <div>
          <Label htmlFor="food-name">Nombre de la comida *</Label>
          <div className="relative">
            <Input
              id="food-name"
              placeholder="Ej: Banana, Milanesa con puré, Ensalada"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              className="pr-10"
            />
            {aiLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="portion">Porción (opcional)</Label>
          <Input
            id="portion"
            placeholder="Ej: 1 plato, 2 unidades"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isAdding || aiLoading} className="w-full">
        {isAdding ? "Agregando..." : aiLoading ? "Estimando valores..." : "Agregar comida"}
      </Button>
    </div>
  );
}
