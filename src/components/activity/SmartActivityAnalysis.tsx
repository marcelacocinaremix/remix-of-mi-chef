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
  Heart,
  Zap,
  Trophy,
  Salad,
} from "lucide-react";
import marcelaCharacter from "@/assets/marcela-character.png";
import { FitnessGoal, UserFitnessGoal, WorkoutStats } from "@/hooks/useActivityTracking";

interface SmartActivityAnalysisProps {
  goal: UserFitnessGoal | null;
  stats: WorkoutStats;
  onNavigateToBalance?: () => void;
}

const GOAL_ACTIVITY_CONFIG: Record<FitnessGoal, {
  label: string;
  icon: React.ReactNode;
  idealWorkoutsPerWeek: { min: number; ideal: number };
  idealMinutesPerWeek: number;
  focusWorkouts: string[];
  tips: {
    excellent: string;
    good: string;
    needsWork: string;
    nutritionBoost: string;
    recipeAdvice: string;
    restDay: string;
  };
}> = {
  lose_fat: {
    label: "Bajar de peso",
    icon: <TrendingDown className="w-4 h-4" />,
    idealWorkoutsPerWeek: { min: 3, ideal: 5 },
    idealMinutesPerWeek: 200,
    focusWorkouts: ["Cardio", "HIIT", "Funcional"],
    tips: {
      excellent: "¡Increíble! Tu actividad física está potenciando tu pérdida de peso.",
      good: "Vas bien con la actividad, pero podés aumentar un poco para mejores resultados.",
      needsWork: "Sumar más actividad física aceleraría mucho tu progreso hacia el objetivo.",
      nutritionBoost: "Para potenciar estos entrenamientos, asegurate de mantener un déficit calórico saludable.",
      recipeAdvice: "Combiná esta actividad con recetas bajas en calorías y altas en proteínas.",
      restDay: "Hoy descansá, pero cuidá tu alimentación para no frenar el progreso.",
    },
  },
  gain_muscle: {
    label: "Ganar masa muscular",
    icon: <Dumbbell className="w-4 h-4" />,
    idealWorkoutsPerWeek: { min: 3, ideal: 5 },
    idealMinutesPerWeek: 180,
    focusWorkouts: ["Musculación", "Funcional", "HIIT"],
    tips: {
      excellent: "¡Perfecto! Tu frecuencia de entrenamiento es ideal para ganar músculo.",
      good: "Buena constancia, pero podrías agregar una sesión más para maximizar ganancias.",
      needsWork: "Para ganar músculo, necesitás entrenar con más regularidad. ¡Empezá hoy!",
      nutritionBoost: "Las proteínas son clave. Revisá tu Balance para asegurar un buen aporte.",
      recipeAdvice: "Necesitás recetas ricas en proteínas y carbohidratos para recuperarte.",
      restDay: "El descanso también construye músculo. Comé bien para recuperarte.",
    },
  },
  stay_active: {
    label: "Mantener peso",
    icon: <Scale className="w-4 h-4" />,
    idealWorkoutsPerWeek: { min: 2, ideal: 4 },
    idealMinutesPerWeek: 150,
    focusWorkouts: ["Cardio", "Yoga", "Funcional"],
    tips: {
      excellent: "¡Excelente! Estás manteniendo un ritmo de actividad muy saludable.",
      good: "Tu actividad es buena, seguí así para mantener tu peso estable.",
      needsWork: "Un poco más de movimiento te ayudaría a mantener tu peso ideal.",
      nutritionBoost: "Mantené un balance calórico equilibrado para sostener tus resultados.",
      recipeAdvice: "Optá por recetas balanceadas que acompañen tu estilo de vida activo.",
      restDay: "Días de descanso son normales. No te excedas con las calorías hoy.",
    },
  },
  improve_performance: {
    label: "Mejorar rendimiento",
    icon: <Trophy className="w-4 h-4" />,
    idealWorkoutsPerWeek: { min: 4, ideal: 6 },
    idealMinutesPerWeek: 240,
    focusWorkouts: ["HIIT", "Running", "Funcional", "Musculación"],
    tips: {
      excellent: "¡Sos un crack! Tu nivel de actividad es perfecto para mejorar el rendimiento.",
      good: "Buen progreso, pero para mejorar más necesitás aumentar la frecuencia.",
      needsWork: "Para mejorar tu rendimiento, necesitás entrenar más seguido.",
      nutritionBoost: "La nutrición es el combustible. Revisá que estés comiendo suficiente.",
      recipeAdvice: "Priorizá comidas pre y post-entrenamiento con carbohidratos y proteínas.",
      restDay: "Descansá bien hoy. La recuperación es parte del progreso.",
    },
  },
};

export function SmartActivityAnalysis({
  goal,
  stats,
  onNavigateToBalance,
}: SmartActivityAnalysisProps) {
  const goalConfig = goal?.goal ? GOAL_ACTIVITY_CONFIG[goal.goal] : null;

  // Calculate activity analysis
  const analysis = useMemo(() => {
    if (!goalConfig) {
      return {
        score: 0,
        status: "no_goal" as const,
        weeklyProgress: 0,
        minutesProgress: 0,
      };
    }

    const { weeklyWorkouts, totalMinutes, weeklyWorkoutTarget } = stats;
    const target = weeklyWorkoutTarget || goalConfig.idealWorkoutsPerWeek.ideal;
    
    // Calculate workout frequency score (0-50 points)
    const workoutScore = Math.min(50, (weeklyWorkouts / target) * 50);
    
    // Calculate consistency score based on streak (0-30 points)
    const streakScore = Math.min(30, stats.currentStreak * 10);
    
    // Calculate intensity/effort score (0-20 points)
    const avgMinutesPerWorkout = weeklyWorkouts > 0 ? totalMinutes / weeklyWorkouts : 0;
    const intensityScore = Math.min(20, avgMinutesPerWorkout > 30 ? 20 : (avgMinutesPerWorkout / 30) * 20);
    
    const totalScore = Math.round(workoutScore + streakScore + intensityScore);
    const weeklyProgress = Math.min(100, Math.round((weeklyWorkouts / target) * 100));

    let status: "excellent" | "good" | "needs_work" | "poor";
    if (totalScore >= 80) status = "excellent";
    else if (totalScore >= 55) status = "good";
    else if (totalScore >= 30) status = "needs_work";
    else status = "poor";

    return {
      score: totalScore,
      status,
      weeklyProgress,
      minutesProgress: Math.min(100, Math.round((totalMinutes / goalConfig.idealMinutesPerWeek) * 100)),
    };
  }, [stats, goalConfig]);

  // Generate insights
  const insights = useMemo(() => {
    if (!goalConfig || analysis.status === "no_goal") return [];

    const list: { type: "success" | "warning" | "tip" | "nutrition"; message: string; icon?: React.ReactNode }[] = [];

    // Main activity status
    if (analysis.status === "excellent") {
      list.push({ type: "success", message: goalConfig.tips.excellent, icon: <CheckCircle2 className="w-4 h-4" /> });
    } else if (analysis.status === "good") {
      list.push({ type: "success", message: goalConfig.tips.good, icon: <CheckCircle2 className="w-4 h-4" /> });
    } else {
      list.push({ type: "warning", message: goalConfig.tips.needsWork, icon: <AlertTriangle className="w-4 h-4" /> });
    }

    // Nutrition connection
    if (stats.weeklyWorkouts > 0) {
      list.push({ 
        type: "nutrition", 
        message: goalConfig.tips.nutritionBoost,
        icon: <Salad className="w-4 h-4" />
      });
    }

    // Recipe advice when activity is good
    if (analysis.status === "excellent" || analysis.status === "good") {
      list.push({ 
        type: "tip", 
        message: goalConfig.tips.recipeAdvice,
        icon: <ChefHat className="w-4 h-4" />
      });
    }

    return list;
  }, [analysis, goalConfig, stats]);

  // Rest day message
  const isRestDay = stats.currentStreak === 0 && stats.weeklyWorkouts > 0;
  
  // No goal configured
  if (!goal?.goal) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-6 text-center">
          <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Sin objetivo configurado</p>
          <p className="text-sm text-muted-foreground mb-3">
            Configurá tu objetivo en la sección Resumen para recibir análisis personalizado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity-Goal Alignment Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden bg-card border-border">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4 mb-5">
              {/* Score Display */}
              <div className="relative">
                <motion.div 
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    "bg-muted border-2",
                    analysis.status === "excellent" && "border-emerald-500/50",
                    analysis.status === "good" && "border-primary/50",
                    analysis.status === "needs_work" && "border-amber-500/50",
                    analysis.status === "poor" && "border-rose-500/50",
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <span className={cn(
                    "text-2xl font-bold",
                    analysis.status === "excellent" && "text-emerald-600 dark:text-emerald-400",
                    analysis.status === "good" && "text-primary",
                    analysis.status === "needs_work" && "text-amber-600 dark:text-amber-400",
                    analysis.status === "poor" && "text-rose-600 dark:text-rose-400",
                  )}>
                    {analysis.score}
                  </span>
                </motion.div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="secondary" 
                    className="gap-1.5"
                  >
                    {goalConfig?.icon}
                    <span className="text-[10px]">{goalConfig?.label}</span>
                  </Badge>
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  analysis.status === "excellent" && "text-emerald-600 dark:text-emerald-400",
                  analysis.status === "good" && "text-foreground",
                  analysis.status === "needs_work" && "text-amber-600 dark:text-amber-400",
                  analysis.status === "poor" && "text-rose-600 dark:text-rose-400",
                )}>
                  {analysis.status === "excellent" && "Rendimiento óptimo"}
                  {analysis.status === "good" && "Buen progreso"}
                  {analysis.status === "needs_work" && "Necesita mejora"}
                  {analysis.status === "poor" && "Requiere atención"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {analysis.status === "excellent" && "Tu actividad física es perfecta para tu objetivo"}
                  {analysis.status === "good" && "Buena actividad, con espacio para optimizar"}
                  {analysis.status === "needs_work" && "Tu actividad necesita aumentar"}
                  {analysis.status === "poor" && "Necesitás más actividad"}
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Dumbbell className="w-3 h-3" />
                    Sesiones
                  </span>
                  <span className="font-medium text-foreground">{stats.weeklyWorkouts}/{stats.weeklyWorkoutTarget}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.weeklyProgress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Flame className="w-3 h-3" />
                    Racha
                  </span>
                  <span className="font-medium text-foreground">{stats.currentStreak}d</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.currentStreak * 15)}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommended workouts for goal */}
      {goalConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2 text-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Entrenamientos recomendados
              </p>
              <div className="flex flex-wrap gap-2">
                {goalConfig.focusWorkouts.map((workout, index) => (
                  <motion.div
                    key={workout}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {workout}
                    </Badge>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Target: {goalConfig.idealWorkoutsPerWeek.min}-{goalConfig.idealWorkoutsPerWeek.ideal} sesiones/semana
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Insights with nutrition connection */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          {insights.map((insight, index) => (
            <Card 
              key={index}
              className="overflow-hidden bg-card border-border relative"
            >
              {/* Side accent */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                insight.type === "success" && "bg-emerald-500",
                insight.type === "warning" && "bg-amber-500",
                insight.type === "tip" && "bg-primary",
                insight.type === "nutrition" && "bg-green-500",
              )} />
              
              <CardContent className="py-3 pl-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 shrink-0",
                    insight.type === "success" && "text-emerald-600 dark:text-emerald-400",
                    insight.type === "warning" && "text-amber-600 dark:text-amber-400",
                    insight.type === "tip" && "text-primary",
                    insight.type === "nutrition" && "text-green-600 dark:text-green-400",
                  )}>
                    {insight.icon}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{insight.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Navigate to Balance CTA */}
      {onNavigateToBalance && stats.weeklyWorkouts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-emerald-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Salad className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-0.5">Conectá actividad + nutrición</p>
                  <p className="text-xs text-muted-foreground">
                    Optimizá tus resultados revisando tu Balance
                  </p>
                </div>
              </div>
              <Button 
                onClick={onNavigateToBalance} 
                size="sm" 
                className="w-full mt-3 gap-2"
              >
                <Activity className="w-4 h-4" />
                Ver Balance nutricional
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty activity advice */}
      {stats.totalWorkouts === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-primary/30">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 text-foreground">¡Es momento de empezar!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para {goalConfig?.label.toLowerCase()}, te recomiendo {goalConfig?.focusWorkouts.slice(0, 2).join(" o ")}.
                    La nutrición es importante, pero el movimiento es clave para alcanzar tu objetivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
