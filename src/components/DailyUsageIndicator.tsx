import { ChefHat } from "lucide-react";
import { useLocalDailyLimit } from "@/hooks/useLocalDailyLimit";
import { cn } from "@/lib/utils";
import { SubscriptionManager } from "@/components/SubscriptionManager";

export function DailyUsageIndicator() {
  const { remaining, limit, isAtLimit, usesToday } = useLocalDailyLimit();

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-sm",
        isAtLimit
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
      )}
    >
      <ChefHat className="h-4 w-4" />
      <span className="text-xs font-medium opacity-70">recetas</span>
      <span className="font-bold">{remaining}/{limit}</span>
      <span className="text-xs font-normal opacity-75">
        {isAtLimit ? "agotadas" : "hoy"}
      </span>
    </div>
  );
}
