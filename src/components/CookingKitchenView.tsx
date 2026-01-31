import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  ChefHat,
  Check,
  X,
  Timer,
  Lightbulb,
  HelpCircle
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import marcelaCharacter from "@/assets/marcela-character.png";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  action: string;
}

interface Step {
  instruction: string;
  action: string;
  ingredient: string;
  marcelaMsg: string;
  timeHint?: number;
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  time: number;
  difficulty: string;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  originalRecipe?: unknown;
}

interface CookingKitchenViewProps {
  recipe: Recipe;
  currentStep: number;
  completedSteps: number[];
  soundEnabled: boolean;
  onStepComplete: (stepIndex: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onToggleSound: () => void;
  onBack: () => void;
}

// Utensilios según la acción
const actionUtensils: Record<string, { utensil: string; utensilEmoji: string; verb: string }> = {
  cortar: { utensil: "tabla de cortar", utensilEmoji: "🔪", verb: "Sobre la tabla de cortar, cortá" },
  batir: { utensil: "bowl", utensilEmoji: "🥣", verb: "En el bowl, batí" },
  mezclar: { utensil: "bowl grande", utensilEmoji: "🥣", verb: "En el bowl grande, mezclá" },
  hervir: { utensil: "olla", utensilEmoji: "🍲", verb: "En la olla con agua, herví" },
  freir: { utensil: "sartén", utensilEmoji: "🍳", verb: "En la sartén caliente, freí" },
  hornear: { utensil: "horno", utensilEmoji: "🔥", verb: "En el horno precalentado, horneá" },
  saltear: { utensil: "sartén", utensilEmoji: "🥘", verb: "En la sartén, salteá" },
  empanar: { utensil: "plato hondo", utensilEmoji: "🍽️", verb: "En el plato con pan rallado, empaná" },
  condimentar: { utensil: "recipiente", utensilEmoji: "🧂", verb: "En el recipiente, condimentá con" },
  rellenar: { utensil: "mesada", utensilEmoji: "🫓", verb: "Sobre la mesada, rellená" },
  calentar: { utensil: "olla", utensilEmoji: "♨️", verb: "En la olla a fuego bajo, calentá" },
  caramelizar: { utensil: "sartén", utensilEmoji: "🍬", verb: "En la sartén, caramelizá" },
  agregar: { utensil: "preparación", utensilEmoji: "➕", verb: "A la preparación, agregá" },
  decorar: { utensil: "plato", utensilEmoji: "✨", verb: "En el plato, decorá con" },
};

// Tips educativos por acción
const educationalTips: Record<string, string[]> = {
  cortar: [
    "💡 Tip: Usá un cuchillo afilado para cortes más limpios",
    "💡 Tip: Curvá los dedos hacia adentro para protegerlos",
    "💡 Tip: Cortá sobre tabla, nunca sobre el mármol",
  ],
  batir: [
    "💡 Tip: Batí siempre en la misma dirección para mejor textura",
    "💡 Tip: Los huevos a temperatura ambiente incorporan más aire",
    "💡 Tip: Movimientos amplios para incorporar aire",
  ],
  hervir: [
    "💡 Tip: Agregá sal cuando el agua rompa el hervor",
    "💡 Tip: No tapes la olla si querés que hierva más rápido",
    "💡 Tip: Fuego fuerte para hervir, medio para mantener",
  ],
  freir: [
    "💡 Tip: El aceite está listo cuando tirás una miga y burbujea",
    "💡 Tip: No sobrecargues la sartén, freí en tandas",
    "💡 Tip: Escurrí sobre papel absorbente",
  ],
  mezclar: [
    "💡 Tip: Movimientos envolventes para no perder aire",
    "💡 Tip: Incorporá los secos de a poco a los húmedos",
    "💡 Tip: No mezcles de más, lo justo y necesario",
  ],
  saltear: [
    "💡 Tip: Sartén bien caliente antes de agregar",
    "💡 Tip: Mové constantemente para cocción pareja",
    "💡 Tip: Cortá todo del mismo tamaño para cocción uniforme",
  ],
  hornear: [
    "💡 Tip: Siempre precalentá el horno 15 minutos antes",
    "💡 Tip: No abras la puerta los primeros 20 minutos",
    "💡 Tip: Usá la parte media del horno para cocción pareja",
  ],
  condimentar: [
    "💡 Tip: Menos es más, siempre podés agregar después",
    "💡 Tip: Probá antes de servir y ajustá",
    "💡 Tip: La sal resalta los sabores naturales",
  ],
  empanar: [
    "💡 Tip: Secá bien la carne antes de empanar",
    "💡 Tip: Pasá por harina, huevo y pan en ese orden",
    "💡 Tip: Presioná bien el pan rallado para que adhiera",
  ],
  caramelizar: [
    "💡 Tip: No revuelvas, solo girá la sartén",
    "💡 Tip: Retirá del fuego apenas toma color ámbar",
    "💡 Tip: Cuidado, el caramelo sigue cocinando fuera del fuego",
  ],
  agregar: [
    "💡 Tip: Agregá de a poco e integrá bien",
    "💡 Tip: Los líquidos fríos a preparaciones calientes, despacio",
  ],
  rellenar: [
    "💡 Tip: No pongas demasiado relleno o no cierra",
    "💡 Tip: Dejá un borde para sellar bien",
  ],
  decorar: [
    "💡 Tip: La presentación es parte del plato",
    "💡 Tip: Menos es más en decoración",
  ],
  calentar: [
    "💡 Tip: Fuego bajo para calentar sin quemar",
    "💡 Tip: Revolvé ocasionalmente para distribución pareja",
  ],
};

// Action animations config
const actionAnimations: Record<string, { icon: string; color: string; animation: string }> = {
  cortar: { icon: "🔪", color: "from-red-500/20 to-orange-500/20", animation: "animate-pulse" },
  batir: { icon: "🥄", color: "from-yellow-500/20 to-amber-500/20", animation: "animate-spin-slow" },
  mezclar: { icon: "🥣", color: "from-blue-500/20 to-cyan-500/20", animation: "animate-wiggle" },
  hervir: { icon: "🫧", color: "from-cyan-500/20 to-blue-500/20", animation: "animate-bubble" },
  freir: { icon: "🍳", color: "from-orange-500/20 to-red-500/20", animation: "animate-sizzle" },
  hornear: { icon: "🔥", color: "from-red-500/20 to-orange-500/20", animation: "animate-pulse" },
  saltear: { icon: "🥘", color: "from-amber-500/20 to-orange-500/20", animation: "animate-jump" },
  empanar: { icon: "🍞", color: "from-amber-500/20 to-yellow-500/20", animation: "animate-shake" },
  condimentar: { icon: "🧂", color: "from-gray-500/20 to-slate-500/20", animation: "animate-sprinkle" },
  rellenar: { icon: "🫓", color: "from-amber-500/20 to-orange-500/20", animation: "animate-fold" },
  calentar: { icon: "♨️", color: "from-red-500/20 to-pink-500/20", animation: "animate-pulse" },
  caramelizar: { icon: "🍬", color: "from-amber-500/20 to-yellow-500/20", animation: "animate-melt" },
  agregar: { icon: "➕", color: "from-green-500/20 to-emerald-500/20", animation: "animate-drop" },
  decorar: { icon: "✨", color: "from-purple-500/20 to-pink-500/20", animation: "animate-sparkle" },
};

export function CookingKitchenView({
  recipe,
  currentStep,
  completedSteps,
  soundEnabled,
  onStepComplete,
  onNextStep,
  onPrevStep,
  onToggleSound,
  onBack,
}: CookingKitchenViewProps) {
  const { play } = useSound();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentTip, setCurrentTip] = useState("");
  const [marcelaState, setMarcelaState] = useState<"idle" | "talking" | "happy" | "encouraging">("idle");
  const [marcelaMessage, setMarcelaMessage] = useState("");
  const [shakeIngredient, setShakeIngredient] = useState<string | null>(null);
  const [shuffledIngredients, setShuffledIngredients] = useState<Ingredient[]>([]);

  const step = recipe.steps[currentStep];
  const actionConfig = actionAnimations[step.action] || actionAnimations.agregar;
  const utensilConfig = actionUtensils[step.action] || actionUtensils.agregar;
  const currentIngredient = recipe.ingredients.find(i => i.id === step.ingredient);
  const progress = ((completedSteps.length) / recipe.steps.length) * 100;

  // Shuffle ingredients once when step changes
  useEffect(() => {
    const shuffled = [...recipe.ingredients].sort(() => Math.random() - 0.5);
    setShuffledIngredients(shuffled);
  }, [currentStep, recipe.ingredients]);

  // Get educational tip for current action
  const getRandomTip = useCallback(() => {
    const tips = educationalTips[step.action] || educationalTips.agregar;
    return tips[Math.floor(Math.random() * tips.length)];
  }, [step.action]);

  // Build the instruction with utensil context
  const buildInstruction = useCallback(() => {
    const isCompleted = completedSteps.includes(currentStep);
    const ingredientName = currentIngredient?.name || "el ingrediente";
    
    if (isCompleted) {
      return {
        prefix: `${utensilConfig.utensilEmoji} ${utensilConfig.verb}`,
        blank: ingredientName,
        filled: true
      };
    }
    
    return {
      prefix: `${utensilConfig.utensilEmoji} ${utensilConfig.verb}`,
      blank: "______",
      filled: false
    };
  }, [utensilConfig, currentIngredient, completedSteps, currentStep]);

  // Reset state when step changes
  useEffect(() => {
    setWrongAttempts(0);
    setShowHint(false);
    setShowError(false);
    setMarcelaState("talking");
    setMarcelaMessage("¿Qué ingrediente necesitamos ahora? 🤔");
    setCurrentTip(getRandomTip());
    
    const timer = setTimeout(() => setMarcelaState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [currentStep, getRandomTip]);

  const handleIngredientInteraction = useCallback((ingredientId: string) => {
    if (isAnimating || completedSteps.includes(currentStep)) return;
    
    // Wrong ingredient selected
    if (ingredientId !== step.ingredient) {
      setWrongAttempts(prev => prev + 1);
      setShowError(true);
      setShakeIngredient(ingredientId);
      setMarcelaState("encouraging");
      
      if (soundEnabled) play('pop');
      
      // Different messages based on attempts
      if (wrongAttempts === 0) {
        setMarcelaMessage("¡Mmm, no es ese! Pensá en la receta... 🤔");
      } else if (wrongAttempts === 1) {
        setMarcelaMessage("¡Casi! Leé bien la instrucción 📖");
        setShowHint(true); // Show hint after 2 wrong attempts
      } else {
        setMarcelaMessage(`Pista: empieza con "${currentIngredient?.name.charAt(0).toUpperCase()}" 💡`);
      }
      
      setTimeout(() => {
        setShowError(false);
        setShakeIngredient(null);
        setMarcelaState("idle");
      }, 1500);
      
      return;
    }

    // Correct ingredient!
    setIsAnimating(true);
    if (soundEnabled) play('chime');
    setMarcelaState("happy");
    setMarcelaMessage(step.marcelaMsg || "¡Perfecto! 🎉");

    // Show cooking animation
    setTimeout(() => {
      setShowSuccess(true);
      if (soundEnabled) play('success');
    }, 800);

    setTimeout(() => {
      setShowSuccess(false);
      setIsAnimating(false);
      onStepComplete(currentStep);
      
      // Show tip before advancing
      setMarcelaMessage(currentTip);
      setMarcelaState("talking");
      
      // Auto advance to next step after showing tip
      if (currentStep < recipe.steps.length - 1) {
        setTimeout(() => {
          onNextStep();
        }, 2000);
      }
    }, 1500);
  }, [currentStep, step, isAnimating, completedSteps, soundEnabled, play, onStepComplete, onNextStep, recipe.steps.length, wrongAttempts, currentIngredient, currentTip]);

  // Touch/click handler
  const handleIngredientClick = (ingredientId: string) => {
    handleIngredientInteraction(ingredientId);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, ingredientId: string) => {
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, ingredientId: string) => {
    e.preventDefault();
    handleIngredientInteraction(ingredientId);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            <Timer className="w-3 h-3 mr-1" />
            {recipe.time} min
          </Badge>
          <Button variant="ghost" size="sm" onClick={onToggleSound}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Recipe name */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
          <span className="text-2xl">{recipe.emoji}</span>
          <span>{recipe.name}</span>
        </h2>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paso {currentStep + 1} de {recipe.steps.length}</span>
          <span className="text-primary font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Kitchen view */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardContent className="p-0">
          {/* Cooking area - top view */}
          <div 
            className={cn(
              "relative min-h-[280px] bg-gradient-to-br",
              actionConfig.color,
              showError && "bg-gradient-to-br from-red-500/20 to-orange-500/20",
              "transition-all duration-500"
            )}
          >
            {/* Countertop pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }} />
            </div>

            {/* Center cooking area - the utensil */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className={cn(
                  "relative w-36 h-36 rounded-full bg-gradient-to-br from-gray-700 to-gray-900",
                  "shadow-2xl flex items-center justify-center flex-col gap-1",
                  "border-4 border-gray-600",
                  isAnimating && "ring-4 ring-primary ring-offset-2 ring-offset-background",
                  showError && "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-shake"
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  // Get the dropped ingredient from data transfer if available
                }}
              >
                {/* Inner surface */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-800" />
                
                {/* Utensil/action icon or cooking animation */}
                <div className={cn(
                  "text-4xl z-10",
                  isAnimating && actionConfig.animation
                )}>
                  {isAnimating ? (
                    showSuccess ? "✅" : actionConfig.icon
                  ) : showError ? (
                    "❌"
                  ) : (
                    utensilConfig.utensilEmoji
                  )}
                </div>
                
                {/* Utensil label */}
                {!isAnimating && !showError && (
                  <span className="text-[10px] text-white/70 z-10 font-medium">
                    {utensilConfig.utensil}
                  </span>
                )}

                {/* Success overlay */}
                {showSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-full animate-scale-in">
                    <Check className="w-12 h-12 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Floating cooking elements */}
            {isAnimating && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-float-up"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      bottom: "30%",
                      animationDelay: `${i * 0.1}s`,
                      fontSize: "20px",
                    }}
                  >
                    {["✨", "💫", "🔥", "♨️"][i % 4]}
                  </div>
                ))}
              </div>
            )}

            {/* Marcela in corner with speech bubble */}
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <div className={cn(
                "relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-300",
                marcelaState === "happy" && "border-green-500 scale-110",
                marcelaState === "talking" && "border-primary animate-pulse",
                marcelaState === "encouraging" && "border-amber-500",
                marcelaState === "idle" && "border-border"
              )}>
                <img 
                  src={marcelaCharacter} 
                  alt="Marcela" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Speech bubble */}
              <div className={cn(
                "mt-2 bg-card border border-border rounded-xl px-3 py-2 text-xs max-w-[160px] shadow-lg transition-all duration-300",
                marcelaState !== "idle" ? "opacity-100 translate-y-0" : "opacity-70"
              )}>
                <p className="text-foreground">{marcelaMessage}</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Paso {currentStep + 1}</span>
              </div>
            </div>

            {/* Wrong attempts indicator */}
            {wrongAttempts > 0 && !completedSteps.includes(currentStep) && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i < wrongAttempts ? "bg-red-500" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Instruction */}
          <div className="p-4 bg-card border-t border-border">
            {/* Main instruction with blank */}
            <div className="text-center mb-4">
              <p className="text-lg font-medium text-foreground mb-1">
                {buildInstruction().prefix}{" "}
                <span 
                  className={cn(
                    "inline-block min-w-[80px] border-b-2 transition-all duration-500",
                    buildInstruction().filled 
                      ? "border-primary text-primary font-handwriting italic animate-fade-in" 
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                  style={{
                    fontFamily: buildInstruction().filled ? "'Caveat', 'Segoe Script', cursive" : "inherit",
                    fontSize: buildInstruction().filled ? "1.3em" : "1em",
                  }}
                >
                  {buildInstruction().blank}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {step.instruction}
              </p>
            </div>

            {/* Hint section */}
            {showHint && !completedSteps.includes(currentStep) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Buscá el ingrediente que se relaciona con esta acción: <strong>{step.action}</strong>
                </p>
              </div>
            )}

            {/* Ingredients to choose - shuffled and no grayed out items */}
            <div className="flex flex-wrap justify-center gap-3">
              {shuffledIngredients.map((ingredient) => {
                const isCompleted = completedSteps.includes(currentStep) && ingredient.id === step.ingredient;
                const isShaking = shakeIngredient === ingredient.id;
                
                return (
                  <div
                    key={ingredient.id}
                    draggable={!completedSteps.includes(currentStep)}
                    onDragStart={(e) => handleDragStart(e, ingredient.id)}
                    onClick={() => handleIngredientClick(ingredient.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 cursor-pointer select-none",
                      // Only show green after correct selection
                      isCompleted && "bg-green-500/20 border-2 border-green-500",
                      // Shake on wrong selection
                      isShaking && "animate-shake bg-red-500/20 border-2 border-red-500",
                      // Normal state - all ingredients look the same
                      !isCompleted && !isShaking && "bg-muted/50 border-2 border-transparent hover:border-primary/30 hover:bg-primary/10 active:scale-95"
                    )}
                  >
                    <span className="text-2xl">{ingredient.emoji}</span>
                    <span className="text-xs font-medium text-center max-w-[60px] truncate">
                      {ingredient.name}
                    </span>
                    {isCompleted && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status message */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {completedSteps.includes(currentStep) 
                ? "✅ ¡Excelente! Aprendiste algo nuevo"
                : "🎯 ¿Cuál es el ingrediente correcto?"
              }
            </p>

            {/* Educational tip after completing step */}
            {completedSteps.includes(currentStep) && (
              <div className="mt-3 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{currentTip}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={onNextStep}
          disabled={currentStep === recipe.steps.length - 1 || !completedSteps.includes(currentStep)}
          className="flex-1"
        >
          Siguiente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 pt-2">
        {recipe.steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentStep && "w-6 bg-primary",
              index !== currentStep && completedSteps.includes(index) && "bg-green-500",
              index !== currentStep && !completedSteps.includes(index) && "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
