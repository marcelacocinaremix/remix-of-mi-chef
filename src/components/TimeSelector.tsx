import { cn } from "@/lib/utils";
import { Clock, Zap, Timer, Coffee, ChefHat } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  const { t } = useLanguage();
  
  const timeOptions = [
    { label: "15 min", value: 15, descriptionKey: "ultraFast" as const, icon: Zap, emoji: "⚡" },
    { label: "30 min", value: 30, descriptionKey: "fast" as const, icon: Timer, emoji: "🔥" },
    { label: "45 min", value: 45, descriptionKey: "moderate" as const, icon: Coffee, emoji: "☕" },
    { label: "60+ min", value: 60, descriptionKey: "relaxed" as const, icon: ChefHat, emoji: "👨‍🍳" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {timeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full",
              "border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <span className="text-base">{option.emoji}</span>
            <span className={cn(
              "font-medium text-sm",
              isSelected && "text-primary"
            )}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
