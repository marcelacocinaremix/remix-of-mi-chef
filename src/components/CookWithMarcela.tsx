import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSound } from "@/hooks/useSound";
import { useAuth } from "@/hooks/useAuth";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { useAchievements } from "@/hooks/useAchievements";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";
import { 
  ChefHat, 
  Sparkles, 
  Play, 
  Heart, 
  Clock, 
  ArrowLeft, 
  Trophy,
  Star,
  Volume2,
  VolumeX,
  Check,
  RotateCcw,
  Calendar,
  BookOpen,
  Timer,
  Lightbulb
} from "lucide-react";
import marcelaCharacter from "@/assets/marcela-character.png";
import gameBanner from "@/assets/game-banner.jpg";
import { CookingKitchenView } from "./CookingKitchenView";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";

// Helper to convert real recipe to interactive format
const convertToInteractiveRecipe = (recipe: Recipe, id: string) => {
  // Extract main ingredients and create interactive ingredients
  const ingredientActions = ["cortar", "mezclar", "agregar", "batir", "calentar", "freir", "hervir", "condimentar"];
  const ingredientEmojis: Record<string, string> = {
    // Carnes
    "carne": "🥩", "pollo": "🍗", "cerdo": "🥓", "pescado": "🐟", "atún": "🐟", "jamón": "🥓",
    // Verduras
    "tomate": "🍅", "cebolla": "🧅", "ajo": "🧄", "papa": "🥔", "zanahoria": "🥕", "lechuga": "🥬",
    "pimiento": "🫑", "calabaza": "🎃", "espinaca": "🥬", "brócoli": "🥦", "pepino": "🥒",
    // Frutas
    "limón": "🍋", "naranja": "🍊", "manzana": "🍎", "banana": "🍌",
    // Lácteos
    "huevo": "🥚", "leche": "🥛", "queso": "🧀", "manteca": "🧈", "crema": "🥛", "yogur": "🥛",
    // Granos
    "arroz": "🍚", "pasta": "🍝", "fideos": "🍝", "pan": "🍞", "harina": "🌾", "avena": "🌾",
    // Condimentos
    "sal": "🧂", "pimienta": "🧂", "aceite": "🫒", "azúcar": "🍬", "miel": "🍯",
    // Otros
    "agua": "💧", "vino": "🍷", "cerveza": "🍺", "café": "☕",
  };

  // Parse ingredients from recipe
  const ingredients = recipe.ingredients.slice(0, 6).map((ing, idx) => {
    const ingLower = ing.toLowerCase();
    let emoji = "🥄";
    let name = ing.split(",")[0].replace(/^\d+\s*\w*\s*/i, "").trim().substring(0, 20);
    
    // Find matching emoji
    for (const [key, value] of Object.entries(ingredientEmojis)) {
      if (ingLower.includes(key)) {
        emoji = value;
        break;
      }
    }
    
    return {
      id: `ing_${idx}`,
      name: name || ing.substring(0, 20),
      emoji,
      action: ingredientActions[idx % ingredientActions.length],
    };
  });

  // Create educational messages for Marcela
  const educationalTips = [
    "¡Bien! La técnica es clave 👨‍🍳",
    "¿Sabías? Cocinar a fuego lento concentra sabores 🔥",
    "Tip: Dejá descansar las carnes antes de cortar 🥩",
    "¡Perfecto! La paciencia es esencial en la cocina ⏰",
    "Recordá: sal al final para no secar 🧂",
    "¡Excelente! Probá siempre antes de servir 👅",
    "Tip: Los ingredientes a temperatura ambiente cocinan mejor 🌡️",
    "¡Muy bien! Cortá siempre con cuchillo afilado 🔪",
  ];

  // Convert steps to interactive format
  const steps = recipe.steps.map((step, idx) => {
    const ingredient = ingredients[idx % ingredients.length];
    return {
      instruction: step,
      action: ingredient.action,
      ingredient: ingredient.id,
      marcelaMsg: educationalTips[idx % educationalTips.length],
      timeHint: idx === Math.floor(recipe.steps.length / 2) ? Math.floor(recipe.time / recipe.steps.length) * 60 : undefined,
    };
  });

  return {
    id,
    name: recipe.name,
    emoji: "🍽️",
    time: recipe.time,
    difficulty: recipe.difficulty || "Fácil",
    servings: recipe.servings || 4,
    ingredients,
    steps,
    originalRecipe: recipe,
  };
};

// Demo recipes as fallback - with more educational content
const DEMO_RECIPES = [
  {
    id: "milanesa",
    name: "Milanesa con Puré",
    emoji: "🥩",
    time: 35,
    difficulty: "Fácil",
    servings: 4,
    ingredients: [
      { id: "carne", name: "Bife de nalga", emoji: "🥩", action: "cortar" },
      { id: "huevo", name: "Huevos", emoji: "🥚", action: "batir" },
      { id: "pan_rallado", name: "Pan rallado", emoji: "🍞", action: "empanar" },
      { id: "papa", name: "Papas", emoji: "🥔", action: "hervir" },
      { id: "manteca", name: "Manteca", emoji: "🧈", action: "mezclar" },
      { id: "aceite", name: "Aceite", emoji: "🫒", action: "freir" },
    ],
    steps: [
      { instruction: "Afiná los bifes golpeándolos con un martillo de cocina", action: "cortar", ingredient: "carne", marcelaMsg: "¡Así quedan tiernos y se cocinan parejo!" },
      { instruction: "Rompé los huevos en un plato hondo y batí con un tenedor", action: "batir", ingredient: "huevo", marcelaMsg: "Agregá una pizca de sal al huevo batido" },
      { instruction: "Pasá cada bife por huevo y luego por pan rallado presionando", action: "empanar", ingredient: "pan_rallado", marcelaMsg: "El pan debe cubrir toda la superficie" },
      { instruction: "Colocá las papas peladas en agua fría y llevá a hervor", action: "hervir", ingredient: "papa", marcelaMsg: "Arrancá con agua fría para cocción pareja", timeHint: 1200 },
      { instruction: "Pisá las papas calientes y agregá manteca en cubos", action: "mezclar", ingredient: "manteca", marcelaMsg: "La manteca fría hace que quede cremoso" },
      { instruction: "Calentá abundante aceite y sumergí las milanesas", action: "freir", ingredient: "aceite", marcelaMsg: "El aceite está listo cuando burbujea al tirar miga", timeHint: 180 },
    ],
    originalRecipe: null,
  },
  {
    id: "empanadas",
    name: "Empanadas de Carne",
    emoji: "🥟",
    time: 50,
    difficulty: "Media",
    servings: 12,
    ingredients: [
      { id: "carne", name: "Carne picada", emoji: "🥩", action: "saltear" },
      { id: "cebolla", name: "Cebolla", emoji: "🧅", action: "cortar" },
      { id: "morron", name: "Morrón", emoji: "🫑", action: "saltear" },
      { id: "tapa", name: "Tapas", emoji: "🫓", action: "rellenar" },
      { id: "huevo", name: "Huevo", emoji: "🥚", action: "hervir" },
      { id: "comino", name: "Especias", emoji: "🧂", action: "condimentar" },
    ],
    steps: [
      { instruction: "Pelá y picá la cebolla en cubos muy pequeños (brunoise)", action: "cortar", ingredient: "cebolla", marcelaMsg: "¡Cuanto más chica, mejor se integra al relleno!" },
      { instruction: "Rehogá la cebolla a fuego medio hasta que esté transparente", action: "saltear", ingredient: "cebolla", marcelaMsg: "Transparente significa que no tiene que dorar", timeHint: 300 },
      { instruction: "Sumá el morrón picado y cocinalo hasta que ablande", action: "saltear", ingredient: "morron", marcelaMsg: "El morrón le da dulzor natural al relleno" },
      { instruction: "Incorporá la carne desmenuzándola con cuchara de madera", action: "saltear", ingredient: "carne", marcelaMsg: "Rompé los grumos mientras se cocina" },
      { instruction: "Sazoná con comino, pimentón dulce, sal y pimienta", action: "condimentar", ingredient: "comino", marcelaMsg: "El comino es el secreto del sabor criollo" },
      { instruction: "Rellená las tapas, agregá huevo duro y repulgá", action: "rellenar", ingredient: "tapa", marcelaMsg: "Dejá 1cm de borde para cerrar bien" },
    ],
    originalRecipe: null,
  },
  {
    id: "tortilla",
    name: "Tortilla de Papas",
    emoji: "🍳",
    time: 40,
    difficulty: "Media",
    servings: 4,
    ingredients: [
      { id: "papa", name: "Papas", emoji: "🥔", action: "cortar" },
      { id: "cebolla", name: "Cebolla", emoji: "🧅", action: "cortar" },
      { id: "aceite", name: "Aceite", emoji: "🫒", action: "freir" },
      { id: "huevo", name: "Huevos", emoji: "🥚", action: "batir" },
      { id: "sal", name: "Sal", emoji: "🧂", action: "condimentar" },
    ],
    steps: [
      { instruction: "Pelá las papas y cortalas en rodajas finas de 3mm", action: "cortar", ingredient: "papa", marcelaMsg: "Rodajas parejas = cocción pareja" },
      { instruction: "Cortá la cebolla en juliana bien finita", action: "cortar", ingredient: "cebolla", marcelaMsg: "La juliana son tiritas largas y finas" },
      { instruction: "Freí las papas y cebolla en abundante aceite a fuego medio", action: "freir", ingredient: "aceite", marcelaMsg: "Confitar, no dorar: fuego suave", timeHint: 900 },
      { instruction: "Batí los huevos en un bowl grande con sal", action: "batir", ingredient: "huevo", marcelaMsg: "Calculá 1 huevo por persona mínimo" },
      { instruction: "Mezclá las papas escurridas con el huevo batido", action: "mezclar", ingredient: "huevo", marcelaMsg: "Las papas absorben parte del huevo" },
      { instruction: "Cociná en sartén y dala vuelta con un plato", action: "freir", ingredient: "aceite", marcelaMsg: "El secreto: sartén antiadherente y paciencia", timeHint: 300 },
    ],
    originalRecipe: null,
  },
];

interface InteractiveRecipe {
  id: string;
  name: string;
  emoji: string;
  time: number;
  difficulty: string;
  servings: number;
  ingredients: { id: string; name: string; emoji: string; action: string }[];
  steps: { instruction: string; action: string; ingredient: string; marcelaMsg: string; timeHint?: number }[];
  originalRecipe: Recipe | null;
}

interface CookWithMarcelaProps {
  onAchievementUnlocked?: (type: string) => void;
}

export function CookWithMarcela({ onAchievementUnlocked }: CookWithMarcelaProps) {
  const { user } = useAuth();
  const { play } = useSound();
  const { toast } = useToast();
  const { recordCookedRecipe } = useAchievements();
  const { selectPreset, startPause, isRunning, remainingSeconds, isFinished } = useKitchenTimer();
  
  const [phase, setPhase] = useState<"menu" | "cooking" | "complete">("menu");
  const [selectedRecipe, setSelectedRecipe] = useState<InteractiveRecipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [marcelaMessage, setMarcelaMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRecipes, setUserRecipes] = useState<InteractiveRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [showTimer, setShowTimer] = useState(false);

  // Marcela messages
  const marcelaMessages = {
    welcome: ["¡Hola! Elegí qué querés cocinar hoy 👩‍🍳", "¡Vamos a aprender juntos! Elegí una receta ✨"],
    start: ["¡Perfecto! Te voy a guiar paso a paso 💪", "¡A cocinar! Seguí mis instrucciones 🍳"],
    timer: ["¡Activo el timer para vos! ⏰", "Mientras esperamos, te cuento tips 📚"],
    complete: ["¡FELICITACIONES! 🎉 ¡Lo lograste!", "¡Bravo! ¡Quedó espectacular! 👏", "¡Sos un/a chef increíble! 🌟"],
  };

  // Load user recipes (favorites + cooked)
  useEffect(() => {
    const loadUserRecipes = async () => {
      if (!user) {
        setUserRecipes([]);
        setIsLoadingRecipes(false);
        return;
      }

      try {
        // Fetch favorites
        const { data: favorites } = await supabase
          .from("favorite_recipes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const convertedRecipes: InteractiveRecipe[] = [];
        
        if (favorites && favorites.length > 0) {
          favorites.forEach((fav, idx) => {
            const recipeData = fav.recipe_data as unknown as Recipe;
            if (recipeData && recipeData.steps && recipeData.steps.length > 0) {
              convertedRecipes.push(convertToInteractiveRecipe(recipeData, `fav_${idx}`));
            }
          });
        }

        setUserRecipes(convertedRecipes);
      } catch (error) {
        console.error("Error loading user recipes:", error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadUserRecipes();
  }, [user]);

  useEffect(() => {
    setMarcelaMessage(marcelaMessages.welcome[Math.floor(Math.random() * marcelaMessages.welcome.length)]);
  }, []);

  // Check if current step has a timer hint
  useEffect(() => {
    if (selectedRecipe && phase === "cooking") {
      const step = selectedRecipe.steps[currentStep];
      if (step.timeHint && !completedSteps.includes(currentStep)) {
        setShowTimer(true);
      }
    }
  }, [currentStep, selectedRecipe, phase, completedSteps]);

  const handleSelectRecipe = (recipe: InteractiveRecipe) => {
    if (soundEnabled) play('chime');
    setSelectedRecipe(recipe);
    setMarcelaMessage(marcelaMessages.start[Math.floor(Math.random() * marcelaMessages.start.length)]);
    setTimeout(() => {
      setPhase("cooking");
      if (soundEnabled) play('magic');
    }, 500);
  };

  const handleStartTimer = () => {
    if (selectedRecipe) {
      const step = selectedRecipe.steps[currentStep];
      if (step.timeHint) {
        selectPreset(step.timeHint);
        startPause();
        setMarcelaMessage(marcelaMessages.timer[Math.floor(Math.random() * marcelaMessages.timer.length)]);
        if (soundEnabled) play('notification');
        setShowTimer(false);
      }
    }
  };

  const handleStepComplete = useCallback((stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps(prev => [...prev, stepIndex]);
      if (soundEnabled) play('chime');
      
      // Check if all steps completed
      if (selectedRecipe && stepIndex === selectedRecipe.steps.length - 1) {
        setTimeout(() => {
          setPhase("complete");
          setShowConfetti(true);
          if (soundEnabled) play('success');
          setMarcelaMessage(marcelaMessages.complete[Math.floor(Math.random() * marcelaMessages.complete.length)]);
        }, 800);
      }
    }
  }, [completedSteps, selectedRecipe, soundEnabled, play]);

  const handleSaveAction = async (action: "cooked" | "favorite" | "calendar") => {
    if (!user || !selectedRecipe) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const recipeData = JSON.parse(JSON.stringify(selectedRecipe.originalRecipe || {
        name: selectedRecipe.name,
        time: selectedRecipe.time,
        difficulty: selectedRecipe.difficulty,
        servings: selectedRecipe.servings,
        ingredients: selectedRecipe.ingredients.map(i => i.name),
        steps: selectedRecipe.steps.map(s => s.instruction),
        tip: "Receta cocinada en modo interactivo con Marcela",
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        tags: ["interactivo", "cociná con marcela"],
      }));

      if (action === "cooked") {
        const { error } = await supabase
          .from("cooked_recipes")
          .insert([{
            user_id: user.id,
            recipe_name: selectedRecipe.name,
            recipe_data: recipeData,
          }]);
        if (error) throw error;
        recordCookedRecipe();
        toast({ title: "🎉 ¡Guardada!", description: "Se agregó a tu historial" });
      } else if (action === "favorite") {
        const { error } = await supabase
          .from("favorite_recipes")
          .insert([{
            user_id: user.id,
            recipe_name: selectedRecipe.name,
            recipe_data: recipeData,
          }]);
        if (error) throw error;
        toast({ title: "❤️ ¡Guardada!", description: "Se agregó a tus favoritas" });
      } else if (action === "calendar") {
        // Get current week start
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const { error } = await supabase
          .from("meal_plans")
          .insert([{
            user_id: user.id,
            recipe_name: selectedRecipe.name,
            recipe_data: recipeData,
            day_of_week: dayOfWeek,
            meal_type: "almuerzo",
            week_start: weekStart.toISOString().split("T")[0],
          }]);
        if (error) throw error;
        toast({ title: "📅 ¡Agregada!", description: "Se agregó al plan semanal" });
      }

      if (onAchievementUnlocked) {
        onAchievementUnlocked("interactive_chef");
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPhase("menu");
    setSelectedRecipe(null);
    setCurrentStep(0);
    setCompletedSteps([]);
    setShowConfetti(false);
    setShowTimer(false);
    setMarcelaMessage(marcelaMessages.welcome[0]);
    if (soundEnabled) play('whoosh');
  };

  // All available recipes
  const allRecipes = [...userRecipes, ...DEMO_RECIPES.map(r => ({ ...r, originalRecipe: null }))];

  // Menu phase - Recipe selection
  if (phase === "menu") {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Section Banner Image */}
        <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={gameBanner} 
            alt="Jugar" 
            className="w-full h-full object-cover transition-all duration-150"
          />
        </div>
        
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-accent/20 to-pink-500/10 border-primary/20 relative">
          <CardContent className="p-6 text-center space-y-6">
            {/* Marcela character */}
            <div className="relative inline-block">
              <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-lg animate-float bg-gradient-to-br from-primary/20 to-pink-light/20">
                <img 
                  src={marcelaCharacter} 
                  alt="Marcela" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-md whitespace-nowrap">
                <BookOpen className="w-3 h-3 inline mr-1" />
                Modo Educativo
              </div>
            </div>

            {/* Message bubble */}
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 max-w-xs mx-auto shadow-sm">
              <p className="text-foreground font-medium">{marcelaMessage}</p>
            </div>

            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="absolute top-4 right-4"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>

        {/* Recipe selection */}
        <div className="space-y-4">
          {/* User recipes section */}
          {user && userRecipes.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-primary" />
                <h3 className="text-lg font-semibold">Tus Recetas</h3>
              </div>
              <div className="grid gap-3">
                {userRecipes.slice(0, 3).map((recipe) => (
                  <Card 
                    key={recipe.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group bg-gradient-to-r from-primary/5 to-transparent"
                    onClick={() => handleSelectRecipe(recipe)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl group-hover:animate-bounce">{recipe.emoji}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {recipe.name}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {recipe.time} min
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {recipe.steps.length} pasos
                            </Badge>
                          </div>
                        </div>
                        <Play className="w-6 h-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Demo recipes section */}
          <div className="flex items-center gap-2 mt-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Recetas de Práctica</h3>
          </div>
          <div className="grid gap-3">
            {DEMO_RECIPES.map((recipe) => (
              <Card 
                key={recipe.id}
                className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                onClick={() => handleSelectRecipe(recipe as InteractiveRecipe)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:animate-bounce">{recipe.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {recipe.name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.time} min
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          {recipe.steps.length} pasos
                        </span>
                      </div>
                    </div>
                    <Play className="w-6 h-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tip for loading recipes */}
          {user && userRecipes.length === 0 && !isLoadingRecipes && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 text-center">
                <Lightbulb className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  ¡Guardá recetas en favoritos para cocinarlas con Marcela!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Cooking phase
  if (phase === "cooking" && selectedRecipe) {
    return (
      <div className="relative">
        <CookingKitchenView
          recipe={selectedRecipe}
          currentStep={currentStep}
          completedSteps={completedSteps}
          soundEnabled={soundEnabled}
          onStepComplete={handleStepComplete}
          onNextStep={() => setCurrentStep(prev => Math.min(prev + 1, selectedRecipe.steps.length - 1))}
          onPrevStep={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onBack={handleReset}
        />
        
        {/* Timer suggestion */}
        {showTimer && selectedRecipe.steps[currentStep].timeHint && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <Card className="bg-amber-500/90 text-white border-0 shadow-xl">
              <CardContent className="p-3 flex items-center gap-3">
                <Timer className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">
                  ¿Activo el timer de {Math.floor((selectedRecipe.steps[currentStep].timeHint || 0) / 60)} min?
                </span>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleStartTimer}
                >
                  ¡Sí!
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowTimer(false)}
                >
                  No
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Complete phase
  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 20 + 15}px`,
              }}
            >
              {["🎉", "⭐", "🍳", "👨‍🍳", "✨", "🎊"][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-primary/10 border-green-500/30">
        <CardContent className="p-8 text-center space-y-6">
          {/* Marcela celebrating */}
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-green-500/50 shadow-lg animate-bounce bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <img 
                src={marcelaCharacter} 
                alt="Marcela" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 text-3xl animate-pulse">🎉</div>
            <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse delay-100">✨</div>
          </div>

          {/* Success message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              ¡Receta Completada!
            </h2>
            <p className="text-lg text-green-600 dark:text-green-400 font-medium">
              {marcelaMessage}
            </p>
          </div>

          {/* Recipe completed */}
          {selectedRecipe && (
            <div className="flex items-center justify-center gap-3 bg-card/50 rounded-xl p-4 border border-border/50">
              <span className="text-4xl">{selectedRecipe.emoji}</span>
              <div className="text-left">
                <h3 className="font-semibold line-clamp-1">{selectedRecipe.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{selectedRecipe.steps.length} pasos completados</span>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{completedSteps.length}</div>
              <div className="text-xs text-muted-foreground">Pasos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">⭐</div>
              <div className="text-xs text-muted-foreground">Chef</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">✓</div>
              <div className="text-xs text-muted-foreground">Perfecto</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {user && (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                  onClick={() => handleSaveAction("cooked")}
                  disabled={isSaving}
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Guardar en historial
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => handleSaveAction("favorite")}
                    disabled={isSaving}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Favoritos
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => handleSaveAction("calendar")}
                    disabled={isSaving}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Planificar
                  </Button>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="lg"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Cocinar otra receta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
