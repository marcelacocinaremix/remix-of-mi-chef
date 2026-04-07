import { useEffect, useState } from "react";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { ChefHat, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionManager } from "@/components/SubscriptionManager";

export function DailyUsageIndicator() {
  const { user } = useAuth();
  const { dailyUsage, isPremium, refetch } = usePremium();
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  if (!user || !dailyUsage) return null;
  if (isPremium) return null;

  const { remaining, limit } = dailyUsage;
  const used = limit - remaining;
  const isAtLimit = remaining === 0;
  const isLow = remaining <= 1 && remaining > 0;

  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold border",
        isAtLimit
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : isLow
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      )}>
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4" />
          <span className="text-xs font-medium opacity-70">plan gratis</span>
          <span className="font-bold">{used}/{limit}</span>
          <span className="text-xs font-normal opacity-75">
            {isAtLimit ? "agotadas" : "por día"}
          </span>
        </div>
        <button
          onClick={() => setShowManager(true)}
          className="text-xs font-semibold underline opacity-70 hover:opacity-100"
        >
          Ver Premium
        </button>
      </div>

      <SubscriptionManager open={showManager} onOpenChange={setShowManager} />
    </>
  );
}
