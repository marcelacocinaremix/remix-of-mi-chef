import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ChefHat, Check, X, Clock, Users, Sparkles, Flame, Heart, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/components/RecipeList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CookingTimer, extractTimeFromStep } from "@/components/CookingTimer";
import { useSound } from "@/hooks/useSound";
import marcelaImage from "@/assets/marcela-character.png";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onMarkAsCooked?: () => void;
}

// Marcela messages for different events
const marcelaMessages = {
  start: [
    "¡Vamos a cocinar algo delicioso! 👩‍🍳",
    "¡Qué emoción! Esta receta te va a encantar ✨",
    "¡Manos a la obra! Yo te guío paso a paso 💪",
  ],
  timer: {
    start: [
      "¡Perfecto! Te aviso cuando esté listo 👩‍🍳",
      "¡Timer activado! Mientras podés preparar lo siguiente 🕐",
      "¡Listo! Yo controlo el tiempo por vos ⏱️",
      "¡En marcha! Relajate que te aviso 😊",
    ],
    end: [
      "¡Tiempo! Ya podés continuar 🔔",
      "¡Listo el pollo! Seguimos con el próximo paso 🎉",
      "¡Se cumplió el tiempo! Adelante 👩‍🍳",
      "¡Ya está! Vamos al siguiente paso ✨",
    ],
  },
  encouragement: [
    "¡Vas muy bien! 💪",
    "¡Excelente técnica! ✨",
    "¡Eso es! Seguí así 🌟",
    "¡Qué rico va quedando! 😋",
    "¡Sos un/a crack en la cocina! 👏",
  ],
  finish: [
    "¡FELICITACIONES! 🎉 ¡Lo lograste!",
    "¡Bravo! ¡Quedó espectacular! 👏",
    "¡Sos un/a chef increíble! 🌟",
  ],
};

const getRandomMessage = (messages: string[]) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

export function CookingMode({ recipe, onClose, onMarkAsCooked }: CookingModeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { play } = useSound();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [marcelaMessage, setMarcelaMessage] = useState<string | null>(null);
  const [showMarcela, setShowMarcela] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const totalSteps = recipe.steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Check if current step has a timer
  const currentStepText = recipe.steps[currentStep];
  const stepMinutes = extractTimeFromStep(currentStepText);

  // Show welcome message on mount
  useEffect(() => {
    setMarcelaMessage(getRandomMessage(marcelaMessages.start));
    if (soundEnabled) play('magic');
    const timer = setTimeout(() => setMarcelaMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Encouragement messages every few steps
  useEffect(() => {
    if (currentStep > 0 && currentStep % 3 === 0 && !marcelaMessage) {
      setMarcelaMessage(getRandomMessage(marcelaMessages.encouragement));
      if (soundEnabled) play('chime');
      const timer = setTimeout(() => setMarcelaMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handlePrevious = () => {
    if (!isFirstStep) {
      setIsTransitioning(true);
      if (soundEnabled) play('whoosh');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setMarcelaMessage(null);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setIsTransitioning(true);
      if (soundEnabled) play('pop');
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setMarcelaMessage(null);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleTimerStart = () => {
    setMarcelaMessage(getRandomMessage(marcelaMessages.timer.start));
    if (soundEnabled) play('notification');
    setTimeout(() => setMarcelaMessage(null), 4000);
  };

  const handleTimerEnd = () => {
    setMarcelaMessage(getRandomMessage(marcelaMessages.timer.end));
    if (soundEnabled) play('ding');
  };

  const handleMarkAsCooked = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar en tu historial.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setShowConfetti(true);
    setMarcelaMessage(getRandomMessage(marcelaMessages.finish));
    if (soundEnabled) play('success');

    try {
      const { error } = await supabase.from("cooked_recipes").insert({
        user_id: user.id,
        recipe_name: recipe.name,
        recipe_data: JSON.parse(JSON.stringify(recipe)),
      });

      if (error) throw error;

      toast({
        title: "¡Receta completada!",
        description: `${recipe.name} se agregó a tu historial.`,
      });

      setTimeout(() => {
        onMarkAsCooked?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error saving cooked recipe:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar en el historial.",
        variant: "destructive",
      });
      setShowConfetti(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic gradient based on progress
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const gradientColor = progressPercentage < 33 
    ? 'from-orange-500 to-amber-500' 
    : progressPercentage < 66 
      ? 'from-amber-500 to-yellow-500' 
      : 'from-green-500 to-emerald-500';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Solid background with decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50 dark:from-background dark:via-background dark:to-secondary/10 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-200/30 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-200/30 dark:bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating cooking elements */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce opacity-30"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + i * 0.5}s`,
            }}
          >
            {['🥄', '🍳', '🥗', '🧂', '🌿', '🍅'][i]}
          </div>
        ))}
      </div>

      {/* Confetti celebration */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className={cn(
        "flex items-center justify-between p-4 border-b border-border/50 relative z-10",
        "bg-card/95 backdrop-blur-sm"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <X className="w-6 h-6" />
        </Button>
        <div className="text-center">
          <h2 className="font-display font-bold text-lg truncate max-w-[200px] sm:max-w-none flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            {recipe.name}
          </h2>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.time} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings} porciones
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="hover:bg-primary/10"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowMarcela(!showMarcela)}
            className="hover:bg-primary/10"
          >
            <Heart className={cn("w-5 h-5 transition-all", showMarcela ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
          </Button>
        </div>
      </div>

      {/* Progress section */}
      <div className="px-4 py-3 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">Paso {currentStep + 1} de {totalSteps}</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary" />
            {Math.round(progressPercentage)}% completado
          </span>
        </div>
        
        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-2">
          {recipe.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true);
                if (soundEnabled) play('pop');
                setTimeout(() => {
                  setCurrentStep(index);
                  setIsTransitioning(false);
                }, 200);
              }}
              className={cn(
                "flex-1 h-2 rounded-full transition-all duration-300",
                index < currentStep 
                  ? "bg-green-500" 
                  : index === currentStep 
                    ? `bg-gradient-to-r ${gradientColor} shadow-lg` 
                    : "bg-border hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative z-10">
        <div className={cn(
          "max-w-2xl w-full text-center space-y-6 transition-all duration-300",
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}>
          {/* Step number with animation */}
          <div className="relative">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-full",
              `bg-gradient-to-br ${gradientColor}`,
              "flex items-center justify-center shadow-xl",
              "animate-pulse"
            )} style={{ animationDuration: '3s' }}>
              <span className="text-5xl font-display font-bold text-white drop-shadow-lg">
                {currentStep + 1}
              </span>
            </div>
            {/* Decorative ring */}
            <div className={cn(
              "absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-dashed",
              "border-primary/30 animate-spin"
            )} style={{ animationDuration: '10s' }} />
          </div>
          
          {/* Step text with gradient highlight */}
          <div className="relative">
            <p className={cn(
              "text-xl md:text-2xl lg:text-3xl font-medium text-foreground leading-relaxed",
              "bg-gradient-to-r from-foreground via-foreground/90 to-foreground",
              "bg-clip-text"
            )}>
              {currentStepText}
            </p>
          </div>

          {/* Timer for steps with time */}
          {stepMinutes && (
            <div className="flex justify-center pt-2">
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
                <CookingTimer 
                  minutes={stepMinutes} 
                  stepText={currentStepText}
                  onTimerStart={handleTimerStart}
                  onTimerEnd={handleTimerEnd}
                />
              </div>
            </div>
          )}

          {/* Last step celebration */}
          {isLastStep && (
            <div className="pt-4 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full",
                "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
                "shadow-lg shadow-green-500/30"
              )}>
                <ChefHat className="w-6 h-6" />
                <span className="font-bold text-lg">¡Último paso!</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marcela assistant */}
      {showMarcela && (
        <div className={cn(
          "fixed bottom-36 right-4 z-50 flex items-end gap-2",
          "transition-all duration-500",
          marcelaMessage ? "animate-scale-in" : "opacity-80 hover:opacity-100"
        )}>
          {marcelaMessage && (
            <div className={cn(
              "bg-gradient-to-br from-card to-secondary/50 border border-primary/20",
              "rounded-2xl shadow-xl p-4 max-w-[220px]",
              "animate-fade-in"
            )}>
              <p className="text-sm font-medium text-foreground">{marcelaMessage}</p>
              <div className="absolute -bottom-2 right-16 w-4 h-4 bg-card border-r border-b border-primary/20 transform rotate-45" />
            </div>
          )}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
            <img 
              src={marcelaImage} 
              alt="Marcela" 
              className={cn(
                "w-20 h-24 object-contain transition-transform cursor-pointer",
                "hover:scale-110 active:scale-95",
                marcelaMessage && "animate-bounce"
              )}
              style={{ animationDuration: '1s' }}
              onClick={() => {
                if (!marcelaMessage) {
                  if (soundEnabled) play('chime');
                  setMarcelaMessage(getRandomMessage(marcelaMessages.encouragement));
                  setTimeout(() => setMarcelaMessage(null), 3000);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={cn(
        "p-4 border-t border-border/50 relative z-10",
        "bg-card/95 backdrop-blur-sm"
      )}>
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={cn(
              "flex-1 border-2 transition-all",
              !isFirstStep && "hover:border-primary hover:bg-primary/5"
            )}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button
              size="lg"
              onClick={handleMarkAsCooked}
              disabled={isSaving}
              className={cn(
                "flex-1 transition-all",
                "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
                "shadow-lg shadow-green-500/30 hover:shadow-green-500/50",
                "text-white font-bold"
              )}
            >
              <Check className="w-5 h-5 mr-2" />
              {isSaving ? "Guardando..." : "¡Terminé!"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleNext}
              className={cn(
                "flex-1 transition-all",
                `bg-gradient-to-r ${gradientColor}`,
                "shadow-lg hover:shadow-xl",
                "text-white font-bold"
              )}
            >
              Siguiente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Custom keyframes for confetti */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
