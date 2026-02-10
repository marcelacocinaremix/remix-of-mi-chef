import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Flame,
  ChefHat,
  Dumbbell,
  Scale,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Trophy,
  Clock,
  Utensils,
  Cpu,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { UserFitnessGoal, WorkoutStats } from "@/hooks/useActivityTracking";

import healthSummaryBanner from "@/assets/health-summary-banner.jpg";
import { GoalProgressChart } from "@/components/activity/GoalProgressChart";
import { AnimatedCounter } from "@/components/activity/AnimatedCounter";

type SummaryPeriod = "week" | "month" | "year";

interface PeriodNutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealsCount: number;
}

interface HealthSummaryProps {
  goal: UserFitnessGoal | null;
  stats: WorkoutStats;
  weeklyRecipesCount: number;
  totalCaloriesConsumed: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
  totalWorkouts: number;
  todayCalories?: number;
  todayProtein?: number;
  todayCarbs?: number;
  todayFats?: number;
  todayMealsCount?: number;
  getNutritionForPeriod?: (period: SummaryPeriod) => PeriodNutritionData;
  getWorkoutsForPeriod?: (period: SummaryPeriod) => number;
}

const GOAL_CONFIG: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  idealMacros: { protein: number; carbs: number; fats: number };
  activityFocus: string;
  nutritionFocus: string;
}> = {
  lose_fat: { 
    label: "Bajar de peso", 
    icon: <TrendingDown className="w-4 h-4" />, 
    color: "text-rose-500",
    bgColor: "bg-rose-500/15",
    idealMacros: { protein: 35, carbs: 35, fats: 30 },
    activityFocus: "Cardio y HIIT para quemar calorías",
    nutritionFocus: "Déficit calórico con alto contenido proteico"
  },
  gain_muscle: { 
    label: "Ganar masa muscular", 
    icon: <TrendingUp className="w-4 h-4" />, 
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/15",
    idealMacros: { protein: 40, carbs: 40, fats: 20 },
    activityFocus: "Entrenamiento de fuerza regular",
    nutritionFocus: "Superávit calórico con proteínas altas"
  },
  stay_active: { 
    label: "Mantener peso", 
    icon: <Scale className="w-4 h-4" />, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/15",
    idealMacros: { protein: 30, carbs: 45, fats: 25 },
    activityFocus: "Actividad moderada y constante",
    nutritionFocus: "Balance calórico equilibrado"
  },
  improve_performance: { 
    label: "Mejorar rendimiento", 
    icon: <Trophy className="w-4 h-4" />, 
    color: "text-purple-500",
    bgColor: "bg-purple-500/15",
    idealMacros: { protein: 30, carbs: 50, fats: 20 },
    activityFocus: "Entrenamiento intenso y variado",
    nutritionFocus: "Combustible para alto rendimiento"
  },
};

// Removed TechGridPattern for cleaner design

// Animated Ring Chart Component
const AnimatedRingChart = ({ 
  value, 
  maxValue = 100, 
  size = 80, 
  strokeWidth = 8,
  color,
  delay = 0,
  label,
  icon
}: { 
  value: number; 
  maxValue?: number; 
  size?: number; 
  strokeWidth?: number;
  color: string;
  delay?: number;
  label: string;
  icon: React.ReactNode;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/30"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <AnimatedCounter 
              value={Math.round(value)} 
              className="text-lg font-bold font-mono text-foreground"
              suffix="%"
            />
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className="opacity-70">{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  );
};

// Animated Bar Chart
const AnimatedBarChart = ({ 
  data, 
  delay = 0 
}: { 
  data: { label: string; value: number; ideal: number; colorClass: string }[];
  delay?: number;
}) => {
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {data.map((item, index) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono uppercase tracking-wider">{item.label}</span>
            <div className="flex items-center gap-2">
              <motion.span 
                className="font-bold font-mono text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 + index * 0.1 }}
              >
                {Math.round(item.value)}%
              </motion.span>
              <span className="text-muted-foreground/50 text-[10px]">/ {item.ideal}%</span>
            </div>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Ideal marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10"
              style={{ left: `${item.ideal}%` }}
            />
            {/* Animated bar */}
            <motion.div
              className={cn("h-full rounded-full", item.colorClass)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(item.value, 100)}%` }}
              transition={{ duration: 1, delay: delay + 0.3 + index * 0.15, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// Removed ScanLine for cleaner design

export function HealthSummary({ 
  goal, 
  stats, 
  weeklyRecipesCount, 
  totalCaloriesConsumed,
  proteinPercent,
  carbsPercent,
  fatsPercent,
  totalWorkouts,
  todayCalories = 0,
  todayProtein = 0,
  todayCarbs = 0,
  todayFats = 0,
  todayMealsCount = 0,
  getNutritionForPeriod,
  getWorkoutsForPeriod,
}: HealthSummaryProps) {
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>("week");
  const goalConfig = goal?.goal ? GOAL_CONFIG[goal.goal] : null;

  const periodLabels: Record<SummaryPeriod, string> = { week: "Semana", month: "Mes", year: "Año" };
  
  const periodNutrition = getNutritionForPeriod?.(summaryPeriod) ?? {
    calories: totalCaloriesConsumed,
    protein: 0, carbs: 0, fats: 0,
    mealsCount: weeklyRecipesCount,
  };
  const periodWorkoutsCount = getWorkoutsForPeriod?.(summaryPeriod) ?? totalWorkouts;
  
  // Calculate scores for each area
  const balanceScore = weeklyRecipesCount > 0 ? Math.min(100, weeklyRecipesCount * 15) : 0;
  const activityScore = stats.targetProgress;
  
  // Calculate macro alignment score (how close to ideal for the goal)
  const macroAlignmentScore = goalConfig ? (() => {
    const idealMacros = goalConfig.idealMacros;
    const proteinDiff = Math.abs(proteinPercent - idealMacros.protein);
    const carbsDiff = Math.abs(carbsPercent - idealMacros.carbs);
    const fatsDiff = Math.abs(fatsPercent - idealMacros.fats);
    const totalDiff = proteinDiff + carbsDiff + fatsDiff;
    return weeklyRecipesCount > 0 ? Math.round(Math.max(0, 100 - totalDiff)) : 0;
  })() : 0;

  // Overall progress weighted by goal
  const overallProgress = Math.round(
    (balanceScore * 0.35) + (activityScore * 0.45) + (macroAlignmentScore * 0.2)
  );

  // Get status based on overall progress
  const getStatus = () => {
    if (!goal?.goal) return { level: "none", label: "Sin objetivo", color: "text-muted-foreground", bgColor: "bg-muted" };
    if (overallProgress >= 80) return { level: "excellent", label: "Excelente", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
    if (overallProgress >= 60) return { level: "good", label: "Muy bien", color: "text-primary", bgColor: "bg-primary/20" };
    if (overallProgress >= 40) return { level: "moderate", label: "En progreso", color: "text-amber-400", bgColor: "bg-amber-500/20" };
    return { level: "starting", label: "Comenzando", color: "text-muted-foreground", bgColor: "bg-muted" };
  };

  const status = getStatus();

  // Get comprehensive insight message
  const getInsightMessage = () => {
    if (!goal?.goal) return "Configurá tu objetivo para recibir un análisis personalizado.";

    const hasActivity = activityScore >= 30;
    const hasNutrition = balanceScore >= 30;
    const hasBoth = hasActivity && hasNutrition;

    if (hasBoth && overallProgress >= 70) {
      return "¡Vas increíble! Tu alimentación y actividad física están alineados con tu objetivo. Seguí así para ver resultados.";
    }
    
    if (hasBoth && overallProgress >= 40) {
      return "Buen trabajo combinando nutrición y ejercicio. Con un poco más de consistencia vas a ver grandes mejoras.";
    }

    if (hasActivity && !hasNutrition) {
      return "Tu actividad física es buena, pero necesitás cocinar más para potenciar tus resultados. La nutrición es clave.";
    }

    if (hasNutrition && !hasActivity) {
      return "Tu alimentación va bien, pero sumá más ejercicio. La combinación de ambos acelera tu progreso.";
    }

    return "¡Es momento de empezar! Cociná recetas saludables y sumá actividad física para alcanzar tu objetivo.";
  };

  // Get specific recommendations based on current state
  const getRecommendations = () => {
    if (!goalConfig) return [];

    const recs: { icon: React.ReactNode; text: string; type: "activity" | "nutrition" | "tip" }[] = [];

    // Activity recommendation
    if (activityScore < 50) {
      recs.push({
        icon: <Dumbbell className="w-4 h-4" />,
        text: goalConfig.activityFocus,
        type: "activity"
      });
    }

    // Nutrition recommendation  
    if (balanceScore < 50) {
      recs.push({
        icon: <Utensils className="w-4 h-4" />,
        text: goalConfig.nutritionFocus,
        type: "nutrition"
      });
    }

    // Streak tip
    if (stats.currentStreak > 0) {
      recs.push({
        icon: <Zap className="w-4 h-4" />,
        text: `¡Llevás ${stats.currentStreak} días activo! No rompas la racha.`,
        type: "tip"
      });
    }

    return recs.slice(0, 3);
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-4">
      {/* Header Banner - Tech Style */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-36 rounded-xl overflow-hidden"
      >
        <img 
          src={healthSummaryBanner} 
          alt="Health Summary" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-primary/30 flex items-center justify-center backdrop-blur-sm border border-primary/40"
              animate={{ 
                boxShadow: ["0 0 20px hsl(340 82% 52% / 0.3)", "0 0 40px hsl(340 82% 52% / 0.5)", "0 0 20px hsl(340 82% 52% / 0.3)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Cpu className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Tu Resumen Integral
                <motion.span 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </h3>
              <p className="text-white/70 text-sm">Objetivo + Nutrición + Actividad</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goal Progress Chart */}
      {goal?.goal && goal?.target_weeks && (
        <GoalProgressChart
          goal={goal}
          weeklyWorkouts={stats.weeklyWorkouts}
          totalWorkouts={totalWorkouts}
        />
      )}

      {/* No goal message */}
      {!goal?.goal && (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="py-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tenés un objetivo configurado</p>
            <p className="text-xs text-muted-foreground mt-1">Configuralo arriba para ver tu progreso</p>
          </CardContent>
        </Card>
      )}

      {/* Main Score Card - Tech Style */}
      {goal?.goal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden bg-card border-border">
            <CardContent className="pt-5 pb-5">
              {/* Goal & Status Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", goalConfig?.bgColor, "border-current/30")}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className={goalConfig?.color}>{goalConfig?.icon}</span>
                  </motion.div>
                  <div>
                    <p className="font-semibold text-foreground">{goalConfig?.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">OBJETIVO ACTIVO</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className={cn(status.bgColor, status.color, "border-0 font-mono")}>
                    {status.label}
                  </Badge>
                </motion.div>
              </div>

              {/* Animated Ring Charts */}
              <div className="flex justify-around items-center py-4 mb-4">
                <AnimatedRingChart
                  value={balanceScore}
                  color="hsl(var(--chart-1))"
                  delay={0.2}
                  label="Nutrición"
                  icon={<ChefHat className="w-3 h-3" />}
                />
                <AnimatedRingChart
                  value={activityScore}
                  color="hsl(var(--chart-2))"
                  delay={0.4}
                  label="Actividad"
                  icon={<Dumbbell className="w-3 h-3" />}
                />
                <AnimatedRingChart
                  value={macroAlignmentScore}
                  color="hsl(var(--chart-3))"
                  delay={0.6}
                  label="Macros"
                  icon={<Target className="w-3 h-3" />}
                />
              </div>

              {/* Overall Progress Bar */}
              <div className="mb-4 p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Progreso Global</span>
                  <motion.span 
                    className={cn("text-xl font-bold font-mono", status.color)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <AnimatedCounter value={overallProgress} suffix="%" />
                  </motion.span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      overallProgress >= 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : 
                      overallProgress >= 40 ? "bg-gradient-to-r from-primary to-primary/80" : "bg-gradient-to-r from-amber-500 to-amber-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    style={{ 
                      boxShadow: overallProgress >= 70 
                        ? "0 0 20px rgba(16, 185, 129, 0.5)" 
                        : overallProgress >= 40 
                        ? "0 0 20px rgba(var(--primary), 0.5)"
                        : "0 0 20px rgba(245, 158, 11, 0.5)"
                    }}
                  />
                </div>
              </div>

              {/* Insight message */}
              <motion.div 
                className="p-3 rounded-lg bg-accent/50 border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-start gap-2">
                  {overallProgress >= 60 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm text-foreground">{getInsightMessage()}</p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's Nutrition Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-4 h-4 text-primary" />
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nutrición Hoy</p>
              <Badge variant="secondary" className="text-[10px] font-mono ml-auto">
                {todayMealsCount} comidas
              </Badge>
            </div>
            {todayMealsCount > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { icon: <Flame className="w-4 h-4" />, value: Math.round(todayCalories), label: "Kcal", color: "text-orange-500", delay: 0.2 },
                  { icon: <span className="text-xs font-bold">P</span>, value: Math.round(todayProtein), label: "Proteína", color: "text-chart-1", suffix: "g", delay: 0.3 },
                  { icon: <span className="text-xs font-bold">C</span>, value: Math.round(todayCarbs), label: "Carbos", color: "text-chart-2", suffix: "g", delay: 0.4 },
                  { icon: <span className="text-xs font-bold">G</span>, value: Math.round(todayFats), label: "Grasas", color: "text-chart-3", suffix: "g", delay: 0.5 },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: stat.delay }}
                    className="text-center"
                  >
                    <span className={stat.color}>{stat.icon}</span>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      <AnimatedCounter value={stat.value} duration={1.5} />
                      {stat.suffix && <span className="text-xs">{stat.suffix}</span>}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase whitespace-nowrap">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Aún no registraste comidas hoy
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-chart-2" />
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Actividad Semanal</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: <Activity className="w-4 h-4" />, value: stats.weeklyWorkouts, label: "Entrenos", color: "text-chart-2", delay: 0.3 },
                { icon: <Flame className="w-4 h-4" />, value: stats.totalCalories, label: "Kcal quem.", color: "text-rose-500", delay: 0.4 },
                { icon: <Zap className="w-4 h-4" />, value: stats.currentStreak, label: "Racha", color: "text-amber-500", delay: 0.5 },
                { icon: <Clock className="w-4 h-4" />, value: stats.avgDuration, label: "Min prom.", color: "text-primary", delay: 0.6 },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay }}
                  className="text-center"
                >
                  <span className={stat.color}>{stat.icon}</span>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    <AnimatedCounter value={stat.value} duration={1.5} />
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase whitespace-nowrap">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Resumen por período</p>
              </div>
            </div>
            {/* Period selector */}
            <div className="flex gap-1 mb-4">
              {(["week", "month", "year"] as SummaryPeriod[]).map((p) => (
                <Button
                  key={p}
                  variant={summaryPeriod === p ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setSummaryPeriod(p)}
                >
                  {periodLabels[p]}
                </Button>
              ))}
            </div>
            {/* Period data */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3 h-3" /> Nutrición — {periodLabels[summaryPeriod]}
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div>
                    <p className="text-sm font-bold font-mono text-foreground">{Math.round(periodNutrition.calories)}</p>
                    <p className="text-[9px] text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono text-chart-1">{Math.round(periodNutrition.protein)}g</p>
                    <p className="text-[9px] text-muted-foreground">Proteína</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono text-chart-2">{Math.round(periodNutrition.carbs)}g</p>
                    <p className="text-[9px] text-muted-foreground">Carbos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono text-chart-3">{Math.round(periodNutrition.fats)}g</p>
                    <p className="text-[9px] text-muted-foreground">Grasas</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">{periodNutrition.mealsCount} comidas registradas</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-3 h-3" /> Actividad — {periodLabels[summaryPeriod]}
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold font-mono text-foreground">{periodWorkoutsCount}</p>
                    <p className="text-[9px] text-muted-foreground">Entrenamientos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono text-foreground">{stats.currentStreak}</p>
                    <p className="text-[9px] text-muted-foreground">Racha actual</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          <p className="text-xs font-mono text-muted-foreground px-1 uppercase tracking-wider">Recomendaciones</p>
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <Card className="overflow-hidden bg-card border-border relative">
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  rec.type === "activity" && "bg-chart-2",
                  rec.type === "nutrition" && "bg-chart-1",
                  rec.type === "tip" && "bg-amber-500"
                )} />
                <CardContent className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "shrink-0",
                      rec.type === "activity" && "text-chart-2",
                      rec.type === "nutrition" && "text-chart-1",
                      rec.type === "tip" && "text-amber-500"
                    )}>
                      {rec.icon}
                    </div>
                    <p className="text-sm text-foreground">{rec.text}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Marcela's Tip - Tech Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-accent to-primary/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <motion.div
                className="relative"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">Marcela AI</span>
                </div>
                <p className="text-sm text-foreground">
                  {overallProgress >= 70 
                    ? "¡Estás haciendo un trabajo increíble! Mantené esta consistencia y vas a ver los resultados que buscás. 💪"
                    : overallProgress >= 40
                    ? "Vas por buen camino. La clave es la constancia: cociná más en casa y no te saltees tus entrenamientos."
                    : "El éxito viene de la combinación: buena comida + movimiento. Empezá con pequeños pasos y vas a ver cómo todo suma."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Macro Distribution - Tech Style */}
      {weeklyRecipesCount > 0 && goalConfig && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Distribución de Macros</p>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  vs ideal
                </Badge>
              </div>
              <AnimatedBarChart
                data={[
                  { label: "Proteínas", value: proteinPercent, ideal: goalConfig.idealMacros.protein, colorClass: "bg-chart-1" },
                  { label: "Carbos", value: carbsPercent, ideal: goalConfig.idealMacros.carbs, colorClass: "bg-chart-2" },
                  { label: "Grasas", value: fatsPercent, ideal: goalConfig.idealMacros.fats, colorClass: "bg-chart-3" },
                ]}
                delay={1.1}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
