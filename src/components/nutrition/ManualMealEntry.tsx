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
        if (data.portion && !portion) setPortion(data.portion);
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
      if (!portion) setPortion(match.portion);
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
      }, 1200);
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
        Escribí lo que comiste y la IA completa los valores automáticamente ✨
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
          {autoFilled && !aiLoading && (
            <div className="flex items-center gap-1 mt-1">
              {aiSource ? (
                <>
                  <Wand2 className="w-3 h-3 text-primary" />
                  <span className="text-[11px] text-primary">Valores estimados por IA</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[11px] text-primary">Valores completados automáticamente</span>
                </>
              )}
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

      <Button onClick={handleSubmit} disabled={isAdding || aiLoading} className="w-full">
        {isAdding ? "Agregando..." : aiLoading ? "Estimando valores..." : "Agregar comida"}
      </Button>
    </div>
  );
}
