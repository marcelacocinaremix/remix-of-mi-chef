import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  ChefHat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Beef,
  Wheat,
  Droplets,
  Flame,
  ArrowRight,
} from "lucide-react";

interface NutritionRecommendationsProps {
  totals: { calories: number; protein: number; carbs: number; fats: number };
  mealsCount: number;
  period: "day" | "week" | "month" | "year";
  onNavigateToCooking: () => void;
}

interface Recommendation {
  type: "success" | "suggestion" | "warning";
  message: string;
  cookingHint?: string;
}

export function NutritionRecommendations({
  totals,
  mealsCount,
  period,
  onNavigateToCooking,
}: NutritionRecommendationsProps) {
  const recommendations = useMemo(() => {
    const list: Recommendation[] = [];
    if (mealsCount === 0) return list;

    const macroTotal = totals.protein + totals.carbs + totals.fats;
    if (macroTotal === 0) return list;

    const proteinPct = (totals.protein / macroTotal) * 100;
    const carbsPct = (totals.carbs / macroTotal) * 100;
    const fatsPct = (totals.fats / macroTotal) * 100;

    // Daily calorie reference (adjust for period)
    const days = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
    const avgDailyCalories = totals.calories / Math.max(1, Math.min(mealsCount, days));

    // Protein check
    if (proteinPct < 20) {
      list.push({
        type: "suggestion",
        message: "Tu ingesta de proteínas está baja. Sumá pollo, pescado, huevos o legumbres para mantener energía y masa muscular.",
        cookingHint: "recetas con alto contenido de proteínas",
      });
    } else if (proteinPct >= 25 && proteinPct <= 35) {
      list.push({
        type: "success",
        message: "¡Buen nivel de proteínas! Seguí así para mantener tu masa muscular.",
      });
    }

    // Carbs check
    if (carbsPct > 60) {
      list.push({
        type: "suggestion",
        message: "Estás comiendo muchos carbohidratos. Probá reemplazar algunos por más verduras o proteínas.",
        cookingHint: "recetas bajas en carbohidratos con verduras",
      });
    }

    // Fats check
    if (fatsPct > 35) {
      list.push({
        type: "warning",
        message: "Las grasas están un poco altas. Optá por preparaciones al horno o a la plancha en lugar de fritas.",
        cookingHint: "recetas livianas al horno",
      });
    } else if (fatsPct < 15) {
      list.push({
        type: "suggestion",
        message: "Tus grasas están bajas. Sumá palta, frutos secos o aceite de oliva para una dieta equilibrada.",
      });
    }

    // Overall balance
    if (proteinPct >= 20 && proteinPct <= 35 && carbsPct >= 40 && carbsPct <= 55 && fatsPct >= 20 && fatsPct <= 30) {
      list.push({
        type: "success",
        message: "¡Tu balance nutricional está excelente! Seguí variando tus comidas para mantenerlo.",
      });
    }

    // Low calorie warning
    if (period === "day" && totals.calories > 0 && totals.calories < 1000 && mealsCount >= 2) {
      list.push({
        type: "suggestion",
        message: "Parece que comiste poco hoy. Asegurate de cubrir tus necesidades energéticas.",
        cookingHint: "recetas nutritivas y energéticas",
      });
    }

    return list;
  }, [totals, mealsCount, period]);

  if (recommendations.length === 0) return null;

  const hasCookingHints = recommendations.some((r) => r.cookingHint);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Recomendaciones</span>
      </div>

      {recommendations.map((rec, i) => (
        <Card
          key={i}
          className={`border-l-4 ${
            rec.type === "success"
              ? "border-l-emerald-500 bg-emerald-500/5"
              : rec.type === "warning"
              ? "border-l-amber-500 bg-amber-500/5"
              : "border-l-primary bg-primary/5"
          }`}
        >
          <CardContent className="py-2.5 px-3">
            <div className="flex items-start gap-2">
              {rec.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
              {rec.type === "warning" && <TrendingDown className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
              {rec.type === "suggestion" && <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
              <p className="text-sm">{rec.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasCookingHints && (
        <Button
          onClick={onNavigateToCooking}
          variant="secondary"
          size="sm"
          className="w-full gap-2 mt-1"
        >
          <ChefHat className="w-4 h-4" />
          Ir a cocinar
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
