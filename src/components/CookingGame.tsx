import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSound } from "@/hooks/useSound";
import { useAuth } from "@/hooks/useAuth";
import { useGameStats } from "@/hooks/useGameStats";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trophy, Star, ChefHat, Sparkles, RotateCcw, Play, Heart, Timer, Crown } from "lucide-react";
import marcelaCharacter from "@/assets/marcela-character.png";
// Game recipes with required ingredients - RECETAS ARGENTINAS PRECISAS
const GAME_RECIPES = [
  {
    id: "empanadas",
    name: "Empanadas de Carne",
    emoji: "🥟",
    ingredients: ["harina", "carne", "cebolla", "comino"],
    hint: "Tapas de harina, relleno de carne picada con cebolla y comino",
    reward: 12,
  },
  {
    id: "milanesa_napo",
    name: "Milanesa Napolitana",
    emoji: "🍖",
    ingredients: ["carne", "tomate", "jamon", "queso"],
    hint: "Milanesa con salsa de tomate, jamón y queso muzzarella gratinado",
    reward: 15,
  },
  {
    id: "milanesa",
    name: "Milanesa Clásica",
    emoji: "🥩",
    ingredients: ["carne", "huevo", "pan_rallado"],
    hint: "Carne pasada por huevo y empanizada con pan rallado",
    reward: 10,
  },
  {
    id: "locro",
    name: "Locro Patrio",
    emoji: "🍲",
    ingredients: ["maiz", "porotos", "carne", "chorizo"],
    hint: "Guiso criollo con maíz blanco, porotos, carne y chorizo colorado",
    reward: 18,
  },
  {
    id: "choripan",
    name: "Choripán Completo",
    emoji: "🌭",
    ingredients: ["chorizo", "pan", "chimichurri"],
    hint: "Chorizo parrillero en pan francés con chimichurri casero",
    reward: 10,
  },
  {
    id: "asado",
    name: "Asado Argentino",
    emoji: "🔥",
    ingredients: ["carne", "sal_gruesa", "carbon"],
    hint: "Cortes de carne a las brasas con sal gruesa y buen carbón",
    reward: 15,
  },
  {
    id: "alfajores",
    name: "Alfajores de Maicena",
    emoji: "🍪",
    ingredients: ["maicena", "dulce_leche", "coco"],
    hint: "Galletitas de maicena rellenas de dulce de leche y rebozadas en coco",
    reward: 12,
  },
  {
    id: "matambre",
    name: "Matambre a la Pizza",
    emoji: "🍕",
    ingredients: ["matambre", "tomate", "queso", "oregano"],
    hint: "Matambre arrollado con salsa, queso y orégano como una pizza",
    reward: 15,
  },
  {
    id: "provoleta",
    name: "Provoleta",
    emoji: "🧀",
    ingredients: ["provolone", "oregano", "aji"],
    hint: "Queso provolone a la parrilla con orégano y ají molido",
    reward: 10,
  },
  {
    id: "bondiola",
    name: "Bondiola al Horno",
    emoji: "🥓",
    ingredients: ["bondiola", "miel", "mostaza"],
    hint: "Bondiola de cerdo glaseada con miel y mostaza",
    reward: 12,
  },
  {
    id: "flan",
    name: "Flan Casero",
    emoji: "🍮",
    ingredients: ["huevo", "leche", "azucar", "dulce_leche"],
    hint: "Flan de huevo, leche y azúcar con dulce de leche arriba",
    reward: 14,
  },
  {
    id: "pizza_fugazzeta",
    name: "Fugazzeta",
    emoji: "🍕",
    ingredients: ["harina", "cebolla", "queso"],
    hint: "Pizza porteña con mucha cebolla y queso sin salsa de tomate",
    reward: 12,
  },
];

// Available ingredients pool - INGREDIENTES ARGENTINOS COMPLETOS
const INGREDIENTS_POOL = [
  // Carnes
  { id: "carne", name: "Carne Vacuna", emoji: "🥩" },
  { id: "chorizo", name: "Chorizo", emoji: "🌭" },
  { id: "matambre", name: "Matambre", emoji: "🥓" },
  { id: "bondiola", name: "Bondiola", emoji: "🍖" },
  { id: "jamon", name: "Jamón", emoji: "🥓" },
  // Lácteos
  { id: "huevo", name: "Huevo", emoji: "🥚" },
  { id: "queso", name: "Muzzarella", emoji: "🧀" },
  { id: "provolone", name: "Provolone", emoji: "🧀" },
  { id: "leche", name: "Leche", emoji: "🥛" },
  // Harinas y panes
  { id: "harina", name: "Harina", emoji: "🌾" },
  { id: "pan_rallado", name: "Pan Rallado", emoji: "🍞" },
  { id: "pan", name: "Pan Francés", emoji: "🥖" },
  { id: "maicena", name: "Maicena", emoji: "🥣" },
  // Verduras
  { id: "cebolla", name: "Cebolla", emoji: "🧅" },
  { id: "tomate", name: "Tomate", emoji: "🍅" },
  // Legumbres
  { id: "maiz", name: "Maíz Blanco", emoji: "🌽" },
  { id: "porotos", name: "Porotos", emoji: "🫘" },
  // Condimentos
  { id: "sal_gruesa", name: "Sal Gruesa", emoji: "🧂" },
  { id: "comino", name: "Comino", emoji: "🫙" },
  { id: "oregano", name: "Orégano", emoji: "🌿" },
  { id: "aji", name: "Ají Molido", emoji: "🌶️" },
  { id: "chimichurri", name: "Chimichurri", emoji: "🥗" },
  // Dulces
  { id: "dulce_leche", name: "Dulce de Leche", emoji: "🍯" },
  { id: "azucar", name: "Azúcar", emoji: "🍬" },
  { id: "miel", name: "Miel", emoji: "🍯" },
  { id: "coco", name: "Coco Rallado", emoji: "🥥" },
  { id: "mostaza", name: "Mostaza", emoji: "🟡" },
  // Otros
  { id: "carbon", name: "Carbón", emoji: "⚫" },
];

// Marcela messages
const MARCELA_MESSAGES = {
  welcome: ["¡Hola! ¿Listo para cocinar conmigo?", "¡Vamos a divertirnos cocinando!"],
  correct: ["¡Excelente elección!", "¡Así se hace!", "¡Perfecto!", "¡Vas muy bien!"],
  incorrect: ["Mmm, ese no va...", "Probá con otro", "¡Casi! Intentá de nuevo"],
  complete: ["¡Bravo! ¡Lo lograste!", "¡Sos un genio de la cocina!", "¡Increíble!"],
  hint: ["Te doy una pista...", "Escuchá bien..."],
  streak: ["¡Estás en racha!", "¡Imparable!", "¡No te para nadie!"],
};

interface CookingGameProps {
  onAchievementUnlocked?: (type: string) => void;
}

export function CookingGame({ onAchievementUnlocked }: CookingGameProps) {
  const { user } = useAuth();
  const { play } = useSound();
  const { stats: gameStats, saveGameResult } = useGameStats();
  const { t } = useLanguage();
  const [gameState, setGameState] = useState<"menu" | "playing" | "complete">("menu");
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  
  const [marcelaMessage, setMarcelaMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedRecipes, setCompletedRecipes] = useState<string[]>([]);
  const [draggedIngredient, setDraggedIngredient] = useState<string | null>(null);
  const [shuffledIngredients, setShuffledIngredients] = useState<typeof INGREDIENTS_POOL>([]);
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [showIncorrectAnimation, setShowIncorrectAnimation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [maxStreakInGame, setMaxStreakInGame] = useState(0);
  
  const potRef = useRef<HTMLDivElement>(null);

  const currentRecipe = GAME_RECIPES[currentRecipeIndex];
  
  // Shuffle ingredients for variety - show more options based on recipe difficulty
  const shuffleIngredients = useCallback(() => {
    const required = currentRecipe.ingredients.map(id => 
      INGREDIENTS_POOL.find(ing => ing.id === id)!
    ).filter(Boolean);
    
    const others = INGREDIENTS_POOL.filter(
      ing => !currentRecipe.ingredients.includes(ing.id)
    );
    
    // Show 8 total ingredients (correct ones + distractors)
    const numDistractors = Math.max(4, 8 - required.length);
    const shuffled = [...required, ...others.slice(0, numDistractors)]
      .sort(() => Math.random() - 0.5);
    setShuffledIngredients(shuffled);
  }, [currentRecipe]);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive || gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTimerActive, gameState]);

  const handleTimeUp = () => {
    setIsTimerActive(false);
    play("notification");
    setMarcelaMessage("¡Se acabó el tiempo! Pero no te preocupes, ¡seguí practicando!");
    setGameState("complete");
  };

  // Start game
  const startGame = () => {
    setGameState("playing");
    setCurrentRecipeIndex(0);
    setSelectedIngredients([]);
    setScore(0);
    setStreak(0);
    setMaxStreakInGame(0);
    setLives(5); // More lives for harder recipes
    setCompletedRecipes([]);
    setTimeLeft(90); // More time for more ingredients
    setIsTimerActive(true);
    setGameStartTime(Date.now());
    shuffleIngredients();
    setMarcelaMessage(MARCELA_MESSAGES.welcome[Math.floor(Math.random() * MARCELA_MESSAGES.welcome.length)]);
    play("magic");
  };

  // Handle ingredient selection (drag & drop or click)
  const handleIngredientSelect = useCallback((ingredientId: string) => {
    if (gameState !== "playing" || isAnimating) return;
    if (selectedIngredients.includes(ingredientId)) return;
    
    // Allow ingredients in ANY ORDER - just check if it's a required ingredient
    const isCorrect = currentRecipe.ingredients.includes(ingredientId);
    
    setIsAnimating(true);
    
    if (isCorrect) {
      // Correct ingredient
      play("chime");
      setShowCorrectAnimation(true);
      setSelectedIngredients(prev => [...prev, ingredientId]);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreakInGame(current => Math.max(current, newStreak));
        return newStreak;
      });
      setScore(prev => prev + 5 * (streak + 1));
      
      const messages = streak >= 2 ? MARCELA_MESSAGES.streak : MARCELA_MESSAGES.correct;
      setMarcelaMessage(messages[Math.floor(Math.random() * messages.length)]);
      
      setTimeout(() => {
        setShowCorrectAnimation(false);
        setIsAnimating(false);
        
        // Check if recipe is complete
        if (selectedIngredients.length + 1 === currentRecipe.ingredients.length) {
          handleRecipeComplete();
        }
      }, 500);
    } else {
      // Incorrect ingredient
      play("pop");
      setShowIncorrectAnimation(true);
      setStreak(0);
      setLives(prev => Math.max(0, prev - 1));
      setMarcelaMessage(MARCELA_MESSAGES.incorrect[Math.floor(Math.random() * MARCELA_MESSAGES.incorrect.length)]);
      
      setTimeout(() => {
        setShowIncorrectAnimation(false);
        setIsAnimating(false);
        
        if (lives <= 1) {
          setGameState("complete");
          setIsTimerActive(false);
          setMarcelaMessage("¡Buen intento! La próxima vez será mejor 💪");
        }
      }, 500);
    }
  }, [gameState, isAnimating, selectedIngredients, currentRecipe, streak, lives, play]);

  // Handle recipe completion
  const handleRecipeComplete = () => {
    play("success");
    setCompletedRecipes(prev => [...prev, currentRecipe.id]);
    setScore(prev => prev + currentRecipe.reward);
    setTimeLeft(prev => prev + 15); // Bonus time
    
    setMarcelaMessage(MARCELA_MESSAGES.complete[Math.floor(Math.random() * MARCELA_MESSAGES.complete.length)]);
    
    // Check for achievements
    if (completedRecipes.length + 1 >= 3 && onAchievementUnlocked) {
      onAchievementUnlocked("game_chef");
    }
    if (score >= 100 && onAchievementUnlocked) {
      onAchievementUnlocked("game_master");
    }
    
    // Move to next recipe or end game
    setTimeout(() => {
      if (currentRecipeIndex + 1 < GAME_RECIPES.length) {
        setCurrentRecipeIndex(prev => prev + 1);
        setSelectedIngredients([]);
        
        shuffleIngredients();
      } else {
        setGameState("complete");
        setIsTimerActive(false);
        setMarcelaMessage("¡Completaste todos los platos! ¡Sos un Master Chef! 👨‍🍳");
      }
    }, 1500);
  };

  // Update shuffled ingredients when recipe changes
  useEffect(() => {
    if (gameState === "playing") {
      shuffleIngredients();
    }
  }, [currentRecipeIndex, gameState, shuffleIngredients]);

  // Save game results when game ends
  useEffect(() => {
    if (gameState === "complete" && user && gameStartTime > 0) {
      const timePlayed = Math.floor((Date.now() - gameStartTime) / 1000);
      saveGameResult(score, maxStreakInGame, completedRecipes.length, timePlayed);
    }
  }, [gameState, user, score, maxStreakInGame, completedRecipes.length, gameStartTime, saveGameResult]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, ingredientId: string) => {
    setDraggedIngredient(ingredientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIngredient) {
      handleIngredientSelect(draggedIngredient);
      setDraggedIngredient(null);
    }
  };

  // Touch handlers for mobile
  const handleTouchEnd = (ingredientId: string) => {
    handleIngredientSelect(ingredientId);
  };

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Menu screen
  if (gameState === "menu") {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
          <CardContent className="p-6 text-center space-y-6">
            {/* Marcela character */}
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30 shadow-lg animate-float">
                <img 
                  src={marcelaCharacter} 
                  alt="Marcela" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-md">
                <Sparkles className="w-3 h-3 inline mr-1" />
                ¡Juguemos!
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {t("tourJuego")}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t("tourJuegoDesc")}
              </p>
            </div>

            {/* Game stats preview */}
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <ChefHat className="w-4 h-4 text-primary" />
                <span>{GAME_RECIPES.length} {t("recipes")}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t("achievementsTitle")}</span>
              </div>
            </div>

            {/* User records */}
            {user && gameStats.totalGamesPlayed > 0 && (
              <div className="bg-card/50 rounded-lg p-4 border border-border/50 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{t("playPoints")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{gameStats.highScore}</div>
                    <div className="text-xs text-muted-foreground">{t("achievementsBestStreak")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-500">{gameStats.totalRecipesCompleted}</div>
                    <div className="text-xs text-muted-foreground">{t("recipes")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-pink-light">{gameStats.bestStreak}</div>
                    <div className="text-xs text-muted-foreground">{t("activityBestStreak")}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {gameStats.totalGamesPlayed} {t("achievementsRecipesCount")}
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              onClick={startGame}
              className="w-full max-w-xs bg-gradient-to-r from-primary to-pink-light hover:from-primary/90 hover:to-pink-light/90 shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {t("onboardingLetsStart")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete screen
  if (gameState === "complete") {
    const isWin = completedRecipes.length > 0 || lives > 0;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
          <CardContent className="p-6 text-center space-y-6">
            {/* Marcela character */}
            <div className="relative inline-block">
              <div className={`w-28 h-28 mx-auto rounded-full overflow-hidden border-4 ${isWin ? 'border-amber-400' : 'border-primary/30'} shadow-lg`}>
                <img 
                  src={marcelaCharacter} 
                  alt="Marcela" 
                  className="w-full h-full object-cover"
                />
              </div>
              {isWin && (
                <div className="absolute -top-2 -right-2 animate-bounce">
                  <Trophy className="w-8 h-8 text-amber-500 drop-shadow-lg" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {isWin ? "¡Excelente!" : "¡Buen intento!"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {marcelaMessage}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
                <div className="text-2xl font-bold text-primary">{score}</div>
                <div className="text-xs text-muted-foreground">Puntos</div>
              </div>
              <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
                <div className="text-2xl font-bold text-amber-500">{completedRecipes.length}</div>
                <div className="text-xs text-muted-foreground">Recetas</div>
              </div>
              <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
                <div className="text-2xl font-bold text-pink-light">{maxStreakInGame}</div>
                <div className="text-xs text-muted-foreground">Racha Max</div>
              </div>
            </div>

            {/* New high score indicator */}
            {user && score > (gameStats.highScore - score) && score > 0 && (
              <div className="flex items-center justify-center gap-2 text-amber-500 animate-pulse">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">¡Nuevo récord!</span>
              </div>
            )}

            {/* Completed recipes */}
            {completedRecipes.length > 0 && (
              <div className="flex justify-center gap-2 flex-wrap">
                {completedRecipes.map(id => {
                  const recipe = GAME_RECIPES.find(r => r.id === id);
                  return recipe ? (
                    <Badge key={id} variant="secondary" className="text-lg py-1 px-3">
                      {recipe.emoji} {recipe.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* User's all-time records */}
            {user && gameStats.totalGamesPlayed > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30 space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span>Tus Mejores Marcas</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{gameStats.highScore}</div>
                    <div className="text-muted-foreground">Mejor Puntaje</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{gameStats.totalRecipesCompleted}</div>
                    <div className="text-muted-foreground">Recetas Total</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{gameStats.bestStreak}</div>
                    <div className="text-muted-foreground">Mejor Racha</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={startGame}
                className="bg-gradient-to-r from-primary to-pink-light"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Jugar de Nuevo
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setGameState("menu")}
              >
                Volver al Menú
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing screen
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar: Score, Lives, Timer */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-lg">{score}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Heart 
              key={i} 
              className={`w-4 h-4 transition-all ${i < lives ? 'text-red-500 fill-red-500' : 'text-muted-foreground/30'}`} 
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Receta {currentRecipeIndex + 1} de {GAME_RECIPES.length}</span>
          <span>{streak > 0 && `🔥 Racha: ${streak}`}</span>
        </div>
        <Progress value={(currentRecipeIndex / GAME_RECIPES.length) * 100} className="h-2" />
      </div>

      {/* Current Recipe & Marcela */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Marcela mini */}
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0 ${isAnimating ? 'animate-bounce' : ''}`}>
              <img 
                src={marcelaCharacter} 
                alt="Marcela" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{currentRecipe.emoji}</span>
                <h3 className="font-display font-semibold text-lg truncate">{currentRecipe.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {marcelaMessage || currentRecipe.hint}
              </p>
            </div>
          </div>

          {/* Ingredient slots */}
          <div className="flex justify-center gap-2 mt-4">
            {currentRecipe.ingredients.map((ing, idx) => {
              const isSelected = idx < selectedIngredients.length;
              const ingredient = INGREDIENTS_POOL.find(i => i.id === ing);
              
              return (
                <div 
                  key={ing}
                  className={`w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10 scale-105' 
                      : 'border-muted-foreground/30 bg-muted/30'
                  }`}
                >
                  {isSelected ? ingredient?.emoji : "?"}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cooking Pot (Drop Zone) */}
      <div 
        ref={potRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative mx-auto w-40 h-32 flex items-center justify-center transition-all ${
          draggedIngredient ? 'scale-110' : ''
        } ${showCorrectAnimation ? 'animate-bounce' : ''} ${showIncorrectAnimation ? 'animate-shake' : ''}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-7xl ${draggedIngredient ? 'animate-pulse' : ''}`}>
            🍳
          </div>
        </div>
        {showCorrectAnimation && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-fade-in">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
        )}
      </div>

      {/* Ingredients Pool */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Tocá o arrastrá el ingrediente correcto a la olla 👆
          </p>
          <div className="grid grid-cols-4 gap-2">
            {shuffledIngredients.map(ingredient => {
              const isUsed = selectedIngredients.includes(ingredient.id);
              
              return (
                <button
                  key={ingredient.id}
                  disabled={isUsed || isAnimating}
                  draggable={!isUsed && !isAnimating}
                  onDragStart={(e) => handleDragStart(e, ingredient.id)}
                  onTouchEnd={() => !isUsed && handleTouchEnd(ingredient.id)}
                  onClick={() => handleIngredientSelect(ingredient.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                    isUsed 
                      ? 'opacity-30 cursor-not-allowed border-transparent' 
                      : 'border-border hover:border-primary hover:bg-primary/5 active:scale-95 cursor-grab'
                  } ${draggedIngredient === ingredient.id ? 'opacity-50 scale-95' : ''}`}
                >
                  <span className="text-2xl">{ingredient.emoji}</span>
                  <span className="text-xs text-muted-foreground truncate w-full text-center mt-1">
                    {ingredient.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
