import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/hooks/useAuth";

export function StreakDisplay() {
  const { user } = useAuth();
  const { streakData, isLoading } = useStreak();

  if (!user || isLoading || !streakData) return null;

  const { currentStreak, alreadyActiveToday } = streakData;

  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all",
      currentStreak > 0
        ? "bg-gradient-to-br from-orange-500/15 to-amber-500/10 border-orange-500/30"
        : "bg-muted/30 border-border/40"
    )}>
      <div className="flex items-center gap-2">
        <Flame className={cn(
          "h-5 w-5 transition-colors",
          currentStreak > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-lg font-black tabular-nums",
          currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
        )}>
          {currentStreak} {currentStreak === 1 ? "día" : "días"}
        </span>
        <span className="text-sm font-semibold text-foreground">de racha</span>
      </div>
      <p className={cn(
        "text-xs text-center leading-tight",
        alreadyActiveToday ? "text-emerald-600" : "text-muted-foreground"
      )}>
        {alreadyActiveToday
          ? "✅ ¡Racha mantenida hoy!"
          : "Realizá una actividad hoy para mantener tu racha."}
      </p>
    </div>
  );
}
