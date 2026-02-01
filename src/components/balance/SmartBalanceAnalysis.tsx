import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Scale,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChefHat,
  Dumbbell,
  Lightbulb,
  ArrowRight,
  Flame,
  Beef,
  Wheat,
} from "lucide-react";

import { UserFitnessGoal, WorkoutStats } from "@/hooks/useActivityTracking";

interface NutritionalData {
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  calorias: number;
}

interface SmartBalanceAnalysisProps {
  goal: UserFitnessGoal | null;
  totals: NutritionalData;
  recipesCount: number;
  period: "week" | "month" | "year";
  activityStats: WorkoutStats;
  onNavigateToActivity?: () => void;
  onRecommendRecipes?: () => void;
}

const GOAL_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  idealMacros: { protein: number; carbs: number; fats: number };
  calorieRange: { min: number; max: number }; // per day average
  tips: {
    good: string;
    needsImprovement: string;
    lowActivity: string;
    highProtein: string;
    lowProtein: string;
    highCarbs: string;
    recipeAdvice: string;
  };
}> = {
  lose_fat: {
    label: "Bajar de peso",
    icon: <TrendingDown className="w-4 h-4" />,
    idealMacros: { protein: 35, carbs: 40, fats: 25 },
    calorieRange: { min: 1200, max: 1800 },
    tips: {
      good: "¡Excelente! Tu alimentación está alineada con tu objetivo de bajar de peso.",
      needsImprovement: "Podés mejorar tu balance para acelerar tus resultados.",
      lowActivity: "Sumar actividad física te ayudaría a quemar más calorías y alcanzar tu objetivo más rápido.",
      highProtein: "Muy bien con las proteínas, te ayudan a mantener la masa muscular mientras bajás de peso.",
      lowProtein: "Sumá más proteínas (pollo, pescado, huevos) para mantener tu masa muscular.",
      highCarbs: "Reducí un poco los carbohidratos y optá por versiones integrales.",
      recipeAdvice: "Probá recetas más livianas, con vegetales y proteínas magras.",
    },
  },
  gain_muscle: {
    label: "Ganar masa muscular",
    icon: <TrendingUp className="w-4 h-4" />,
    idealMacros: { protein: 35, carbs: 45, fats: 20 },
    calorieRange: { min: 2000, max: 3000 },
    tips: {
      good: "¡Perfecto! Estás comiendo bien para ganar músculo.",
      needsImprovement: "Ajustá tu alimentación para maximizar las ganancias musculares.",
      lowActivity: "Para ganar músculo necesitás entrenar regularmente, ¡sumá sesiones de fuerza!",
      highProtein: "Excelente aporte proteico, tus músculos lo van a aprovechar.",
      lowProtein: "Necesitás más proteínas para construir músculo. ¡Sumá pollo, carne o legumbres!",
      highCarbs: "Los carbohidratos te dan energía para entrenar, pero equilibralos con proteínas.",
      recipeAdvice: "Elegí recetas con alto contenido proteico y carbohidratos complejos.",
    },
  },
  stay_active: {
    label: "Mantener peso",
    icon: <Scale className="w-4 h-4" />,
    idealMacros: { protein: 25, carbs: 50, fats: 25 },
    calorieRange: { min: 1800, max: 2200 },
    tips: {
      good: "¡Muy bien! Estás manteniendo un balance saludable.",
      needsImprovement: "Pequeños ajustes pueden ayudarte a mantener tu peso ideal.",
      lowActivity: "Mantenerte activo es clave para conservar tu peso. ¡No dejes de moverte!",
      highProtein: "Buen aporte de proteínas, te ayuda a sentirte satisfecho.",
      lowProtein: "Un poco más de proteínas te ayudaría a mantener la saciedad.",
      highCarbs: "Estás comiendo bastantes carbohidratos, balanceá con más verduras.",
      recipeAdvice: "Variá tus comidas para mantener el equilibrio nutricional.",
    },
  },
  improve_performance: {
    label: "Mejorar condición física",
    icon: <Activity className="w-4 h-4" />,
    idealMacros: { protein: 30, carbs: 50, fats: 20 },
    calorieRange: { min: 2000, max: 2800 },
    tips: {
      good: "¡Excelente! Tu alimentación apoya tu rendimiento deportivo.",
      needsImprovement: "Optimizá tu nutrición para rendir mejor en tus entrenamientos.",
      lowActivity: "Para mejorar tu condición física, aumentá la frecuencia de tus entrenamientos.",
      highProtein: "Las proteínas te ayudan a recuperarte de los entrenamientos.",
      lowProtein: "Más proteínas te ayudarán a recuperarte mejor de los entrenamientos.",
      highCarbs: "Los carbohidratos son tu combustible, pero no te excedas.",
      recipeAdvice: "Priorizá comidas balanceadas antes y después de entrenar.",
    },
  },
};

export function SmartBalanceAnalysis({
  goal,
  totals,
  recipesCount,
  period,
  activityStats,
  onNavigateToActivity,
  onRecommendRecipes,
}: SmartBalanceAnalysisProps) {
  const goalConfig = goal?.goal ? GOAL_CONFIG[goal.goal] : null;

  // Calculate current macro percentages
  const analysis = useMemo(() => {
    const macroTotal = totals.proteinas + totals.carbohidratos + totals.grasas;
    if (macroTotal === 0) {
      return {
        proteinPercent: 0,
        carbsPercent: 0,
        fatsPercent: 0,
        score: 0,
        status: "no_data" as const,
      };
    }

    const proteinPercent = (totals.proteinas / macroTotal) * 100;
    const carbsPercent = (totals.carbohidratos / macroTotal) * 100;
    const fatsPercent = (totals.grasas / macroTotal) * 100;

    if (!goalConfig) {
      return {
        proteinPercent,
        carbsPercent,
        fatsPercent,
        score: 50,
        status: "no_goal" as const,
      };
    }

    // Calculate how close to ideal
    const proteinDiff = Math.abs(proteinPercent - goalConfig.idealMacros.protein);
    const carbsDiff = Math.abs(carbsPercent - goalConfig.idealMacros.carbs);
    const fatsDiff = Math.abs(fatsPercent - goalConfig.idealMacros.fats);
    
    const avgDiff = (proteinDiff + carbsDiff + fatsDiff) / 3;
    const score = Math.max(0, Math.min(100, Math.round(100 - avgDiff * 2)));

    let status: "excellent" | "good" | "needs_work" | "poor";
    if (score >= 80) status = "excellent";
    else if (score >= 60) status = "good";
    else if (score >= 40) status = "needs_work";
    else status = "poor";

    return {
      proteinPercent,
      carbsPercent,
      fatsPercent,
      score,
      status,
    };
  }, [totals, goalConfig]);

  // Generate insights based on goal and current state
  const insights = useMemo(() => {
    if (!goalConfig || analysis.status === "no_data") return [];

    const list: { type: "success" | "warning" | "tip"; message: string }[] = [];

    // Overall status
    if (analysis.status === "excellent" || analysis.status === "good") {
      list.push({ type: "success", message: goalConfig.tips.good });
    } else {
      list.push({ type: "warning", message: goalConfig.tips.needsImprovement });
    }

    // Protein analysis
    if (analysis.proteinPercent >= goalConfig.idealMacros.protein - 5) {
      list.push({ type: "success", message: goalConfig.tips.highProtein });
    } else if (analysis.proteinPercent < goalConfig.idealMacros.protein - 10) {
      list.push({ type: "warning", message: goalConfig.tips.lowProtein });
    }

    // Carbs analysis for weight loss
    if (goal?.goal === "lose_fat" && analysis.carbsPercent > 50) {
      list.push({ type: "warning", message: goalConfig.tips.highCarbs });
    }

    // Activity connection
    if (activityStats.weeklyWorkouts < activityStats.weeklyWorkoutTarget * 0.5) {
      list.push({ type: "tip", message: goalConfig.tips.lowActivity });
    }

    return list;
  }, [analysis, goalConfig, goal, activityStats]);

  // Period label
  const periodLabel = period === "week" ? "esta semana" : period === "month" ? "este mes" : "este año";
  const periodDays = period === "week" ? 7 : period === "month" ? 30 : 365;
  const avgDailyCalories = recipesCount > 0 ? Math.round(totals.calorias / Math.min(recipesCount, periodDays)) : 0;

  // No goal configured
  if (!goal?.goal) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-6 text-center">
          <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Sin objetivo configurado</p>
          <p className="text-sm text-muted-foreground mb-3">
            Configurá tu objetivo de salud para recibir análisis personalizado de tu balance
          </p>
        </CardContent>
      </Card>
    );
  }

  // No data
  if (analysis.status === "no_data" || recipesCount === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-6 text-center">
          <ChefHat className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Sin datos {periodLabel}</p>
          <p className="text-sm text-muted-foreground mb-3">
            Marcá recetas como cocinadas para ver tu análisis de balance
          </p>
          {onRecommendRecipes && (
            <Button onClick={onRecommendRecipes} size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Empezar a cocinar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal alignment card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={cn(
          "overflow-hidden",
          analysis.status === "excellent" && "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent",
          analysis.status === "good" && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
          analysis.status === "needs_work" && "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent",
          analysis.status === "poor" && "border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent",
        )}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                analysis.status === "excellent" && "bg-emerald-500/20",
                analysis.status === "good" && "bg-primary/20",
                analysis.status === "needs_work" && "bg-amber-500/20",
                analysis.status === "poor" && "bg-rose-500/20",
              )}>
                {analysis.status === "excellent" || analysis.status === "good" ? (
                  <CheckCircle2 className={cn(
                    "w-6 h-6",
                    analysis.status === "excellent" ? "text-emerald-500" : "text-primary"
                  )} />
                ) : (
                  <AlertTriangle className={cn(
                    "w-6 h-6",
                    analysis.status === "needs_work" ? "text-amber-500" : "text-rose-500"
                  )} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {goalConfig?.icon}
                  <span className="text-sm font-medium">{goalConfig?.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-auto text-xs",
                      analysis.status === "excellent" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                      analysis.status === "good" && "bg-primary/20 text-primary",
                      analysis.status === "needs_work" && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                      analysis.status === "poor" && "bg-rose-500/20 text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {analysis.score}/100
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.status === "excellent" && "Tu alimentación está perfectamente alineada con tu objetivo"}
                  {analysis.status === "good" && "Tu alimentación apoya tu objetivo, con espacio para mejoras"}
                  {analysis.status === "needs_work" && "Tu alimentación necesita ajustes para alcanzar tu objetivo"}
                  {analysis.status === "poor" && "Tu alimentación no está alineada con tu objetivo"}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Alineación con objetivo</span>
                <span>{analysis.score}%</span>
              </div>
              <Progress 
                value={analysis.score} 
                className={cn(
                  "h-2",
                  analysis.status === "excellent" && "[&>div]:bg-emerald-500",
                  analysis.status === "good" && "[&>div]:bg-primary",
                  analysis.status === "needs_work" && "[&>div]:bg-amber-500",
                  analysis.status === "poor" && "[&>div]:bg-rose-500",
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Macros vs Ideal for goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Tu balance vs ideal para {goalConfig?.label.toLowerCase()}
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <Beef className="w-3.5 h-3.5 text-chart-1" />
                    Proteínas
                  </span>
                  <span className={cn(
                    "font-medium",
                    Math.abs(analysis.proteinPercent - (goalConfig?.idealMacros.protein || 25)) <= 5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}>
                    {Math.round(analysis.proteinPercent)}%
                    <span className="text-muted-foreground font-normal ml-1">
                      / {goalConfig?.idealMacros.protein}%
                    </span>
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full bg-chart-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, analysis.proteinPercent)}%` }}
                    transition={{ duration: 0.6 }}
                  />
                  <div 
                    className="absolute h-full w-0.5 bg-foreground/50"
                    style={{ left: `${goalConfig?.idealMacros.protein || 25}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <Wheat className="w-3.5 h-3.5 text-chart-2" />
                    Carbohidratos
                  </span>
                  <span className={cn(
                    "font-medium",
                    Math.abs(analysis.carbsPercent - (goalConfig?.idealMacros.carbs || 50)) <= 10
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}>
                    {Math.round(analysis.carbsPercent)}%
                    <span className="text-muted-foreground font-normal ml-1">
                      / {goalConfig?.idealMacros.carbs}%
                    </span>
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full bg-chart-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, analysis.carbsPercent)}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                  <div 
                    className="absolute h-full w-0.5 bg-foreground/50"
                    style={{ left: `${goalConfig?.idealMacros.carbs || 50}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-chart-3" />
                    Grasas
                  </span>
                  <span className={cn(
                    "font-medium",
                    Math.abs(analysis.fatsPercent - (goalConfig?.idealMacros.fats || 25)) <= 5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}>
                    {Math.round(analysis.fatsPercent)}%
                    <span className="text-muted-foreground font-normal ml-1">
                      / {goalConfig?.idealMacros.fats}%
                    </span>
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute h-full bg-chart-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, analysis.fatsPercent)}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                  <div 
                    className="absolute h-full w-0.5 bg-foreground/50"
                    style={{ left: `${goalConfig?.idealMacros.fats || 25}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {insights.map((insight, index) => (
            <Card 
              key={index}
              className={cn(
                "border-l-4",
                insight.type === "success" && "border-l-emerald-500 bg-emerald-500/5",
                insight.type === "warning" && "border-l-amber-500 bg-amber-500/5",
                insight.type === "tip" && "border-l-primary bg-primary/5",
              )}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  {insight.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                  {insight.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                  {insight.type === "tip" && <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                  <p className="text-sm">{insight.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Action suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary">Sugerencias para tu objetivo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {goalConfig?.tips.recipeAdvice}
                </p>
                <div className="flex flex-wrap gap-2">
                  {onRecommendRecipes && (
                    <Button size="sm" variant="secondary" onClick={onRecommendRecipes} className="gap-1.5 text-xs h-8">
                      <ChefHat className="w-3.5 h-3.5" />
                      Ver recetas sugeridas
                    </Button>
                  )}
                  {onNavigateToActivity && activityStats.weeklyWorkouts < activityStats.weeklyWorkoutTarget && (
                    <Button size="sm" variant="outline" onClick={onNavigateToActivity} className="gap-1.5 text-xs h-8">
                      <Dumbbell className="w-3.5 h-3.5" />
                      Ir a Actividad
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
