import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { ChefHat, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function DailyUsageIndicator() {
  const { user } = useAuth();
  const { dailyUsage, isPremium } = usePremium();
  const { t } = useLanguage();

  if (!user || !dailyUsage) return null;

  const { remaining, limit } = dailyUsage;
  const isAtLimit = remaining === 0;
  const isLow = remaining <= 1 && remaining > 0;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm",
      isAtLimit 
        ? "bg-destructive/10 text-destructive border border-destructive/20" 
        : isLow
          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
    )}>
      {isAtLimit ? (
        <Flame className="h-4 w-4 animate-pulse" />
      ) : (
        <ChefHat className="h-4 w-4" />
      )}
      <span>
        {remaining}/{limit}
      </span>
      <span className="text-xs font-normal opacity-75">
        {isPremium ? "premium" : "gratis"}
      </span>
    </div>
  );
}