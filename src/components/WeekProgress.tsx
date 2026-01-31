import { useMemo } from "react";
import { CheckCircle2, Circle, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface WeekProgressProps {
  totalSlots: number;
  filledSlots: number;
  className?: string;
}

export function WeekProgress({ totalSlots, filledSlots, className }: WeekProgressProps) {
  const percentage = useMemo(() => {
    if (totalSlots === 0) return 0;
    return Math.round((filledSlots / totalSlots) * 100);
  }, [totalSlots, filledSlots]);

  const getMessage = () => {
    if (percentage === 0) return { text: "¡Empezá a planificar tu semana!", emoji: "📝" };
    if (percentage < 25) return { text: "Buen comienzo, ¡seguí así!", emoji: "🌱" };
    if (percentage < 50) return { text: "Vas por buen camino", emoji: "🚀" };
    if (percentage < 75) return { text: "¡Más de la mitad listo!", emoji: "💪" };
    if (percentage < 100) return { text: "¡Ya casi lo tenés!", emoji: "🔥" };
    return { text: "¡Plan completo! Sos un crack", emoji: "🏆" };
  };

  const message = getMessage();

  const getProgressColor = () => {
    if (percentage < 25) return "bg-orange-500";
    if (percentage < 50) return "bg-yellow-500";
    if (percentage < 75) return "bg-blue-500";
    if (percentage < 100) return "bg-emerald-500";
    return "bg-gradient-to-r from-emerald-500 to-teal-500";
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {percentage === 100 ? (
            <Award className="w-5 h-5 text-amber-500" />
          ) : (
            <TrendingUp className="w-5 h-5 text-primary" />
          )}
          <span className="font-medium text-sm">Progreso semanal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{message.emoji}</span>
          <span className="text-lg font-bold text-primary">{percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <Progress 
          value={percentage} 
          className="h-3 bg-secondary"
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats and message */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{message.text}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>{filledSlots}/{totalSlots} comidas</span>
        </div>
      </div>

      {/* Visual slot indicators */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-sm transition-all",
              i < filledSlots 
                ? "bg-primary" 
                : "bg-secondary border border-border/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
