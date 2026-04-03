import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Target, 
  Scale, 
  Ruler, 
  Calendar,
  Dumbbell,
  Heart,
  Trophy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ChefHat,
  BarChart3,
  Utensils,
  Flame,
  ArrowRight,
  X
} from "lucide-react";


export type FitnessGoal = 'lose_fat' | 'gain_muscle' | 'stay_active' | 'improve_performance';

export interface HealthProfile {
  weight_kg: number | null;
  target_weight_kg: number | null;
  height_cm: number | null;
  goal: FitnessGoal;
  target_weeks: number;
  weekly_workout_target: number;
}

function healthKey(uid?: string) {
  return uid ? `health_profile_last_v1_${uid}` : "health_profile_last_v1";
}

function readStoredHealthProfile(uid?: string): HealthProfile | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(healthKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const goal: FitnessGoal = parsed.goal;
    if (!goal) return null;

    return {
      weight_kg: parsed.weight_kg ?? null,
      target_weight_kg: parsed.target_weight_kg ?? null,
      height_cm: parsed.height_cm ?? null,
      goal,
      target_weeks: parsed.target_weeks ?? 12,
      weekly_workout_target: parsed.weekly_workout_target ?? 3,
    } as HealthProfile;
  } catch {
    return null;
  }
}

function writeStoredHealthProfile(profile: HealthProfile, uid?: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(healthKey(uid), JSON.stringify(profile));
  } catch {
    // ignore
  }
}

interface HealthProfileSetupProps {
  currentProfile: HealthProfile | null;
  onSave: (profile: HealthProfile) => Promise<boolean>;
  isSaving: boolean;
  isComplete: boolean;
}

const GOAL_OPTIONS: { 
  value: FitnessGoal; 
  icon: React.ReactNode; 
  labelEs: string; 
  labelEn: string; 
  gradient: string;
  bgColor: string;
  cookingTipEs: string;
  cookingTipEn: string;
  activityTipEs: string;
  activityTipEn: string;
}[] = [
  { 
    value: 'lose_fat', 
    icon: <TrendingDown className="w-5 h-5" />, 
    labelEs: 'Bajar de peso', 
    labelEn: 'Lose weight', 
    gradient: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
    cookingTipEs: 'Recetas bajas en calorías',
    cookingTipEn: 'Low-calorie recipes',
    activityTipEs: 'Foco en cardio',
    activityTipEn: 'Focus on cardio'
  },
  { 
    value: 'stay_active', 
    icon: <Heart className="w-5 h-5" />, 
    labelEs: 'Mantenerme activo', 
    labelEn: 'Stay active', 
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    cookingTipEs: 'Balance equilibrado',
    cookingTipEn: 'Balanced diet',
    activityTipEs: 'Movimiento regular',
    activityTipEn: 'Regular movement'
  },
  { 
    value: 'gain_muscle', 
    icon: <Dumbbell className="w-5 h-5" />, 
    labelEs: 'Ganar músculo', 
    labelEn: 'Build muscle', 
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    cookingTipEs: 'Alto en proteínas',
    cookingTipEn: 'High protein',
    activityTipEs: 'Entrenamiento de fuerza',
    activityTipEn: 'Strength training'
  },
  { 
    value: 'improve_performance', 
    icon: <Trophy className="w-5 h-5" />, 
    labelEs: 'Mejorar rendimiento', 
    labelEn: 'Improve fitness', 
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    cookingTipEs: 'Carbos y proteínas',
    cookingTipEn: 'Carbs and protein',
    activityTipEs: 'Entrenamiento intenso',
    activityTipEn: 'Intense training'
  },
];

const TIME_OPTIONS = [
  { weeks: 4, labelEs: '1 mes', labelEn: '1 month' },
  { weeks: 12, labelEs: '3 meses', labelEn: '3 months' },
  { weeks: 26, labelEs: '6 meses', labelEn: '6 months' },
];

const FREQUENCY_OPTIONS = [
  { value: 2, labelEs: '2x', labelEn: '2x' },
  { value: 3, labelEs: '3x', labelEn: '3x' },
  { value: 4, labelEs: '4x', labelEn: '4x' },
  { value: 5, labelEs: '5+', labelEn: '5+' },
];

export function HealthProfileSetup({ currentProfile, onSave, isSaving, isComplete }: HealthProfileSetupProps) {
  const { language } = useLanguage();
  const [storedProfile] = useState<HealthProfile | null>(() => readStoredHealthProfile());
  const [step, setStep] = useState(0);
  // Start collapsed to avoid accidental opens; user explicitly taps Configurar/Editar.
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Sync isExpanded with isComplete prop changes (e.g., when returning to section)
  useEffect(() => {
    if (isComplete) {
      setIsExpanded(false);
    }
  }, [isComplete]);

  const openWizard = () => {
    setStep(0);
    setIsExpanded(true);
  };

  const closeWizard = () => {
    setStep(0);
    setIsExpanded(false);
  };
  
  // Effective profile: prefer currentProfile from DB, fallback to storedProfile from localStorage
  const effectiveProfile = currentProfile ?? storedProfile;

  // Form state (initialize from effective profile to avoid flicker when navigating away/back)
  const [weight, setWeight] = useState<string>(effectiveProfile?.weight_kg != null ? String(effectiveProfile.weight_kg) : "");
  const [targetWeight, setTargetWeight] = useState<string>(
    effectiveProfile?.target_weight_kg != null ? String(effectiveProfile.target_weight_kg) : "",
  );
  const [height, setHeight] = useState<string>(effectiveProfile?.height_cm != null ? String(effectiveProfile.height_cm) : "");
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(effectiveProfile?.goal ?? "stay_active");
  const [targetWeeks, setTargetWeeks] = useState<number>(effectiveProfile?.target_weeks ?? 12);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(effectiveProfile?.weekly_workout_target ?? 3);
  
  // Track the profile ID we've synced from to avoid repeated overwrites
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);

  // Sync from current profile ONLY when it arrives (and is different from what we synced before)
  useEffect(() => {
    if (!currentProfile) return;
    
    // Create a simple fingerprint to detect if profile actually changed
    const profileFingerprint = `${currentProfile.goal}-${currentProfile.weight_kg}-${currentProfile.target_weight_kg}-${currentProfile.target_weeks}-${currentProfile.weekly_workout_target}`;
    
    if (syncedProfileId === profileFingerprint) return;
    
    setWeight(currentProfile.weight_kg?.toString() || '');
    setTargetWeight(currentProfile.target_weight_kg?.toString() || '');
    setHeight(currentProfile.height_cm?.toString() || '');
    setSelectedGoal(currentProfile.goal);
    setTargetWeeks(currentProfile.target_weeks || 12);
    setWeeklyTarget(currentProfile.weekly_workout_target || 3);
    setSyncedProfileId(profileFingerprint);

    writeStoredHealthProfile({
      weight_kg: currentProfile.weight_kg,
      target_weight_kg: currentProfile.target_weight_kg,
      height_cm: currentProfile.height_cm,
      goal: currentProfile.goal,
      target_weeks: currentProfile.target_weeks || 12,
      weekly_workout_target: currentProfile.weekly_workout_target || 3,
    });
  }, [currentProfile, syncedProfileId]);

  const handleSave = async () => {
    const profile: HealthProfile = {
      weight_kg: weight ? parseFloat(weight) : null,
      target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
      height_cm: height ? parseFloat(height) : null,
      goal: selectedGoal,
      target_weeks: targetWeeks,
      weekly_workout_target: weeklyTarget,
    };

    const success = await onSave(profile);
    if (success) {
      writeStoredHealthProfile(profile);
      setIsExpanded(false);
    }
  };

  const totalSteps = 3;

  const canProceed = () => {
    switch (step) {
      case 0: return selectedGoal !== null;
      case 1: return true;
      case 2: return true;
      default: return true;
    }
  };

  const selectedGoalOption = GOAL_OPTIONS.find(g => g.value === selectedGoal);

  // Collapsed summary view (always visible when closed)
  if (!isExpanded) {
    const goalOption = GOAL_OPTIONS.find(g => g.value === selectedGoal);
    const weightDiff = weight && targetWeight ? Math.abs(parseFloat(targetWeight) - parseFloat(weight)) : null;
    const progressPercent = weight && targetWeight && weightDiff 
      ? Math.min(100, Math.round(((parseFloat(weight) - parseFloat(targetWeight)) / (parseFloat(weight) - parseFloat(targetWeight) + weightDiff)) * 100))
      : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden border shadow-lg bg-card">
          {/* Glowing accent */}
          <motion.div 
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
            style={{ background: `linear-gradient(135deg, hsl(var(--primary)) 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <CardContent className="relative py-5 px-5">
            {/* Top row with goal info and edit button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Goal icon with animated ring */}
                <div className="relative">
                  <motion.div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg",
                      goalOption?.gradient || 'from-primary to-primary/80'
                    )}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {goalOption?.icon}
                  </motion.div>
                  {isComplete && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
                
                {/* Goal details */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    {language === 'es' ? 'Tu objetivo' : 'Your goal'}
                  </p>
                  <h3 className="font-bold text-lg text-foreground">
                    {isComplete 
                      ? (language === 'es' ? goalOption?.labelEs : goalOption?.labelEn)
                      : (language === 'es' ? 'Sin configurar' : 'Not configured')}
                  </h3>
                </div>
              </div>
              
              {/* Edit button - tech style */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 border border-primary/30"
                onClick={openWizard}
              >
                {isComplete
                  ? (language === 'es' ? 'Editar' : 'Edit')
                  : (language === 'es' ? 'Configurar' : 'Set up')}
              </Button>
            </div>
            
            {/* Metrics row */}
            {isComplete && (
              <motion.div 
                className="mt-5 grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Current weight */}
                {weight && (
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      {language === 'es' ? 'Actual' : 'Current'}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {weight}<span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                    </p>
                  </div>
                )}
                
                {/* Target weight */}
                {targetWeight && selectedGoal !== 'stay_active' && (
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      {language === 'es' ? 'Meta' : 'Target'}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {targetWeight}<span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                    </p>
                  </div>
                )}
                
                {/* Weekly target */}
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Frecuencia' : 'Frequency'}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {weeklyTarget}<span className="text-xs font-normal text-muted-foreground ml-0.5">x/{language === 'es' ? 'sem' : 'wk'}</span>
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Tips row - tech chips style */}
            <motion.div 
              className="mt-4 flex items-center gap-2 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs font-medium border border-primary/20">
                <ChefHat className="w-3.5 h-3.5" />
                <span>
                  {isComplete
                    ? (language === 'es' ? goalOption?.cookingTipEs : goalOption?.cookingTipEn)
                    : (language === 'es' ? 'Recetas personalizadas' : 'Custom recipes')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1.5 text-xs font-medium border border-emerald-500/20">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>
                  {isComplete
                    ? (language === 'es' ? goalOption?.activityTipEs : goalOption?.activityTipEn)
                    : (language === 'es' ? 'Tu seguimiento' : 'Your tracking')}
                </span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg bg-card">
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-sky-400 px-4 py-4">
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-primary-foreground">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                {language === 'es' ? 'Tu plan personalizado' : 'Your personalized plan'}
              </h3>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeWizard}
              disabled={isSaving}
              className="text-primary-foreground/90 hover:text-primary-foreground"
              aria-label={language === 'es' ? 'Cerrar' : 'Close'}
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* Compact Step Indicators */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((s) => (
                <motion.div
                  key={s}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all duration-300",
                    step === s 
                      ? "bg-primary-foreground text-primary shadow-md" 
                      : step > s 
                        ? "bg-primary-foreground/30 text-primary-foreground"
                        : "bg-primary-foreground/20 text-primary-foreground/60"
                  )}
                  animate={step === s ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {step > s ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{s + 1}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <CardContent className="pt-5 pb-6 px-5">
          <AnimatePresence mode="wait">
            {/* Step 0: Goal Selection */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-semibold text-foreground">
                    {language === 'es' ? '¿Cuál es tu objetivo?' : 'What is your goal?'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map((option, index) => (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedGoal(option.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                        selectedGoal === option.value
                          ? `${option.bgColor} border-2`
                          : "border-border/50 hover:border-muted-foreground/30 bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md",
                        option.gradient
                      )}>
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium text-foreground text-center">
                        {language === 'es' ? option.labelEs : option.labelEn}
                      </span>
                      
                      {selectedGoal === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                
                {selectedGoal && selectedGoalOption && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50"
                  >
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-primary" />
                      {language === 'es' ? selectedGoalOption.cookingTipEs : selectedGoalOption.cookingTipEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                      {language === 'es' ? selectedGoalOption.activityTipEs : selectedGoalOption.activityTipEn}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 1: Weight & Height */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h4 className="text-base font-semibold text-foreground">
                    {language === 'es' ? 'Tus medidas' : 'Your measurements'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'es' 
                      ? 'Para calcular tu progreso correctamente' 
                      : 'To calculate your progress correctly'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      {language === 'es' ? 'Peso actual' : 'Current weight'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="70"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        min={30}
                        max={300}
                        step={0.1}
                        className="pr-10 h-12 text-lg font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                    </div>
                  </div>
                  
                  {(selectedGoal === 'lose_fat' || selectedGoal === 'gain_muscle') && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Peso objetivo' : 'Target weight'}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={selectedGoal === 'lose_fat' ? '65' : '75'}
                          value={targetWeight}
                          onChange={(e) => setTargetWeight(e.target.value)}
                          min={30}
                          max={300}
                          step={0.1}
                          className="pr-10 h-12 text-lg font-medium"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                      </div>
                    </div>
                  )}
                  
                  {(selectedGoal === 'stay_active' || selectedGoal === 'improve_performance') && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Altura' : 'Height'}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="170"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          min={100}
                          max={250}
                          step={1}
                          className="pr-10 h-12 text-lg font-medium"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
                      </div>
                    </div>
                  )}
                </div>

                {(selectedGoal === 'lose_fat' || selectedGoal === 'gain_muscle') && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      {language === 'es' ? 'Altura (opcional)' : 'Height (optional)'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="170"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        min={100}
                        max={250}
                        step={1}
                        className="pr-10 h-11"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
                    </div>
                  </div>
                )}

                {/* Preview of how it affects things */}
                {weight && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-xl p-4"
                  >
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {language === 'es' ? 'Cómo te ayuda:' : 'How this helps:'}
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-primary shrink-0" />
                        {language === 'es' 
                          ? 'Verás las calorías vs tu objetivo' 
                          : 'See calories vs your goal'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Flame className="w-3 h-3 text-primary shrink-0" />
                        {language === 'es' 
                          ? 'Calculamos calorías quemadas precisas' 
                          : 'Precise calorie burn calculations'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Timeframe & Frequency */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h4 className="text-base font-semibold text-foreground">
                    {language === 'es' ? 'Tu plan' : 'Your plan'}
                  </h4>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {language === 'es' ? '¿En cuánto tiempo?' : 'How long?'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_OPTIONS.map((option) => (
                      <Button
                        key={option.weeks}
                        variant="outline"
                        size="sm"
                        onClick={() => setTargetWeeks(option.weeks)}
                        className={cn(
                          "h-11 rounded-xl transition-all",
                          targetWeeks === option.weeks 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "hover:bg-muted"
                        )}
                      >
                        {language === 'es' ? option.labelEs : option.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" />
                    {language === 'es' ? 'Entrenamientos por semana' : 'Workouts per week'}
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setWeeklyTarget(option.value)}
                        className={cn(
                          "h-11 rounded-xl transition-all",
                          weeklyTarget === option.value 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "hover:bg-muted"
                        )}
                      >
                        {language === 'es' ? option.labelEs : option.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Summary of what happens next */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-4 border border-primary/20"
                >
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-3">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    {language === 'es' ? '¡Todo listo!' : 'All set!'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <ChefHat className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {language === 'es' 
                          ? `Recetas para "${selectedGoalOption?.labelEs}"` 
                          : `Recipes for "${selectedGoalOption?.labelEn}"`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Dumbbell className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {language === 'es' 
                          ? `Meta: ${weeklyTarget} entrenamientos/semana` 
                          : `Goal: ${weeklyTarget} workouts/week`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {language === 'es' 
                          ? `Seguimiento por ${targetWeeks} semanas` 
                          : `Tracking for ${targetWeeks} weeks`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step > 0 ? setStep(step - 1) : closeWizard()}
              disabled={isSaving}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 0 
                ? (language === 'es' ? 'Cerrar' : 'Close')
                : (language === 'es' ? 'Atrás' : 'Back')
              }
            </Button>
            
            {step < totalSteps - 1 ? (
              <Button
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6"
              >
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'es' ? 'Guardando...' : 'Saving...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {language === 'es' ? 'Empezar' : 'Start'}
                  </span>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
