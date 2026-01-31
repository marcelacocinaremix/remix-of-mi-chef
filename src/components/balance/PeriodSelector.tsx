import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";

export type BalancePeriod = "week" | "month" | "year";

interface PeriodSelectorProps {
  value: BalancePeriod;
  onChange: (period: BalancePeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const periods: { id: BalancePeriod; label: string; icon: React.ReactNode }[] = [
    { id: "week", label: "Semana", icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: "month", label: "Mes", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "year", label: "Año", icon: <CalendarRange className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex p-1 bg-muted/50 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onChange(period.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
            value === period.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.icon}
          {period.label}
        </button>
      ))}
    </div>
  );
}
