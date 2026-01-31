import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { FitnessGoal, ActivityProfile, UserFitnessGoal } from "@/hooks/useActivityTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Settings2, 
  Target, 
  Scale, 
  Ruler, 
  Calendar,
  Dumbbell,
  Flame,
  Heart,
  Trophy,
  Check
} from "lucide-react";

const GOAL_OPTIONS: { value: FitnessGoal; icon: React.ReactNode; labelEs: string; labelEn: string; descEs: string; descEn: string }[] = [
  { value: 'lose_fat', icon: <Flame className="w-5 h-5" />, labelEs: 'Bajar de peso', labelEn: 'Lose weight', descEs: 'Enfoque en cardio y déficit calórico', descEn: 'Focus on cardio and calorie deficit' },
  { value: 'stay_active', icon: <Heart className="w-5 h-5" />, labelEs: 'Mantener peso', labelEn: 'Maintain weight', descEs: 'Balance entre actividad y alimentación', descEn: 'Balance activity and nutrition' },
  { value: 'gain_muscle', icon: <Dumbbell className="w-5 h-5" />, labelEs: 'Ganar músculo', labelEn: 'Build muscle', descEs: 'Fuerza + proteínas + descanso', descEn: 'Strength + protein + rest' },
  { value: 'improve_performance', icon: <Trophy className="w-5 h-5" />, labelEs: 'Mejorar rendimiento', labelEn: 'Improve fitness', descEs: 'Entrenamiento progresivo e intenso', descEn: 'Progressive and intense training' },
];

const TIME_OPTIONS = [
  { weeks: 4, labelEs: '1 mes', labelEn: '1 month' },
  { weeks: 12, labelEs: '3 meses', labelEn: '3 months' },
  { weeks: 26, labelEs: '6 meses', labelEn: '6 months' },
];

const FREQUENCY_OPTIONS = [
  { value: 2, labelEs: '2 por semana', labelEn: '2 per week' },
  { value: 3, labelEs: '3 por semana', labelEn: '3 per week' },
  { value: 4, labelEs: '4+ por semana', labelEn: '4+ per week' },
];

interface ActivityProfileEditorProps {
  currentGoal: UserFitnessGoal | null;
  onSave: (profile: ActivityProfile) => Promise<boolean>;
  isSaving: boolean;
  children?: React.ReactNode;
}

export function ActivityProfileEditor({ currentGoal, onSave, isSaving, children }: ActivityProfileEditorProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>('stay_active');
  const [targetWeeks, setTargetWeeks] = useState<number>(12);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);

  // Initialize from current goal
  useEffect(() => {
    if (currentGoal) {
      setWeight(currentGoal.weight_kg?.toString() || '');
      setHeight(currentGoal.height_cm?.toString() || '');
      setSelectedGoal(currentGoal.goal);
      setTargetWeeks(currentGoal.target_weeks || 12);
      setWeeklyTarget(currentGoal.weekly_workout_target || 3);
    }
  }, [currentGoal, open]);

  const handleSave = async () => {
    const profile: ActivityProfile = {
      weight_kg: weight ? parseFloat(weight) : null,
      target_weight_kg: null,
      height_cm: height ? parseFloat(height) : null,
      goal: selectedGoal,
      target_weeks: targetWeeks,
      target_date: null,
      weekly_workout_target: weeklyTarget,
    };

    const success = await onSave(profile);
    if (success) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            {language === 'es' ? 'Mi perfil' : 'My profile'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white">
              <Target className="w-4 h-4" />
            </div>
            {language === 'es' ? 'Mi perfil de actividad' : 'My activity profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Body stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Scale className="w-4 h-4 text-muted-foreground" />
                {language === 'es' ? 'Peso (kg)' : 'Weight (kg)'}
              </Label>
              <Input
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min={30}
                max={300}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                {language === 'es' ? 'Altura (cm)' : 'Height (cm)'}
              </Label>
              <Input
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min={100}
                max={250}
                step={1}
              />
            </div>
          </div>

          {/* Goal selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {language === 'es' ? 'Tu objetivo' : 'Your goal'}
            </Label>
            <div className="grid gap-2">
              {GOAL_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedGoal(option.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all w-full",
                    selectedGoal === option.value
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-orange-300"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    selectedGoal === option.value
                      ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {language === 'es' ? option.labelEs : option.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' ? option.descEs : option.descEn}
                    </p>
                  </div>
                  {selectedGoal === option.value && (
                    <Check className="w-5 h-5 text-orange-500" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {language === 'es' ? 'Tiempo para el objetivo' : 'Time for goal'}
            </Label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option.weeks}
                  variant={targetWeeks === option.weeks ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetWeeks(option.weeks)}
                  className={cn(
                    "flex-1",
                    targetWeeks === option.weeks && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {language === 'es' ? option.labelEs : option.labelEn}
                </Button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              {language === 'es' ? 'Frecuencia objetivo' : 'Target frequency'}
            </Label>
            <RadioGroup
              value={weeklyTarget.toString()}
              onValueChange={(v) => setWeeklyTarget(parseInt(v))}
              className="flex gap-2"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    weeklyTarget === option.value
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-orange-300"
                  )}
                >
                  <RadioGroupItem value={option.value.toString()} className="sr-only" />
                  <span className="text-sm font-medium">
                    {language === 'es' ? option.labelEs : option.labelEn}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Save button */}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isSaving 
              ? (language === 'es' ? 'Guardando...' : 'Saving...') 
              : (language === 'es' ? 'Guardar perfil' : 'Save profile')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
