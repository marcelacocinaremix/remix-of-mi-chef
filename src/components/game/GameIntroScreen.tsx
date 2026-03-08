import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Trophy, Flame, Zap, ChefHat, Star, Crown, 
  Gamepad2, Timer, SortAsc, Salad, Target 
} from "lucide-react";
import { useGameStats } from "@/hooks/useGameStats";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import marcelaCharacter from "@/assets/marcela-character.png";
import { PLAYER_LEVELS } from "./gameConfig";

interface GameIntroScreenProps {
  onStart: () => void;
}

export function GameIntroScreen({ onStart }: GameIntroScreenProps) {
  const { user } = useAuth();
  const { stats } = useGameStats();
  const { t } = useLanguage();

  // XP total = recetas completadas * 50 + partidas jugadas * 20
  const totalXP = stats.totalRecipesCompleted * 50 + stats.totalGamesPlayed * 20;
  const currentLevel = PLAYER_LEVELS.reduce((acc, lvl) => totalXP >= lvl.minXP ? lvl : acc, PLAYER_LEVELS[0]);
  const nextLevel = PLAYER_LEVELS.find(l => l.minXP > totalXP);
  const xpProgress = nextLevel
    ? ((totalXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  const gameModes = [
    { icon: ChefHat, label: t("gameModeRecipe"), color: "text-primary", bg: "bg-primary/10" },
    { icon: Timer, label: t("gameModeTimer"), color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: SortAsc, label: t("gameModeOrder"), color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Salad, label: t("gameModeIngredients"), color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pb-8 px-1">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden rounded-3xl mb-6 bg-primary shadow-2xl"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-accent/30 blur-2xl" />
          <div className="absolute top-4 left-4 text-white/10 text-6xl">🍳</div>
          <div className="absolute bottom-4 right-8 text-white/10 text-5xl">👨‍🍳</div>
          <div className="absolute top-1/2 right-4 text-white/10 text-4xl">🏆</div>
        </div>

        <div className="relative z-10 p-6 text-center">
          {/* Marcela avatar */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative inline-block mb-4"
          >
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white/40 shadow-xl">
              <img src={marcelaCharacter} alt="Marcela" className="w-full h-full object-cover" />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-2 -right-2 text-2xl"
            >
              ⭐
            </motion.div>
          </motion.div>

          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
            {t("gameTitle")}
          </h1>
          <p className="text-white/80 text-sm mb-5 max-w-xs mx-auto">
            {t("gameSubtitle")}
          </p>

          {/* Game Modes Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {gameModes.map((mode, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-2 flex flex-col items-center gap-1 border border-white/20"
              >
                <mode.icon className="w-5 h-5 text-white" />
                <span className="text-white/90 text-[10px] font-medium leading-tight text-center">{mode.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-white text-primary hover:bg-white/90 font-black text-lg px-10 py-6 rounded-2xl shadow-2xl border-0"
            >
              <Play className="w-6 h-6 mr-2 fill-primary" />
              {t("gamePlay")}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Player Stats Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-card rounded-2xl p-4 border border-border/50 shadow-lg mb-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl shadow">
              {currentLevel.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{t(currentLevel.nameKey as any)}</span>
                {nextLevel && <span className="text-xs text-muted-foreground">{totalXP} / {nextLevel.minXP} XP</span>}
              </div>
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-muted/40 rounded-xl p-2">
              <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{stats.highScore}</div>
              <div className="text-[10px] text-muted-foreground">{t("gameHighScore")}</div>
            </div>
            <div className="text-center bg-muted/40 rounded-xl p-2">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{stats.bestStreak}</div>
              <div className="text-[10px] text-muted-foreground">{t("gameBestStreak")}</div>
            </div>
            <div className="text-center bg-muted/40 rounded-xl p-2">
              <ChefHat className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-black text-foreground">{stats.totalRecipesCompleted}</div>
              <div className="text-[10px] text-muted-foreground">{t("gameRecipesDone")}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Challenge Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{t("gameDailyChallenge")}</span>
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">
              {t("gameNew")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t("gameDailyChallengeDesc")}</p>
        </div>
        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
      </motion.div>
    </div>
  );
}
