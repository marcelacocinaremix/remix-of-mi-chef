import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCountryFlag } from "@/data/countries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StreakLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  currentStreak: number;
  longestStreak: number;
  country: string | null;
  rank: number;
}

interface MyStreakData {
  currentStreak: number;
  longestStreak: number;
}

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function StreakLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<StreakLeaderboardEntry[]>([]);
  const [myStreak, setMyStreak] = useState<MyStreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [lbRes, myRes] = await Promise.all([
          supabase.rpc("get_streak_leaderboard" as any),
          user
            ? supabase
                .from("user_streaks")
                .select("current_streak, longest_streak")
                .eq("user_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (lbRes.error) throw lbRes.error;
        if (lbRes.data) {
          setLeaderboard(
            (lbRes.data as any[]).map((row) => ({
              userId: row.user_id,
              displayName: row.display_name || "Chef",
              avatarUrl: row.avatar_url,
              currentStreak: row.current_streak,
              longestStreak: row.longest_streak,
              country: row.country ? getCountryFlag(row.country) : null,
              rank: Number(row.rank),
            }))
          );
        }

        if ((myRes as any).data) {
          const d = (myRes as any).data;
          setMyStreak({
            currentStreak: d.current_streak ?? 0,
            longestStreak: d.longest_streak ?? 0,
          });
        }
      } catch (err) {
        console.error("Error fetching streak leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const userInLeaderboard = user && leaderboard.find((e) => e.userId === user.id);
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Vos";

  // Render inline — no nested component to avoid ref issues
  const renderMyStreakFooter = () => {
    if (!user || userInLeaderboard) return null;
    return (
      <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">{displayName}</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0">yo</Badge>
            </div>
            {myStreak ? (
              <span className="text-[10px] text-muted-foreground">
                Racha actual: {myStreak.currentStreak} días · Mejor: {myStreak.longestStreak} días
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Sin actividad registrada todavía</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-black text-muted-foreground">{myStreak?.currentStreak ?? 0}</span>
          </div>
        </div>
        {(!myStreak || myStreak.currentStreak === 0) && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            ¡Realizá una actividad hoy para aparecer en el ranking! 🔥
          </p>
        )}
      </div>
    );
  };

  if (leaderboard.length === 0) {
    return (
      <div className="space-y-4 pb-2">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-5xl mb-3">🔥</div>
          <p className="text-sm font-semibold text-foreground mb-1">¡Sé el primero!</p>
          <p className="text-xs text-muted-foreground">Nadie tiene racha activa todavía. Empezá hoy.</p>
        </div>
        <MyStreakFooter />
      </div>
    );
  }

  // Top 3 podium
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const PodiumEntry = ({
    entry,
    size = "md",
    barHeight,
  }: {
    entry: StreakLeaderboardEntry;
    size?: "sm" | "md" | "lg";
    barHeight: number;
  }) => {
    const isMe = user?.id === entry.userId;
    const avatarSize = size === "lg" ? "w-16 h-16" : "w-12 h-12";
    const colors = {
      border: entry.rank === 1 ? "border-orange-400 shadow-lg shadow-orange-500/30" : entry.rank === 2 ? "border-muted" : "border-amber-700/40",
      fallback: entry.rank === 1 ? "bg-orange-500/20 text-orange-700" : entry.rank === 2 ? "bg-muted text-foreground" : "bg-amber-700/10 text-amber-800",
      bar: entry.rank === 1 ? "bg-orange-500/20 border border-orange-500/30" : entry.rank === 2 ? "bg-muted/60" : "bg-amber-700/10",
      rankText: entry.rank === 1 ? "text-orange-600" : entry.rank === 2 ? "text-muted-foreground" : "text-amber-800",
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (entry.rank - 1) * 0.1 }}
        className={cn("flex flex-col items-center gap-1", entry.rank === 1 && "-mb-2")}
      >
        {entry.rank === 1 && (
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >
            👑
          </motion.div>
        )}
        <Avatar className={`${avatarSize} border-4 ${colors.border}`}>
          <AvatarImage src={entry.avatarUrl || ""} />
          <AvatarFallback className={`${colors.fallback} ${size === "lg" ? "text-lg font-black" : "text-sm font-bold"}`}>
            {entry.displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-lg">{RANK_MEDALS[entry.rank]}</span>
        <div className="flex items-center gap-1">
          {entry.country && <span className="text-sm">{entry.country}</span>}
          <span className={`${size === "lg" ? "text-[11px] font-black" : "text-[10px] font-bold"} text-foreground truncate max-w-[70px] text-center`}>
            {entry.displayName}
          </span>
          {isMe && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1 py-0">yo</Badge>
          )}
        </div>
        {/* Streak badge */}
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-500" />
          {entry.rank === 1 ? (
            <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/30 text-[10px] px-2">
              {entry.currentStreak} días
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {entry.currentStreak} días
            </Badge>
          )}
        </div>
        <div
          className={`w-14 rounded-t-lg flex items-center justify-center ${colors.bar}`}
          style={{ height: barHeight }}
        >
          <span className={`text-sm font-black ${colors.rankText}`}>{entry.rank}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-2 pb-2">
      {/* Podium */}
      {top3.length >= 2 && (
        <div className="flex items-end justify-center gap-3 py-4 mb-2">
          {top3.length >= 2 && <PodiumEntry entry={top3[1]} size="md" barHeight={48} />}
          <PodiumEntry entry={top3[0]} size="lg" barHeight={64} />
          {top3.length >= 3 && <PodiumEntry entry={top3[2]} size="sm" barHeight={40} />}
        </div>
      )}

      {/* Rest */}
      <div className="space-y-1.5">
        {rest.map((entry, i) => {
          const isMe = user?.id === entry.userId;
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                isMe
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/30 border-border/30 hover:bg-muted/50"
              )}
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
                  {entry.country && <span className="text-sm flex-shrink-0">{entry.country}</span>}
                  <span className="text-xs font-bold text-foreground truncate">{entry.displayName}</span>
                  {isMe && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0">yo</Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Mejor racha: {entry.longestStreak} días
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3 h-3 fill-orange-500" />
                <span className="text-xs font-black">{entry.currentStreak}</span>
                <span className="text-[10px] text-muted-foreground">días</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <MyStreakFooter />
    </div>
  );
}
