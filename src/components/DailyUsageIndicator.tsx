import { useEffect, useState } from "react";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { ChefHat, Flame, Sparkles } from "lucide-react";
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

  const { remaining, limit } = dailyUsage;
  const isAtLimit = remaining === 0;
  const isLow = remaining <= 1 && remaining > 0;

  const planLabel = isPremium ? "plan premium" : "plan gratis";
  const StatusIcon = isPremium ? Sparkles : ChefHat;

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer",
          isAtLimit
            ? "bg-destructive/10 text-destructive border border-destructive/20"
            : isLow
              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
        )}
      >
        {isAtLimit ? (
          <Flame className="h-4 w-4 animate-pulse" />
        ) : (
          <StatusIcon className="h-4 w-4" />
        )}
        <span className="text-xs font-medium opacity-70 capitalize">{planLabel}</span>
        <span className="font-bold">{remaining}/{limit}</span>
        <span className="text-xs font-normal opacity-75">
          {isAtLimit ? "agotadas" : "por día"}
        </span>
      </button>

      <SubscriptionManager open={showManager} onOpenChange={setShowManager} />
    </>
  );
}
