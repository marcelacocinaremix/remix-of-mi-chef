import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export function DailyUsageIndicator() {
  const { user } = useAuth();
  const { dailyUsage } = usePremium();

  if (!user || !dailyUsage) return null;

  const { usesToday, remaining, limit } = dailyUsage;
  const isAtLimit = remaining === 0;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
      isAtLimit 
        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" 
        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
    )}>
      <ChefHat className="h-4 w-4" />
      <span>
        {remaining}/{limit} recetas hoy
      </span>
    </div>
  );
}