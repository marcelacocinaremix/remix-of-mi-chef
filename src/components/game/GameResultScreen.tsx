import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, ChefHat, Star, Zap, RotateCcw, Home, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGameStats } from "@/hooks/useGameStats";
import { PLAYER_LEVELS } from "./gameConfig";
import marcelaCharacter from "@/assets/marcela-character.png";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface GameResultScreenProps {
  score: number;
  streak: number;
  recipesCompleted: number;
  xpEarned: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameResultScreen({ score, streak, recipesCompleted, xpEarned, onPlayAgain, onGoHome }: GameResultScreenProps) {
  const { t } = useLanguage();
  const { stats } = useGameStats();
  const isNewHighScore = score > stats.highScore;

  // XP total = recetas completadas históricas * 50 + XP ganada esta partida
  const totalXP = stats.totalRecipesCompleted * 50 + stats.totalGamesPlayed * 20 + xpEarned;
  const currentLevel = PLAYER_LEVELS.reduce((acc, lvl) => totalXP >= lvl.minXP ? lvl : acc, PLAYER_LEVELS[0]);
  const nextLevel = PLAYER_LEVELS.find(l => l.minXP > totalXP);
  const xpProgress = nextLevel ? ((totalXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100;

  useEffect(() => {
    if (recipesCompleted > 0) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, []);

  const isWin = recipesCompleted > 0;

  return (
    <div className="flex flex-col items-center px-4 py-6 space-y-5 min-h-full bg-background overflow-y-auto">
      {/* Hero result */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-center"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl mb-3"
          >
            <img src={marcelaCharacter} alt="Marcela" className="w-full h-full object-cover" />
          </motion.div>
          {isWin && (
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-3 -right-3 text-3xl"
            >
              🏆
            </motion.div>
          )}
        </div>

        <h2 className="text-2xl font-black text-foreground">
          {isWin ? t("gameYouWon") : t("gameGameOver")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {isWin ? t("gameWonDesc") : t("gameLostDesc")}
        </p>
      </motion.div>

      {/* XP Earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-2xl font-black text-primary">+{xpEarned} XP</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("gameXPEarned").replace("{xp}", String(xpEarned))}</p>

        {/* Level progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-foreground">{currentLevel.icon} {t(currentLevel.nameKey as any)}</span>
            {nextLevel && <span className="text-muted-foreground">{totalXP}/{nextLevel.minXP} XP</span>}
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full grid grid-cols-3 gap-3"
      >
        {[
          { icon: Star, value: score, label: t("gameScore"), color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: ChefHat, value: recipesCompleted, label: t("gameRecipesDone"), color: "text-primary", bg: "bg-primary/10" },
          { icon: Flame, value: streak, label: t("gameStreak"), color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map(({ icon: Icon, value, label, color, bg }, i) => (
          <div key={i} className={`${bg} rounded-2xl p-3 text-center border border-border/20`}>
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* New high score */}
      {isNewHighScore && score > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.8 }}
          className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2"
        >
          <Crown className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-amber-600 text-sm">{t("gameNewRecord")}</span>
        </motion.div>
      )}

      {/* All-time stats */}
      {stats.totalGamesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full bg-card rounded-2xl p-3 border border-border/30"
        >
          <p className="text-xs text-muted-foreground text-center mb-2 font-medium">{t("gameAllTimeRecords")}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-black text-foreground">{Math.max(score, stats.highScore)}</div>
              <div className="text-muted-foreground">{t("gameHighScore")}</div>
            </div>
            <div>
              <div className="font-black text-foreground">{stats.totalRecipesCompleted + recipesCompleted}</div>
              <div className="text-muted-foreground">{t("gameRecipesDone")}</div>
            </div>
            <div>
              <div className="font-black text-foreground">{stats.totalGamesPlayed + 1}</div>
              <div className="text-muted-foreground">{t("gamePartidas")}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full space-y-3 pb-4"
      >
        <Button onClick={onPlayAgain} size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-base rounded-2xl">
          <RotateCcw className="w-5 h-5 mr-2" />
          {t("gamePlayAgain")}
        </Button>
        <Button onClick={onGoHome} variant="outline" size="lg" className="w-full rounded-2xl">
          <Home className="w-4 h-4 mr-2" />
          {t("gameBackToMenu")}
        </Button>
      </motion.div>
    </div>
  );
}
