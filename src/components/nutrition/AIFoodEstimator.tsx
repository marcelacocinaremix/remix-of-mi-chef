import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Loader2, Plus } from "lucide-react";
import { MealLogInsert } from "@/hooks/useMealLogs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIFoodEstimatorProps {
  onAdd: (meal: Omit<MealLogInsert, "meal_type" | "meal_date">) => Promise<boolean>;
}

interface NutritionResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
  source: "ai" | "cache";
}

export function AIFoodEstimator({ onAdd }: AIFoodEstimatorProps) {
  const [query, setQuery] = useState("");
  const [portion, setPortion] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Sesión expirada, volvé a iniciar sesión");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-nutrition`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            food_name: query.trim(),
            portion: portion.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo estimar la nutrición");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Error al consultar la IA");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!result) return;
    setIsAdding(true);
    const success = await onAdd({
      food_name: result.food_name,
      source: "ai",
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      portion: result.portion,
    });
    if (success) {
      toast.success(`${result.food_name} agregado`);
      setQuery("");
      setPortion("");
      setResult(null);
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>La IA estima los valores nutricionales de cualquier alimento</span>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Nombre del alimento... ej: salmón a la plancha"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          autoFocus
        />
        <div className="flex gap-2">
          <Input
            placeholder="Porción (opcional)... ej: 200g, 1 taza"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            size="sm"
            className="shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Consultando IA…
        </div>
      )}

      {result && !isSearching && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{result.food_name}</p>
              <p className="text-xs text-muted-foreground">{result.portion}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {result.source === "cache" ? "📦 Base de datos" : "✨ IA"}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Cal", value: result.calories, unit: "kcal", color: "text-orange-500" },
              { label: "Prot", value: result.protein, unit: "g", color: "text-blue-500" },
              { label: "Carbs", value: result.carbs, unit: "g", color: "text-amber-500" },
              { label: "Grasas", value: result.fats, unit: "g", color: "text-red-400" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/50 p-2">
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.unit}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <Button onClick={handleAdd} disabled={isAdding} className="w-full" size="sm">
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Agregar a mi registro
          </Button>
        </div>
      )}
    </div>
  );
}
