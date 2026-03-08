import { motion } from "framer-motion";
import { Trophy, Zap, Star } from "lucide-react";
import { useGameLeaderboard } from "@/hooks/useGameStats";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function GameLeaderboard() {
  const { leaderboard, isLoading } = useGameLeaderboard();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm font-semibold text-foreground mb-1">{t("gameLeaderboardEmpty")}</p>
        <p className="text-xs text-muted-foreground">{t("gameLeaderboardEmptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-4">
      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 py-4 mb-2">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-1"
          >
            <Avatar className="w-12 h-12 border-2 border-muted">
              <AvatarImage src={leaderboard[1].avatarUrl || ""} />
              <AvatarFallback className="bg-muted text-foreground text-sm font-bold">
                {leaderboard[1].displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-lg">🥈</span>
            <span className="text-[10px] font-bold text-foreground truncate max-w-[60px] text-center">
              {leaderboard[1].displayName}
            </span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {leaderboard[1].totalXP} XP
            </Badge>
            <div className="w-14 h-12 bg-muted/60 rounded-t-lg flex items-center justify-center">
              <span className="text-sm font-black text-muted-foreground">2</span>
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center gap-1 -mb-2"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              👑
            </motion.div>
            <Avatar className="w-16 h-16 border-4 border-amber-400 shadow-lg shadow-amber-500/30">
              <AvatarImage src={leaderboard[0].avatarUrl || ""} />
              <AvatarFallback className="bg-amber-500/20 text-amber-700 text-lg font-black">
                {leaderboard[0].displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xl">🥇</span>
            <span className="text-[11px] font-black text-foreground truncate max-w-[70px] text-center">
              {leaderboard[0].displayName}
            </span>
            <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-[10px] px-2">
              {leaderboard[0].totalXP} XP
            </Badge>
            <div className="w-14 h-16 bg-amber-500/20 rounded-t-lg flex items-center justify-center border border-amber-500/30">
              <span className="text-base font-black text-amber-600">1</span>
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <Avatar className="w-12 h-12 border-2 border-amber-700/40">
              <AvatarImage src={leaderboard[2].avatarUrl || ""} />
              <AvatarFallback className="bg-amber-700/10 text-amber-800 text-sm font-bold">
                {leaderboard[2].displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-lg">🥉</span>
            <span className="text-[10px] font-bold text-foreground truncate max-w-[60px] text-center">
              {leaderboard[2].displayName}
            </span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {leaderboard[2].totalXP} XP
            </Badge>
            <div className="w-14 h-10 bg-amber-700/10 rounded-t-lg flex items-center justify-center">
              <span className="text-sm font-black text-amber-800">3</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="space-y-1.5">
        {leaderboard.slice(3).map((entry, i) => {
          const isMe = user?.id === entry.userId;
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                isMe
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/30 border-border/30 hover:bg-muted/50"
              }`}
            >
              <span className="text-sm font-black text-muted-foreground w-6 text-center">
                {RANK_MEDALS[entry.rank] || entry.rank}
              </span>
              <Avatar className="w-8 h-8 border border-border/50">
                <AvatarImage src={entry.avatarUrl || ""} />
                <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                  {entry.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground truncate">
                    {entry.displayName}
                  </span>
                  {isMe && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0">
                      {t("gameLeaderboardYou")}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {entry.totalGamesPlayed} {t("gameLeaderboardGames")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3 h-3 fill-amber-500" />
                <span className="text-xs font-black">{entry.totalXP}</span>
                <span className="text-[10px] text-muted-foreground">XP</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* If current user is not in top 50, show their position */}
      {user && !leaderboard.find(e => e.userId === user.id) && (
        <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border/30 text-center">
          <p className="text-xs text-muted-foreground">{t("gameLeaderboardNotRanked")}</p>
          <p className="text-xs font-semibold text-foreground mt-0.5">{t("gameLeaderboardPlayMore")}</p>
        </div>
      )}
    </div>
  );
}
