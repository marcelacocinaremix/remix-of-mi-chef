import { useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreakContext } from "@/contexts/StreakContext";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StreakLeaderboard } from "@/components/StreakLeaderboard";

export function StreakDisplay() {
  const { user } = useAuth();
  const { streakData, isLoading } = useStreakContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!user || isLoading || !streakData) return null;

  const { currentStreak, alreadyActiveToday } = streakData;

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
          currentStreak > 0
            ? "bg-gradient-to-br from-orange-500/15 to-amber-500/10 border-orange-500/30"
            : "bg-muted/30 border-border/40"
        )}
        onClick={() => setShowLeaderboard(true)}
        role="button"
        aria-label="Ver ranking de rachas"
      >
        {/* Left: flame + count */}
        <div className="flex items-center gap-2">
          <Flame
            className={cn(
              "h-5 w-5 transition-colors flex-shrink-0",
              currentStreak > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"
            )}
          />
          <div className="flex flex-col">
            <span
              className={cn(
                "text-base font-black tabular-nums leading-tight",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
              )}
            >
              {currentStreak} {currentStreak === 1 ? "día" : "días"}{" "}
              <span className="text-foreground font-semibold">de racha</span>
            </span>
            <p
              className={cn(
                "text-xs leading-tight",
                alreadyActiveToday ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {alreadyActiveToday
                ? "✅ ¡Racha mantenida hoy!"
                : "Realizá una actividad hoy para mantenerla."}
            </p>
          </div>
        </div>

        {/* Right: ranking button */}
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl px-2.5 py-1.5 flex-shrink-0">
          <Trophy className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-[11px] font-bold text-orange-600">Ranking</span>
        </div>
      </div>

      {/* Leaderboard Sheet */}
      <Sheet open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Flame className="h-5 w-5 text-orange-500" />
              Ranking de Rachas
            </SheetTitle>
          </SheetHeader>
          <StreakLeaderboard />
        </SheetContent>
      </Sheet>
    </>
  );
}
