import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
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
      setAutoFilled(true);
      setAiSource(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // AI fallback after debounce
    if (value.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fillFromAI(value.trim());
      }, 2000);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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

    const cal = Number(calories) || 0;
    const prot = Number(protein) || 0;
    const carb = Number(carbs) || 0;
    const fat = Number(fats) || 0;

    // Validate calorie range if provided
    if (cal > 0 && (cal < 5 || cal > 3000)) {
      toast.error("Las calorías deben estar entre 5 y 3000 kcal");
      return;
    }

    setIsAdding(true);
    const success = await onAdd({
      food_name: name.trim(),
      source: aiSource ? "ai" : "manual",
      calories: cal,
      protein: prot,
      carbs: carb,
      fats: fat,
      portion: portion.trim() || undefined,
    });
    if (success) {
      toast.success(`${name.trim()} agregado ✓`);
    } else {
      toast.error("No se pudo agregar la comida");
    }
    setIsAdding(false);
  };

  const hasValues = calories || protein || carbs || fats;

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Escribí el nombre y la IA estima los valores automáticamente ✨
      </p>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <Label htmlFor="food-name">Nombre de la comida *</Label>
          <div className="relative mt-1">
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
            {autoFilled && !aiLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          {autoFilled && (
            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
              {aiSource ? "✨ Valores estimados por IA" : "✅ Datos de nuestra base"}
              <button
                className="underline text-muted-foreground ml-1"
                onClick={() => {
                  setAutoFilled(false);
                  setAiSource(false);
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFats("");
                }}
              >
                Editar
              </button>
            </p>
          )}
        </div>

        {/* Portion */}
        <div>
          <Label htmlFor="portion">Porción (opcional)</Label>
          <Input
            id="portion"
            placeholder="Ej: 1 plato, 200g, 2 unidades"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Macros — shown when auto-filled or when user wants to edit */}
        {hasValues && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-xl border border-border/40">
            <div>
              <Label htmlFor="cal" className="text-[11px]">Calorías (kcal)</Label>
              <Input
                id="cal"
                type="number"
                min="0"
                max="3000"
                value={calories}
                onChange={(e) => { setCalories(e.target.value); setAutoFilled(false); }}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="prot" className="text-[11px]">Proteínas (g)</Label>
              <Input
                id="prot"
                type="number"
                min="0"
                value={protein}
                onChange={(e) => { setProtein(e.target.value); setAutoFilled(false); }}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="carb" className="text-[11px]">Carbohidratos (g)</Label>
              <Input
                id="carb"
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => { setCarbs(e.target.value); setAutoFilled(false); }}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="fat" className="text-[11px]">Grasas (g)</Label>
              <Input
                id="fat"
                type="number"
                min="0"
                value={fats}
                onChange={(e) => { setFats(e.target.value); setAutoFilled(false); }}
                className="mt-0.5 h-8 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isAdding || aiLoading || !name.trim()}
        className="w-full"
      >
        {isAdding ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Agregando...</>
        ) : aiLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Estimando valores...</>
        ) : (
          "Agregar comida"
        )}
      </Button>
    </div>
  );
}
