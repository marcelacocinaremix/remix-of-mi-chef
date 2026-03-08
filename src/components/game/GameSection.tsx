import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, SortAsc, Salad, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGameStats } from "@/hooks/useGameStats";
import { useAchievements } from "@/hooks/useAchievements";
import { GameIntroScreen } from "./GameIntroScreen";
import { GameEngine } from "./GameEngine";
import { GameResultScreen } from "./GameResultScreen";

type GamePhase = "intro" | "modeSelect" | "playing" | "results";

interface GameResult {
  score: number;
  streak: number;
  recipesCompleted: number;
  timePlayed: number;
  xp: number;
}

export function GameSection() {
  const { t } = useLanguage();
  const { saveGameResult } = useGameStats();
  const { unlockGameAchievement } = useAchievements();

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [selectedMode, setSelectedMode] = useState<GameMode>("recipe");
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const modes: { id: GameMode; label: string; icon: React.ElementType; description: string; color: string; bg: string }[] = [
    {
      id: "recipe",
      label: t("gameModeRecipe"),
      icon: ChefHat,
      description: "Elegí los ingredientes correctos de cada receta",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    {
      id: "order",
      label: t("gameModeOrder"),
      icon: SortAsc,
      description: "Ordenar los pasos de preparación",
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "ingredients",
      label: t("gameModeIngredients"),
      icon: Salad,
      description: "Identificá ingredientes clave",
      color: "text-green-500",
      bg: "bg-green-500/10 border-green-500/30",
    },
  ];

  const handleGameEnd = useCallback(async (result: GameResult) => {
    setLastResult(result);
    setPhase("results");
    await saveGameResult(result.score, result.streak, result.recipesCompleted, result.timePlayed);

    // Unlock achievements
    if (result.recipesCompleted >= 3) unlockGameAchievement("game_chef");
    if (result.score >= 200) unlockGameAchievement("game_master");
  }, [saveGameResult, unlockGameAchievement]);

  const handleStart = () => setPhase("modeSelect");
  const handlePlayAgain = () => setPhase("modeSelect");
  const handleGoHome = () => setPhase("intro");
  const handleStartGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setPhase("playing");
  };

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameIntroScreen onStart={handleStart} />
          </motion.div>
        )}

        {phase === "modeSelect" && (
          <motion.div
            key="modeSelect"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-4 py-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setPhase("intro")}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div>
                <h2 className="font-black text-foreground text-lg">{t("gameSelectMode")}</h2>
                <p className="text-xs text-muted-foreground">{t("gameSelectModeDesc")}</p>
              </div>
            </div>

            <div className="space-y-3">
              {modes.map((mode, i) => (
                <motion.button
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleStartGame(mode.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${mode.bg} transition-all text-left hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className={`w-12 h-12 rounded-xl ${mode.bg} flex items-center justify-center flex-shrink-0 border border-current/20`}>
                    <mode.icon className={`w-6 h-6 ${mode.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-black text-base ${mode.color}`}>{mode.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
                  </div>
                  <div className={`text-xl ${mode.color} opacity-60`}>→</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <GameEngine
              mode={selectedMode}
              onClose={() => setPhase("intro")}
              onGameEnd={handleGameEnd}
            />
          </motion.div>
        )}

        {phase === "results" && lastResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameResultScreen
              score={lastResult.score}
              streak={lastResult.streak}
              recipesCompleted={lastResult.recipesCompleted}
              xpEarned={lastResult.xp}
              onPlayAgain={handlePlayAgain}
              onGoHome={handleGoHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
