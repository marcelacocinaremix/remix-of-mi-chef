// GameEngine v2
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Timer, Flame, X, CheckCircle, XCircle } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { useLanguage } from "@/contexts/LanguageContext";
import { GAME_RECIPES, INGREDIENTS_POOL } from "./gameConfig";
import marcelaCharacter from "@/assets/marcela-character.png";

type GameMode = "recipe" | "order" | "ingredients";

interface GameEngineProps {
  mode: GameMode;
  onClose: () => void;
  onGameEnd: (result: { score: number; streak: number; recipesCompleted: number; timePlayed: number; xp: number }) => void;
}

const MARCELA_MSGS = {
  start: ["¡Elegí los ingredientes! 👆", "¿Cuáles van en esta receta? 🤔", "¡A cocinar! Seleccioná los ingredientes"],
  correct: ["¡Excelente! 🎉", "¡Así se hace! 🔥", "¡Perfecto! ⭐", "¡Sos un crack! 💪", "¡Muy bien! 👏"],
  wrong: ["Mmm, ese no... 😅", "¡Casi! Intentá otro 🤔", "No es ese ingrediente", "¡Seguí probando! 💪"],
  streak: ["¡En racha! 🔥🔥", "¡Imparable! 💥", "¡Sos un genio! 👑"],
  complete: ["🎉 ¡Receta lista!", "¡Bravo! 👨‍🍳", "¡Lo lograste! 🏆"],
  order: ["Ordená los pasos correctamente 👆", "¿En qué orden se hace? 🤔", "¡Ordená los pasos!"],
  ingredientStart: ["¿A qué receta pertenece este ingrediente? 🤔", "¡Identificá la receta! 👆", "¿En qué plato se usa este ingrediente?"],
  ingredientCorrect: ["¡Correcto! Sabés de cocina 🌍", "¡Muy bien! 🎯", "¡Exacto! ✅", "¡Eso es! 🔥"],
  ingredientWrong: ["¡No era esa receta! 😅", "Fijate bien en el ingrediente 🤔", "¡Casi! Era otra receta"],
};

function buildIngredientQuestions() {
  const questions: { ingredientId: string; correctRecipeId: string }[] = [];
  GAME_RECIPES.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      questions.push({ ingredientId: ing, correctRecipeId: recipe.id });
    });
  });
  return questions.sort(() => Math.random() - 0.5);
}

function getRecipeOptions(correctRecipeId: string) {
  const correct = GAME_RECIPES.find(r => r.id === correctRecipeId)!;
  const others = GAME_RECIPES.filter(r => r.id !== correctRecipeId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

export function GameEngine({ mode, onClose, onGameEnd }: GameEngineProps) {
  const { play } = useSound();
  const { t } = useLanguage();

  const [recipeIndex, setRecipeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [completedRecipes, setCompletedRecipes] = useState<string[]>([]);
  const [marcelaMsg, setMarcelaMsg] = useState(
    mode === "ingredients" ? MARCELA_MSGS.ingredientStart[0]
    : mode === "order" ? MARCELA_MSGS.order[0]
    : MARCELA_MSGS.start[0]
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [orderSteps, setOrderSteps] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  // Ingredients mode state
  const [ingredientQuestions] = useState(() => buildIngredientQuestions());
  const [ingredientQIndex, setIngredientQIndex] = useState(0);
  const [recipeOptions, setRecipeOptions] = useState(() =>
    getRecipeOptions(buildIngredientQuestions()[0]?.correctRecipeId ?? GAME_RECIPES[0].id)
  );

  const currentRecipe = GAME_RECIPES[recipeIndex % GAME_RECIPES.length];
  const currentIngredientQ = ingredientQuestions[ingredientQIndex % ingredientQuestions.length];
  const currentIngredient = INGREDIENTS_POOL.find(i => i.id === currentIngredientQ?.ingredientId);

  const shuffledIngredients = useCallback(() => {
    const required = currentRecipe.ingredients.map(id => INGREDIENTS_POOL.find(i => i.id === id)!).filter(Boolean);
    const others = INGREDIENTS_POOL.filter(i => !currentRecipe.ingredients.includes(i.id));
    return [...required, ...others.slice(0, Math.max(4, 8 - required.length))].sort(() => Math.random() - 0.5);
  }, [currentRecipe]);

  const [ingredientOptions, setIngredientOptions] = useState(shuffledIngredients);

  useEffect(() => {
    if (mode === "ingredients" && currentIngredientQ) {
      setRecipeOptions(getRecipeOptions(currentIngredientQ.correctRecipeId));
    }
  }, [ingredientQIndex, mode]);

  useEffect(() => {
    if (mode === "order") {
      setOrderSteps([...currentRecipe.steps].sort(() => Math.random() - 0.5));
      setMarcelaMsg(MARCELA_MSGS.order[Math.floor(Math.random() * MARCELA_MSGS.order.length)]);
    } else if (mode === "recipe") {
      setMarcelaMsg(MARCELA_MSGS.start[Math.floor(Math.random() * MARCELA_MSGS.start.length)]);
    }
    setIngredientOptions(shuffledIngredients());
    setSelectedIngredients([]);
  }, [recipeIndex, mode]);

  useEffect(() => {
    if (gameOver || mode !== "recipe") return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); endGame(); return 0; }
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

  // Recipe mode: select all correct ingredients
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
      setScore(s => s + 50 + newStreak * 10);
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
        setTimeout(() => { setRecipeIndex(i => i + 1); setSelectedIngredients([]); setIsAnimating(false); }, 1200);
        return;
      }
    } else {
      play("pop");
      showFeedback("wrong");
      setStreak(0);
      setMarcelaMsg(MARCELA_MSGS.wrong[Math.floor(Math.random() * MARCELA_MSGS.wrong.length)]);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) setTimeout(() => endGame(), 600);
    }
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, gameOver, selectedIngredients, currentRecipe, streak, lives, play, showFeedback, endGame]);

  // Ingredients mode: guess which recipe uses this ingredient
  const handleRecipePick = useCallback((recipeId: string) => {
    if (isAnimating || gameOver) return;
    setIsAnimating(true);
    const isCorrect = recipeId === currentIngredientQ.correctRecipeId;
    if (isCorrect) {
      play("chime");
      showFeedback("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(s => Math.max(s, newStreak));
      setScore(s => s + 60 + newStreak * 10);
      setMarcelaMsg(newStreak >= 3
        ? MARCELA_MSGS.streak[Math.floor(Math.random() * MARCELA_MSGS.streak.length)]
        : MARCELA_MSGS.ingredientCorrect[Math.floor(Math.random() * MARCELA_MSGS.ingredientCorrect.length)]
      );
      setCompletedRecipes(prev => prev.includes(recipeId) ? prev : [...prev, recipeId]);
      setTimeout(() => { setIngredientQIndex(i => i + 1); setIsAnimating(false); }, 800);
    } else {
      play("pop");
      showFeedback("wrong");
      setStreak(0);
      setMarcelaMsg(MARCELA_MSGS.ingredientWrong[Math.floor(Math.random() * MARCELA_MSGS.ingredientWrong.length)]);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) setTimeout(() => endGame(), 600);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, gameOver, currentIngredientQ, streak, lives, play, showFeedback, endGame]);

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header HUD */}
      <div className="flex-shrink-0 bg-card/90 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-xl px-3 py-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="font-black text-foreground text-sm">{score}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} animate={i >= lives ? { scale: [1, 1.3, 0.8] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={`w-5 h-5 ${i < lives ? "text-red-500 fill-red-500" : "text-muted/30"}`} />
              </motion.div>
            ))}
          </div>
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
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {mode === "recipe" && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" animate={{ width: `${timerPct}%` }} transition={{ duration: 0.5 }} />
          </div>
        )}
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center ${feedback === "correct" ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}>
              {feedback === "correct"
                ? <CheckCircle className="w-24 h-24 text-green-500 drop-shadow-lg" />
                : <XCircle className="w-24 h-24 text-red-500 drop-shadow-lg" />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Marcela bubble */}
        <motion.div key={marcelaMsg} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
            <img src={marcelaCharacter} alt="Chef" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card rounded-2xl rounded-tl-none px-4 py-2 border border-border/50 shadow-sm max-w-[75%]">
            <p className="text-sm font-medium text-foreground">{marcelaMsg}</p>
          </div>
        </motion.div>

        {/* ── INGREDIENTS MODE: adivinar a qué receta pertenece el ingrediente ── */}
        {mode === "ingredients" && currentIngredient && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">¿En qué receta se usa este ingrediente?</p>
              <motion.div
                key={currentIngredient.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex flex-col items-center gap-2 bg-primary/8 border-2 border-primary/30 rounded-2xl px-8 py-5"
              >
                <span className="text-5xl">{currentIngredient.emoji}</span>
                <span className="text-lg font-black text-foreground">{currentIngredient.name}</span>
              </motion.div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Pregunta {(ingredientQIndex % ingredientQuestions.length) + 1}</span>
                {streak > 0 && <Badge className="text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/20">🔥 ×{streak}</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recipeOptions.map((recipe) => (
                <motion.button
                  key={recipe.id}
                  whileTap={{ scale: 0.95 }}
                  disabled={isAnimating}
                  onClick={() => handleRecipePick(recipe.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 transition-all shadow-sm"
                >
                  <span className="text-3xl">{recipe.emoji}</span>
                  <span className="text-xs font-bold text-foreground text-center leading-tight">{recipe.name}</span>
                  {(recipe as any).country && <span className="text-sm">{(recipe as any).country}</span>}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── RECIPE MODE: seleccioná todos los ingredientes de la receta ── */}
        {mode === "recipe" && (
          <>
            <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentRecipe.emoji}</span>
                <div>
                  <h3 className="font-black text-foreground text-lg leading-tight">{currentRecipe.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-semibold">{t("gameModeRecipe")}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      Receta {(recipeIndex % GAME_RECIPES.length) + 1}/{GAME_RECIPES.length}
                    </span>
                    {(currentRecipe as any).country && <span className="text-sm">{(currentRecipe as any).country}</span>}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {currentRecipe.ingredients.map((ing, idx) => {
                  const filled = idx < selectedIngredients.length;
                  const ingredient = INGREDIENTS_POOL.find(i => i.id === ing);
                  return (
                    <motion.div key={ing} animate={filled ? { scale: [1, 1.2, 1] } : {}}
                      className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${filled ? "border-primary bg-primary/10" : "border-border/60 bg-muted/40"}`}>
                      {filled ? (
                        <>
                          <span className="text-2xl">{ingredient?.emoji}</span>
                          <span className="text-[10px] text-primary font-bold mt-0.5 max-w-full px-1 truncate leading-none">{ingredient?.name.split(" ")[0]}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/50 text-xl font-bold">?</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground text-center mb-3 font-semibold">{t("gameSelectIngredient")} 👆</p>
              <div className="grid grid-cols-4 gap-2.5">
                {ingredientOptions.map(ingredient => {
                  const isUsed = selectedIngredients.includes(ingredient.id);
                  return (
                    <motion.button key={ingredient.id} whileTap={!isUsed ? { scale: 0.9 } : {}} disabled={isUsed || isAnimating}
                      onClick={() => handleIngredientPick(ingredient.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${isUsed ? "opacity-25 cursor-not-allowed border-transparent bg-transparent" : "border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer shadow-sm"}`}>
                      <span className="text-2xl leading-none">{ingredient.emoji}</span>
                      <span className="text-xs font-semibold text-foreground w-full text-center truncate leading-tight">{ingredient.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── ORDER MODE: ordenar los pasos ── */}
        {mode === "order" && (
          <div className="space-y-3">
            <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3">
              <span className="text-4xl">{currentRecipe.emoji}</span>
              <div>
                <h3 className="font-black text-foreground text-base">{currentRecipe.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("gameOrderStepsDesc")}</p>
              </div>
            </div>
            {orderSteps.map((step, i) => (
              <motion.div key={step} layout className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground flex-1 leading-tight">{step}</p>
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveStep(i, i - 1)} disabled={i === 0} className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted">
                    <span className="text-xs text-muted-foreground">↑</span>
                  </button>
                  <button onClick={() => moveStep(i, i + 1)} disabled={i === orderSteps.length - 1} className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center disabled:opacity-30 hover:bg-muted">
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
