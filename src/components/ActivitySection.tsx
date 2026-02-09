import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useActivityTracking, FitnessGoal, WorkoutType } from "@/hooks/useActivityTracking";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSound } from "@/hooks/useSound";
import { toast } from "sonner";
import marcelaCharacter from "@/assets/marcela-character.png";
import { MetricCard } from "@/components/activity/MetricCard";
import { SmartActivityAnalysis } from "@/components/activity/SmartActivityAnalysis";
import { ActivityProgressChart } from "@/components/activity/ActivityProgressChart";
import { AnimatedCounter } from "@/components/activity/AnimatedCounter";
import {
  Dumbbell,
  Target,
  Flame,
  Clock,
  Calendar,
  Trophy,
  Zap,
  Heart,
  Plus,
  Trash2,
  Sparkles,
  Activity,
  ChevronRight,
  PersonStanding,
  Bike,
  Waves,
  Mountain,
  TrendingUp,
  Check,
} from "lucide-react";

// Workout type config
const WORKOUT_CONFIG: Record<WorkoutType, { icon: React.ReactNode; label: string; labelEn: string; color: string }> = {
  strength: { icon: <Dumbbell className="w-4 h-4" />, label: "Musculación", labelEn: "Strength", color: "bg-orange-500" },
  cardio: { icon: <Heart className="w-4 h-4" />, label: "Cardio", labelEn: "Cardio", color: "bg-red-500" },
  boxing: { icon: <Zap className="w-4 h-4" />, label: "Boxeo", labelEn: "Boxing", color: "bg-purple-500" },
  functional: { icon: <Activity className="w-4 h-4" />, label: "Funcional", labelEn: "Functional", color: "bg-blue-500" },
  yoga: { icon: <PersonStanding className="w-4 h-4" />, label: "Yoga", labelEn: "Yoga", color: "bg-teal-500" },
  swimming: { icon: <Waves className="w-4 h-4" />, label: "Natación", labelEn: "Swimming", color: "bg-cyan-500" },
  running: { icon: <PersonStanding className="w-4 h-4" />, label: "Running", labelEn: "Running", color: "bg-green-500" },
  cycling: { icon: <Bike className="w-4 h-4" />, label: "Ciclismo", labelEn: "Cycling", color: "bg-amber-500" },
  hiit: { icon: <Flame className="w-4 h-4" />, label: "HIIT", labelEn: "HIIT", color: "bg-pink-500" },
  other: { icon: <Mountain className="w-4 h-4" />, label: "Otro", labelEn: "Other", color: "bg-gray-500" },
};

// Goal config
const GOAL_CONFIG: Record<FitnessGoal, { label: string; labelEn: string; icon: React.ReactNode; description: string; descriptionEn: string }> = {
  lose_fat: { 
    label: "Perder grasa", 
    labelEn: "Lose Fat",
    icon: <Flame className="w-5 h-5" />, 
    description: "Enfocá tu entrenamiento en quemar calorías y cardio",
    descriptionEn: "Focus your training on burning calories and cardio"
  },
  gain_muscle: { 
    label: "Ganar músculo", 
    labelEn: "Build Muscle",
    icon: <Dumbbell className="w-5 h-5" />, 
    description: "Priorizá entrenamientos de fuerza y proteínas",
    descriptionEn: "Prioritize strength training and protein"
  },
  stay_active: { 
    label: "Mantenerme activo", 
    labelEn: "Stay Active",
    icon: <Heart className="w-5 h-5" />, 
    description: "Mantené un estilo de vida saludable y equilibrado",
    descriptionEn: "Maintain a healthy and balanced lifestyle"
  },
  improve_performance: { 
    label: "Mejorar rendimiento", 
    labelEn: "Improve Performance",
    icon: <Trophy className="w-5 h-5" />, 
    description: "Superá tus límites y mejorá tu performance",
    descriptionEn: "Push your limits and improve your performance"
  },
};

const INTENSITY_LABELS: Record<number, { es: string; en: string }> = {
  1: { es: "Muy baja", en: "Very low" },
  2: { es: "Baja", en: "Low" },
  3: { es: "Moderada", en: "Moderate" },
  4: { es: "Alta", en: "High" },
  5: { es: "Muy alta", en: "Very high" },
};

interface ActivitySectionProps {
  onNavigateToBalance?: () => void;
}

export function ActivitySection({ onNavigateToBalance }: ActivitySectionProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { play } = useSound();
  const { 
    workouts, 
    goal, 
    stats, 
    isLoading, 
    isSaving,
    addWorkout, 
    deleteWorkout,
    getWorkoutsByPeriod 
  } = useActivityTracking();

  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [soundEnabled] = useState(true);
  const [workoutRegistered, setWorkoutRegistered] = useState(false);
  
  // Add workout form state
  const [workoutForm, setWorkoutForm] = useState({
    type: 'strength' as WorkoutType,
    duration: 30,
    intensity: 3, // Changed to 1-5 scale (baja/media/alta)
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Get metric feedback messages
  const getMetricFeedback = useMemo(() => {
    const target = stats.weeklyWorkoutTarget;
    const current = stats.weeklyWorkouts;
    
    return {
      weekly: current === 0 
        ? (language === 'es' ? '¡Empezá hoy!' : 'Start today!')
        : current >= target 
          ? (language === 'es' ? '¡Objetivo cumplido! 🎉' : 'Goal achieved! 🎉')
          : (language === 'es' ? `${current} de ${target} completados` : `${current} of ${target} completed`),
      
      calories: stats.totalCalories === 0
        ? (language === 'es' ? 'Registrá tu primer entrenamiento' : 'Log your first workout')
        : stats.totalCalories > 1000
          ? (language === 'es' ? '¡Gran trabajo quemando calorías!' : 'Great job burning calories!')
          : (language === 'es' ? 'Actividad acorde a tu objetivo' : 'Activity aligned with your goal'),
      
      streak: stats.currentStreak === 0
        ? (language === 'es' ? 'Podés iniciar una racha hoy' : 'You can start a streak today')
        : stats.currentStreak >= 3
          ? (language === 'es' ? '¡Seguí así, vas muy bien!' : 'Keep going, you\'re doing great!')
          : (language === 'es' ? `${stats.currentStreak} día${stats.currentStreak > 1 ? 's' : ''} seguido${stats.currentStreak > 1 ? 's' : ''}` : `${stats.currentStreak} consecutive day${stats.currentStreak > 1 ? 's' : ''}`),
      
      avgDuration: stats.avgDuration === 0
        ? (language === 'es' ? 'Sin datos aún' : 'No data yet')
        : stats.avgDuration >= 45
          ? (language === 'es' ? 'Excelente duración promedio' : 'Excellent average duration')
          : (language === 'es' ? 'Buen promedio para tu nivel' : 'Good average for your level'),
    };
  }, [stats, language]);

  // Get motivational message based on goal and progress
  const getMotivationalMessage = useMemo(() => {
    if (!goal) {
      return language === 'es' 
        ? "¡Configurá tu perfil para empezar a registrar tu actividad!" 
        : "Set up your profile to start tracking your activity!";
    }

    const goalConfig = GOAL_CONFIG[goal.goal];
    
    if (stats.weeklyWorkouts === 0) {
      return language === 'es'
        ? `¡Es hora de empezar! Tu objetivo es ${goalConfig.label.toLowerCase()}.`
        : `Time to get started! Your goal is to ${goalConfig.labelEn.toLowerCase()}.`;
    }
    
    if (stats.currentStreak >= 3) {
      return language === 'es'
        ? `¡Increíble! Llevas ${stats.currentStreak} días seguidos entrenando 🔥`
        : `Amazing! You've been training for ${stats.currentStreak} days in a row 🔥`;
    }

    if (stats.weeklyWorkouts >= stats.weeklyWorkoutTarget) {
      return language === 'es'
        ? "¡Objetivo semanal cumplido! Sos imparable 💪"
        : "Weekly goal achieved! You're unstoppable 💪";
    }

    const remaining = stats.weeklyWorkoutTarget - stats.weeklyWorkouts;
    return language === 'es'
      ? `Te faltan ${remaining} entrenamiento${remaining > 1 ? 's' : ''} para tu meta semanal. ¡Vamos!`
      : `${remaining} more workout${remaining > 1 ? 's' : ''} to reach your weekly goal. Let's go!`;
  }, [goal, stats, language]);

  // Handle add workout
  const handleAddWorkout = useCallback(async () => {
    // Map intensity from 1-5 to 1-10 for storage
    const mappedIntensity = workoutForm.intensity * 2;
    
    const success = await addWorkout(
      workoutForm.type,
      workoutForm.duration,
      mappedIntensity,
      workoutForm.notes || undefined,
      workoutForm.date
    );

    if (success) {
      if (soundEnabled) {
        play('success');
      }
      setWorkoutRegistered(true);
      setTimeout(() => setWorkoutRegistered(false), 2000);
      
      toast.success(
        language === 'es' ? '¡Entrenamiento registrado!' : 'Workout logged!',
        { 
          description: language === 'es' 
            ? `${workoutForm.duration} min de ${WORKOUT_CONFIG[workoutForm.type].label}` 
            : `${workoutForm.duration} min of ${WORKOUT_CONFIG[workoutForm.type].labelEn}`
        }
      );
      setShowAddWorkout(false);
      setWorkoutForm({
        type: 'strength',
        duration: 30,
        intensity: 3,
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [workoutForm, addWorkout, soundEnabled, play, language]);

  if (!user) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {language === 'es' ? 'Iniciá sesión para usar esta función' : 'Log in to use this feature'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'es' 
                  ? 'Registrá tu actividad física y seguí tu progreso'
                  : 'Track your physical activity and follow your progress'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explanation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Dumbbell className="w-4 h-4 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-foreground font-medium">
                  {language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === 'es' 
                    ? <>Agregá tu <span className="font-medium text-foreground">entrenamiento de cada día</span> y combinalo con tu nutrición para obtener un análisis completo de tu progreso en la pestaña <span className="font-medium text-orange-500">Resumen</span>.</>
                    : <>Add your <span className="font-medium text-foreground">daily workout</span> and combine it with your nutrition to get a complete analysis of your progress in the <span className="font-medium text-orange-500">Summary</span> tab.</>
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Activity Analysis - Goal connected */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <SmartActivityAnalysis
          goal={goal}
          stats={stats}
          onNavigateToBalance={onNavigateToBalance}
        />
      </motion.div>

      {/* Marcela Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              <motion.div 
                className="relative shrink-0"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src={marcelaCharacter} 
                  alt="Marcela" 
                  className="w-14 h-14 object-contain"
                />
                {/* Status indicator */}
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-primary">
                    Marcela AI
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {language === 'es' ? 'EN LÍNEA' : 'ONLINE'}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{getMotivationalMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview with Feedback */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<Dumbbell className="w-5 h-5" />}
          value={stats.weeklyWorkouts}
          label={language === 'es' ? 'Esta semana' : 'This week'}
          feedback={getMetricFeedback.weekly}
          color="orange"
          delay={0.1}
        />
        <MetricCard
          icon={<Flame className="w-5 h-5" />}
          value={stats.totalCalories}
          label={language === 'es' ? 'Calorías total' : 'Total calories'}
          feedback={getMetricFeedback.calories}
          color="red"
          delay={0.15}
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          value={stats.currentStreak}
          label={language === 'es' ? 'Racha actual' : 'Current streak'}
          feedback={getMetricFeedback.streak}
          color="green"
          delay={0.2}
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          value={stats.avgDuration}
          label={language === 'es' ? 'Min promedio' : 'Avg minutes'}
          feedback={getMetricFeedback.avgDuration}
          color="blue"
          suffix=" min"
          delay={0.25}
        />
      </div>

      {/* Add Workout Button */}
      <Dialog open={showAddWorkout} onOpenChange={setShowAddWorkout}>
        <DialogTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button className="w-full h-12 text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              {language === 'es' ? 'Registrar entrenamiento' : 'Log workout'}
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span>
                {language === 'es' ? 'Nuevo entrenamiento' : 'New workout'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Workout Type */}
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Tipo de entrenamiento' : 'Workout type'}</Label>
              <Select 
                value={workoutForm.type} 
                onValueChange={(v) => setWorkoutForm({ ...workoutForm, type: v as WorkoutType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(WORKOUT_CONFIG) as [WorkoutType, typeof WORKOUT_CONFIG[WorkoutType]][]).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{language === 'es' ? config.label : config.labelEn}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Duración (minutos)' : 'Duration (minutes)'}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[workoutForm.duration]}
                  onValueChange={([v]) => setWorkoutForm({ ...workoutForm, duration: v })}
                  min={5}
                  max={180}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium tabular-nums">{workoutForm.duration}</span>
              </div>
            </div>

            {/* Intensity (simplified: low/medium/high) */}
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Intensidad' : 'Intensity'}</Label>
              <div className="flex gap-2">
                {[
                  { value: 2, label: language === 'es' ? 'Baja' : 'Low' },
                  { value: 3, label: language === 'es' ? 'Media' : 'Medium' },
                  { value: 5, label: language === 'es' ? 'Alta' : 'High' },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={workoutForm.intensity === opt.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1",
                      workoutForm.intensity === opt.value && "bg-accent hover:bg-accent/90 text-accent-foreground"
                    )}
                    onClick={() => setWorkoutForm({ ...workoutForm, intensity: opt.value })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Fecha' : 'Date'}</Label>
              <Input
                type="date"
                value={workoutForm.date}
                onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}</Label>
              <Textarea
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                placeholder={language === 'es' ? 'Ejercicios, sensaciones...' : 'Exercises, feelings...'}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleAddWorkout}
              disabled={isSaving}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-11"
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {language === 'es' ? 'Guardando...' : 'Saving...'}
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {language === 'es' ? 'Guardar entrenamiento' : 'Save workout'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <ActivityProgressChart 
          getWorkoutsByPeriod={getWorkoutsByPeriod}
          weeklyTarget={stats.weeklyWorkoutTarget}
        />
      </motion.div>


      {/* Recent Workouts */}
      <AnimatePresence>
        {workouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'es' ? 'Historial reciente' : 'Recent history'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workouts.slice(0, 5).map((workout, index) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-2.5 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-white",
                          WORKOUT_CONFIG[workout.workout_type].color
                        )}>
                          {WORKOUT_CONFIG[workout.workout_type].icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {language === 'es' 
                              ? WORKOUT_CONFIG[workout.workout_type].label 
                              : WORKOUT_CONFIG[workout.workout_type].labelEn
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(workout.workout_date).toLocaleDateString(
                              language === 'es' ? 'es-AR' : 'en-US', 
                              { weekday: 'short', day: 'numeric', month: 'short' }
                            )}
                            {workout.intensity && (
                              <span className="ml-2">
                                • {workout.intensity <= 4 
                                    ? (language === 'es' ? 'Baja' : 'Low')
                                    : workout.intensity <= 6 
                                      ? (language === 'es' ? 'Media' : 'Medium')
                                      : (language === 'es' ? 'Alta' : 'High')
                                  }
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{workout.duration_minutes} min</p>
                          <p className="text-xs text-muted-foreground">{workout.calories_burned} cal</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWorkout(workout.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {workouts.length === 0 && goal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {language === 'es' ? 'Sin entrenamientos registrados' : 'No workouts logged'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'es' 
                      ? 'Registrá tu primer entrenamiento para empezar a ver tu progreso'
                      : 'Log your first workout to start seeing your progress'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}


      {/* Best streak achievement */}
      {stats.bestStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {language === 'es' ? 'Mejor racha' : 'Best streak'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? `${stats.bestStreak} días consecutivos entrenando`
                      : `${stats.bestStreak} consecutive days training`
                    }
                  </p>
                </div>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  🔥 {stats.bestStreak}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
