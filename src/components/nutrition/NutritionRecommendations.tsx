import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ChefHat,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";

interface NutritionRecommendationsProps {
  totals: { calories: number; protein: number; carbs: number; fats: number };
  mealsCount: number;
  period: "day" | "week" | "month" | "year";
  fitnessGoal?: string;
  onNavigateToCooking: () => void;
}

interface Recommendation {
  type: "success" | "suggestion" | "warning" | "info";
  message: string;
  cookingHint?: string;
}

// Daily targets based on fitness goal
function getDailyTargets(goal?: string) {
  switch (goal) {
    case "lose_fat":
      return { calories: 1600, protein: 100, carbs: 150, fats: 50, label: "Bajar de peso" };
    case "gain_muscle":
      return { calories: 2500, protein: 140, carbs: 280, fats: 70, label: "Ganar músculo" };
    case "improve_performance":
      return { calories: 2200, protein: 120, carbs: 260, fats: 65, label: "Mejorar rendimiento" };
    case "stay_active":
    default:
      return { calories: 2000, protein: 80, carbs: 230, fats: 60, label: "Mantener peso" };
  }
}

export function NutritionRecommendations({
  totals,
  mealsCount,
  period,
  fitnessGoal,
  onNavigateToCooking,
}: NutritionRecommendationsProps) {
  const recommendations = useMemo(() => {
    const list: Recommendation[] = [];
    if (mealsCount === 0) {
      list.push({
        type: "info",
        message: "Empezá a registrar tus comidas para recibir recomendaciones personalizadas.",
      });
      return list;
    }

    const targets = getDailyTargets(fitnessGoal);

    if (period === "day") {
      // Calorie progress
      const calPct = (totals.calories / targets.calories) * 100;
      const protPct = (totals.protein / targets.protein) * 100;
      const carbsPct = (totals.carbs / targets.carbs) * 100;
      const fatsPct = (totals.fats / targets.fats) * 100;

      // Overall calorie status
      if (calPct < 40 && mealsCount >= 1) {
        const remaining = Math.round(targets.calories - totals.calories);
        list.push({
          type: "suggestion",
          message: `Llevás ${Math.round(totals.calories)} kcal de las ~${targets.calories} sugeridas. Te faltan unas ${remaining} kcal para hoy.`,
          cookingHint: "recetas nutritivas",
        });
      } else if (calPct >= 40 && calPct <= 80) {
        list.push({
          type: "info",
          message: `Vas bien: ${Math.round(totals.calories)} kcal de ~${targets.calories}. Seguí sumando comidas balanceadas.`,
        });
      } else if (calPct > 80 && calPct <= 110) {
        list.push({
          type: "success",
          message: `¡Excelente! Estás cerca de tu objetivo calórico diario (~${targets.calories} kcal).`,
        });
      } else if (calPct > 110) {
        list.push({
          type: "warning",
          message: `Superaste tu objetivo calórico (${Math.round(totals.calories)} de ~${targets.calories} kcal). Elegí opciones más livianas si seguís comiendo.`,
        });
      }

      // Protein check
      if (protPct < 50 && mealsCount >= 2) {
        const missing = Math.round(targets.protein - totals.protein);
        list.push({
          type: "suggestion",
          message: `Te faltan ~${missing}g de proteína. Sumá pollo, huevos, atún o legumbres.`,
          cookingHint: "recetas con alto contenido de proteínas",
        });
      } else if (protPct >= 80 && protPct <= 120) {
        list.push({
          type: "success",
          message: `Buen nivel de proteínas: ${Math.round(totals.protein)}g de ~${targets.protein}g.`,
        });
      }

      // Fat check
      if (fatsPct > 120) {
        list.push({
          type: "warning",
          message: `Las grasas están altas (${Math.round(totals.fats)}g de ~${targets.fats}g). Optá por preparaciones al horno o a la plancha.`,
          cookingHint: "recetas livianas al horno",
        });
      }

      // Carbs check
      if (carbsPct > 130) {
        list.push({
          type: "suggestion",
          message: `Muchos carbohidratos (${Math.round(totals.carbs)}g de ~${targets.carbs}g). Probá reemplazar algunos por verduras.`,
          cookingHint: "recetas bajas en carbohidratos con verduras",
        });
      }

      // Goal-specific tips
      if (fitnessGoal === "lose_fat" && calPct < 70 && mealsCount <= 1) {
        list.push({
          type: "info",
          message: "Para bajar de peso no saltees comidas. Mejor comer poco y variado que hacer ayunos largos.",
        });
      }
      if (fitnessGoal === "gain_muscle" && protPct < 60 && mealsCount >= 2) {
        list.push({
          type: "suggestion",
          message: "Para ganar músculo necesitás más proteína. Agregá un batido, huevos o carne magra.",
          cookingHint: "recetas ricas en proteínas para ganar músculo",
        });
      }
    } else {
      // Weekly/monthly/yearly view
      const macroTotal = totals.protein + totals.carbs + totals.fats;
      if (macroTotal > 0) {
        const proteinPct = (totals.protein / macroTotal) * 100;
        const carbsRatio = (totals.carbs / macroTotal) * 100;
        const fatsRatio = (totals.fats / macroTotal) * 100;

        if (proteinPct >= 20 && proteinPct <= 35 && carbsRatio >= 40 && carbsRatio <= 55 && fatsRatio >= 20 && fatsRatio <= 30) {
          list.push({
            type: "success",
            message: "¡Tu balance nutricional del período está excelente! Seguí variando tus comidas.",
          });
        } else {
          if (proteinPct < 20) {
            list.push({
              type: "suggestion",
              message: "Tu ingesta de proteínas está baja en el período. Sumá más carnes, huevos o legumbres.",
              cookingHint: "recetas con alto contenido de proteínas",
            });
          }
          if (fatsRatio > 35) {
            list.push({
              type: "warning",
              message: "Las grasas están elevadas en el período. Reducí frituras y optá por cocciones más livianas.",
              cookingHint: "recetas livianas al horno",
            });
          }
        }
      }
    }

    return list;
  }, [totals, mealsCount, period, fitnessGoal]);

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
              : rec.type === "info"
              ? "border-l-blue-500 bg-blue-500/5"
              : "border-l-primary bg-primary/5"
          }`}
        >
          <CardContent className="py-2.5 px-3">
            <div className="flex items-start gap-2">
              {rec.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
              {rec.type === "warning" && <TrendingDown className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
              {rec.type === "suggestion" && <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
              {rec.type === "info" && <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
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
