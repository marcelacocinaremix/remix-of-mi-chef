import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserFitnessGoal, FitnessGoal } from "@/hooks/useActivityTracking";
import { format, addWeeks, differenceInDays, differenceInWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Target, Zap } from "lucide-react";

interface GoalProgressChartProps {
  goal: UserFitnessGoal | null;
  weeklyWorkouts: number;
  totalWorkouts: number;
}

const GOAL_LABELS: Record<FitnessGoal, { es: string; en: string }> = {
  lose_fat: { es: "bajar de peso", en: "lose weight" },
  gain_muscle: { es: "ganar músculo", en: "build muscle" },
  stay_active: { es: "mantenerte activo", en: "stay active" },
  improve_performance: { es: "mejorar rendimiento", en: "improve performance" },
};

// Goals that go UP (gaining) vs DOWN (losing)
const ASCENDING_GOALS: FitnessGoal[] = ['gain_muscle', 'improve_performance', 'stay_active'];

export function GoalProgressChart({ goal, weeklyWorkouts, totalWorkouts }: GoalProgressChartProps) {
  const { language } = useLanguage();

  const progressData = useMemo(() => {
    if (!goal || !goal.target_weeks) {
      return null;
    }

    const startDate = goal.created_at ? new Date(goal.created_at) : new Date();
    const targetDate = goal.target_date 
      ? new Date(goal.target_date) 
      : addWeeks(startDate, goal.target_weeks);
    
    const totalDays = differenceInDays(targetDate, startDate);
    const daysElapsed = differenceInDays(new Date(), startDate);
    const weeksElapsed = differenceInWeeks(new Date(), startDate);
    
    // Calculate progress percentage (0-100)
    const timeProgress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    
    // Calculate workout progress
    const expectedWorkouts = weeksElapsed * (goal.weekly_workout_target || 3);
    const workoutProgress = expectedWorkouts > 0 ? Math.min(100, (totalWorkouts / expectedWorkouts) * 100) : 0;

    // Is this an ascending goal (gain) or descending (lose)?
    const isAscending = ASCENDING_GOALS.includes(goal.goal);

    return {
      startDate,
      targetDate,
      totalDays,
      daysElapsed,
      timeProgress,
      workoutProgress,
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      weeksRemaining: Math.max(0, Math.ceil((totalDays - daysElapsed) / 7)),
      weeksElapsed: Math.max(0, weeksElapsed),
      isAscending,
    };
  }, [goal, totalWorkouts]);

  if (!goal || !progressData) {
    return null;
  }

  const goalLabel = language === 'es' 
    ? GOAL_LABELS[goal.goal].es 
    : GOAL_LABELS[goal.goal].en;

  const targetDateFormatted = format(
    progressData.targetDate, 
    "d MMM", 
    { locale: language === 'es' ? es : undefined }
  );

  // SVG paths based on direction - smoother curve
  const curvePath = progressData.isAscending
    ? "M 15 95 C 50 95 80 85 120 65 C 160 45 200 30 285 25" // Goes UP smoothly
    : "M 15 25 C 50 25 80 35 120 55 C 160 75 200 90 285 95"; // Goes DOWN smoothly

  const areaPath = progressData.isAscending
    ? "M 15 95 C 50 95 80 85 120 65 C 160 45 200 30 285 25 L 285 115 L 15 115 Z"
    : "M 15 25 C 50 25 80 35 120 55 C 160 75 200 90 285 95 L 285 115 L 15 115 Z";

  // Calculate position on curve based on progress
  const progressX = 15 + (progressData.timeProgress / 100) * 270;
  
  // Approximate Y position on curve
  const t = progressData.timeProgress / 100;
  const progressY = progressData.isAscending
    ? 95 - (t * 70 * Math.pow(t, 0.7))
    : 25 + (t * 70 * Math.pow(t, 0.7));

  // Start and end points
  const startY = progressData.isAscending ? 95 : 25;
  const endY = progressData.isAscending ? 25 : 95;

  // Target weight display
  const targetWeight = goal.target_weight_kg || goal.weight_kg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900">
        <CardContent className="pt-5 pb-6 px-5">
          {/* Header with animated text */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-zinc-300 text-base font-medium leading-relaxed">
              {language === 'es' ? 'Tu plan para' : 'Your plan to'}{' '}
              <motion.span 
                className="text-primary font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                {goalLabel}
              </motion.span>
              {' '}{language === 'es' ? 'para el' : 'by'}{' '}
              <motion.span 
                className="text-primary font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                {targetDateFormatted}
              </motion.span>
            </p>
          </motion.div>

          {/* Chart Container */}
          <div className="relative h-40 mt-2">
            {/* Background gradient area */}
            <svg 
              viewBox="0 0 300 120" 
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="progressGradientPink" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(340, 82%, 52%)" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="hsl(340, 82%, 52%)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(340, 82%, 52%)" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="lineGradientPink" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(340, 82%, 52%)" />
                  <stop offset="50%" stopColor="hsl(340, 70%, 65%)" />
                  <stop offset="100%" stopColor="hsl(340, 82%, 52%)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Filled area under curve with animation */}
              <motion.path
                d={areaPath}
                fill="url(#progressGradientPink)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              />

              {/* Main curve line with draw animation */}
              <motion.path
                d={curvePath}
                fill="none"
                stroke="url(#lineGradientPink)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              />

              {/* Start point with pulse animation */}
              <motion.circle
                cx="15"
                cy={startY}
                r="6"
                fill="hsl(340, 82%, 52%)"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ 
                  scale: { duration: 0.4, delay: 0.3 },
                }}
              />
              <motion.circle
                cx="15"
                cy={startY}
                r="3"
                fill="white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              />

              {/* Current progress indicator - Animated Runner */}
              {progressData.timeProgress > 0 && (
                <>
                  {/* Glow effect behind runner */}
                  <motion.circle
                    cx={progressX}
                    cy={progressY}
                    r="12"
                    fill="hsl(340, 82%, 52%)"
                    opacity="0.2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.8, 1] }}
                    transition={{ 
                      duration: 2, 
                      delay: 1.2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                  
                  {/* Runner circle background */}
                  <motion.circle
                    cx={progressX}
                    cy={progressY}
                    r="10"
                    fill="hsl(340, 82%, 52%)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  />
                  
                  {/* Animated running person SVG */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                  >
                    {/* Person body - running pose */}
                    <motion.g
                      animate={{ 
                        y: [-0.5, 0.5, -0.5],
                      }}
                      transition={{ 
                        duration: 0.4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {/* Head */}
                      <circle 
                        cx={progressX} 
                        cy={progressY - 5} 
                        r="2.5" 
                        fill="white"
                      />
                      {/* Body */}
                      <line 
                        x1={progressX} 
                        y1={progressY - 2.5} 
                        x2={progressX} 
                        y2={progressY + 2} 
                        stroke="white" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                      />
                      {/* Arms - animated */}
                      <motion.line 
                        x1={progressX - 3} 
                        y1={progressY - 1} 
                        x2={progressX + 3} 
                        y2={progressY + 1} 
                        stroke="white" 
                        strokeWidth="1.2" 
                        strokeLinecap="round"
                        animate={{ 
                          x1: [progressX - 3, progressX - 1, progressX - 3],
                          x2: [progressX + 3, progressX + 1, progressX + 3],
                        }}
                        transition={{ 
                          duration: 0.3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      {/* Legs - animated running */}
                      <motion.line 
                        x1={progressX} 
                        y1={progressY + 2} 
                        x2={progressX - 3} 
                        y2={progressY + 6} 
                        stroke="white" 
                        strokeWidth="1.2" 
                        strokeLinecap="round"
                        animate={{ 
                          x2: [progressX - 3, progressX + 2, progressX - 3],
                        }}
                        transition={{ 
                          duration: 0.3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.line 
                        x1={progressX} 
                        y1={progressY + 2} 
                        x2={progressX + 3} 
                        y2={progressY + 6} 
                        stroke="white" 
                        strokeWidth="1.2" 
                        strokeLinecap="round"
                        animate={{ 
                          x2: [progressX + 3, progressX - 2, progressX + 3],
                        }}
                        transition={{ 
                          duration: 0.3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.g>
                  </motion.g>
                </>
              )}
            </svg>


            {/* Target badge - animated entry */}
            <motion.div
              className={`absolute ${progressData.isAscending ? 'top-0' : 'bottom-8'} right-0`}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.3, type: "spring" }}
            >
              <div className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {targetWeight ? `${targetWeight} kg` : <Zap className="w-4 h-4" />}
              </div>
            </motion.div>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between items-center mt-1 text-sm">
            <motion.span 
              className="text-zinc-300 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {language === 'es' ? 'Hoy' : 'Today'}
            </motion.span>
            <motion.span 
              className="text-primary font-bold text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {targetDateFormatted}
            </motion.span>
          </div>

          {/* Stats row with animated counters */}
            <motion.div 
            className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-700/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
            >
              <motion.p 
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {goal.target_weeks || progressData.weeksRemaining}
              </motion.p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'es' ? 'semanas' : 'weeks'}
              </p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.p 
                className="text-3xl font-bold text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                {Math.round(progressData.timeProgress)}%
              </motion.p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'es' ? 'transcurrido' : 'elapsed'}
              </p>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
            >
              <motion.p 
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {totalWorkouts}
              </motion.p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'es' ? 'entrenos' : 'workouts'}
              </p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
