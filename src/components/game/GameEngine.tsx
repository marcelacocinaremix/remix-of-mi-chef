import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Star, Timer, Flame, ChefHat,
  X, CheckCircle, XCircle,
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { useLanguage } from "@/contexts/LanguageContext";
import { GAME_RECIPES, INGREDIENTS_POOL } from "./gameConfig";
import marcelaCharacter from "@/assets/marcela-character.png";

type GameMode = "recipe" | "order" | "ingredients";

type GameMode = "recipe" | "order" | "ingredients";

interface GameEngineProps {
  mode: GameMode;
  onClose: () => void;
  onGameEnd: (result: { score: number; streak: number; recipesCompleted: number; timePlayed: number; xp: number }) => void;
}

const MARCELA_MSGS = {
  correct: ["¡Excelente!", "¡Así se hace! 🔥", "¡Perfecto!", "¡Sos un crack! 💪", "¡Top! ⭐"],
  wrong: ["Mmm, ese no...", "¡Casi! 🤔", "Intentá de nuevo", "¡Probá otro!"],
  streak: ["¡En racha! 🔥🔥", "¡Imparable! 💥", "¡Sos un genio! 👑"],
  complete: ["🎉 ¡Receta lista!", "¡Bravo! 👨‍🍳", "¡Lo lograste! 🏆"],
};

export function GameEngine({ mode, onClose, onGameEnd }: GameEngineProps) {
  const { play } = useSound();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [recipeIndex, setRecipeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [completedRecipes, setCompletedRecipes] = useState<string[]>([]);
  const [marcelaMsg, setMarcelaMsg] = useState(MARCELA_MSGS.correct[0]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [orderSteps, setOrderSteps] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const currentRecipe = GAME_RECIPES[recipeIndex % GAME_RECIPES.length];

  // Shuffled ingredients for the current recipe
  const shuffledIngredients = useCallback(() => {
    const required = currentRecipe.ingredients.map(id =>
      INGREDIENTS_POOL.find(i => i.id === id)!
    ).filter(Boolean);
    const others = INGREDIENTS_POOL.filter(i => !currentRecipe.ingredients.includes(i.id));
    return [...required, ...others.slice(0, Math.max(4, 8 - required.length))]
      .sort(() => Math.random() - 0.5);
  }, [currentRecipe]);

  const [ingredientOptions, setIngredientOptions] = useState(shuffledIngredients);

  // Shuffled order steps
  useEffect(() => {
    if (mode === "order") {
      setOrderSteps([...currentRecipe.steps].sort(() => Math.random() - 0.5));
    }
    setIngredientOptions(shuffledIngredients());
    setSelectedIngredients([]);
  }, [recipeIndex, mode]);

  // Timer
  useEffect(() => {
    if (gameOver || mode !== "recipe") return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, mode]);

  const endGame = useCallback(() => {
    if (gameOver) return;
    setGameOver(true);
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    const xp = score + completedRecipes.length * 50 + maxStreak * 10;
    onGameEnd({ score, streak: maxStreak, recipesCompleted: completedRecipes.length, timePlayed, xp });
  }, [gameOver, score, maxStreak, completedRecipes.length, startTime, onGameEnd]);

  const showFeedback = useCallback((type: "correct" | "wrong") => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 700);
  }, []);

  const handleIngredientPick = useCallback((ingredientId: string) => {
    if (isAnimating || gameOver) return;
    if (selectedIngredients.includes(ingredientId)) return;
    setIsAnimating(true);

    const isCorrect = currentRecipe.ingredients.includes(ingredientId);

    if (isCorrect) {
      play("chime");
      showFeedback("correct");
      const newSelected = [...selectedIngredients, ingredientId];
      setSelectedIngredients(newSelected);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(s => Math.max(s, newStreak));
      const pts = 50 + newStreak * 10;
      setScore(s => s + pts);
      setMarcelaMsg(newStreak >= 3
        ? MARCELA_MSGS.streak[Math.floor(Math.random() * MARCELA_MSGS.streak.length)]
        : MARCELA_MSGS.correct[Math.floor(Math.random() * MARCELA_MSGS.correct.length)]
      );

      if (newSelected.length === currentRecipe.ingredients.length) {
        play("success");
        setMarcelaMsg(MARCELA_MSGS.complete[Math.floor(Math.random() * MARCELA_MSGS.complete.length)]);
        setScore(s => s + currentRecipe.baseScore);
        setTimeLeft(t => t + 20);
        setCompletedRecipes(prev => [...prev, currentRecipe.id]);

        setTimeout(() => {
          setRecipeIndex(i => i + 1);
          setSelectedIngredients([]);
          setIsAnimating(false);
        }, 1200);
        return;
      }
    } else {
      play("pop");
      showFeedback("wrong");
      setStreak(0);
      setMarcelaMsg(MARCELA_MSGS.wrong[Math.floor(Math.random() * MARCELA_MSGS.wrong.length)]);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => endGame(), 600);
      }
    }
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, gameOver, selectedIngredients, currentRecipe, streak, lives, play, showFeedback, endGame]);

  const handleOrderSubmit = useCallback(() => {
    const correct = currentRecipe.steps.every((step, i) => orderSteps[i] === step);
    if (correct) {
      play("success");
      showFeedback("correct");
      setScore(s => s + currentRecipe.baseScore + 50);
      setStreak(s => s + 1);
      setMaxStreak(s => Math.max(s, streak + 1));
      setCompletedRecipes(prev => [...prev, currentRecipe.id]);
      setMarcelaMsg(MARCELA_MSGS.complete[0]);
      setTimeout(() => setRecipeIndex(i => i + 1), 1200);
    } else {
      play("pop");
      showFeedback("wrong");
      setMarcelaMsg("¡Revisá el orden! 🤔");
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) setTimeout(() => endGame(), 600);
    }
  }, [currentRecipe, orderSteps, streak, lives, play, showFeedback, endGame]);

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= orderSteps.length) return;
    const newSteps = [...orderSteps];
    const [item] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, item);
    setOrderSteps(newSteps);
  };

  const timerPct = (timeLeft / 90) * 100;
  const progressPct = ((recipeIndex % GAME_RECIPES.length) / GAME_RECIPES.length) * 100;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header HUD */}
      <div className="flex-shrink-0 bg-card/90 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          {/* Score */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-xl px-3 py-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="font-black text-foreground text-sm">{score}</span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={i >= lives ? { scale: [1, 1.3, 0.8] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`w-5 h-5 ${i < lives ? "text-red-500 fill-red-500" : "text-muted/30"}`} />
              </motion.div>
            ))}
          </div>

          {/* Timer / Streak */}
          <div className="flex items-center gap-2">
            {mode === "recipe" && (
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-mono font-black text-sm ${timeLeft <= 15 ? "bg-red-500/15 text-red-500 animate-pulse" : "bg-primary/10 text-primary"}`}>
                <Timer className="w-3.5 h-3.5" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 rounded-xl px-2 py-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-orange-500 font-black text-xs">×{streak}</span>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        {mode === "recipe" && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center ${feedback === "correct" ? "bg-green-500/10" : "bg-red-500/10"}`}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              {feedback === "correct"
                ? <CheckCircle className="w-24 h-24 text-green-500 drop-shadow-lg" />
                : <XCircle className="w-24 h-24 text-red-500 drop-shadow-lg" />
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Marcela bubble */}
        <motion.div
          key={marcelaMsg}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
            <img src={marcelaCharacter} alt="Marcela" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card rounded-2xl rounded-tl-none px-4 py-2 border border-border/50 shadow-sm max-w-[75%]">
            <p className="text-sm font-medium text-foreground">{marcelaMsg}</p>
          </div>
        </motion.div>

        {/* Recipe card */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentRecipe.emoji}</span>
            <div>
              <h3 className="font-black text-foreground text-base">{currentRecipe.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs py-0">{mode === "recipe" ? t("gameModeRecipe") : mode === "order" ? t("gameModeOrder") : t("gameModeIngredients")}</Badge>
                <span className="text-xs text-muted-foreground">Receta {(recipeIndex % GAME_RECIPES.length) + 1}/{GAME_RECIPES.length}</span>
              </div>
            </div>
          </div>

          {/* Ingredient slots (recipe mode) */}
          {mode !== "order" && (
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {currentRecipe.ingredients.map((ing, idx) => {
                const filled = idx < selectedIngredients.length;
                const ingredient = INGREDIENTS_POOL.find(i => i.id === ing);
                return (
                  <motion.div
                    key={ing}
                    animate={filled ? { scale: [1, 1.2, 1] } : {}}
                    className={`w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-2xl transition-all ${filled ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                  >
                    {filled ? <span>{ingredient?.emoji}</span> : <span className="text-muted-foreground text-lg">?</span>}
                    {filled && <span className="text-[8px] text-primary font-medium mt-0.5 max-w-full px-0.5 truncate">{ingredient?.name.split(" ")[0]}</span>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ingredients grid (recipe / ingredients mode) */}
        {mode !== "order" && (
          <div>
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">{t("gameSelectIngredient")} 👆</p>
            <div className="grid grid-cols-4 gap-2">
              {ingredientOptions.map(ingredient => {
                const isUsed = selectedIngredients.includes(ingredient.id);
                return (
                  <motion.button
                    key={ingredient.id}
                    whileTap={!isUsed ? { scale: 0.9 } : {}}
                    disabled={isUsed || isAnimating}
                    onClick={() => handleIngredientPick(ingredient.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all ${isUsed ? "opacity-30 cursor-not-allowed border-transparent bg-transparent" : "border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer shadow-sm"}`}
                  >
                    <span className="text-2xl">{ingredient.emoji}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 w-full text-center truncate">{ingredient.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Order steps mode */}
        {mode === "order" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center font-medium">{t("gameOrderStepsDesc")}</p>
            {orderSteps.map((step, i) => (
              <motion.div
                key={step}
                layout
                className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground flex-1 leading-tight">{step}</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStep(i, i - 1)}
                    disabled={i === 0}
                    className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted"
                  >
                    <span className="text-xs text-muted-foreground">↑</span>
                  </button>
                  <button
                    onClick={() => moveStep(i, i + 1)}
                    disabled={i === orderSteps.length - 1}
                    className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted"
                  >
                    <span className="text-xs text-muted-foreground">↓</span>
                  </button>
                </div>
              </motion.div>
            ))}
            <Button onClick={handleOrderSubmit} className="w-full" size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("gameSubmitOrder")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
