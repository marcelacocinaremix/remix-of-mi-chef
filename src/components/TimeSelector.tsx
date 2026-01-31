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
    { label: "15 min", value: 15, descriptionKey: "ultraFast" as const, icon: Zap, color: "from-emerald-500 to-green-500", emoji: "⚡" },
    { label: "30 min", value: 30, descriptionKey: "fast" as const, icon: Timer, color: "from-amber-500 to-orange-500", emoji: "🔥" },
    { label: "45 min", value: 45, descriptionKey: "moderate" as const, icon: Coffee, color: "from-primary to-pink-light", emoji: "👨‍🍳" },
    { label: "60+ min", value: 60, descriptionKey: "relaxed" as const, icon: ChefHat, color: "from-purple-500 to-indigo-500", emoji: "✨" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {timeOptions.map((option, index) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl overflow-hidden",
              "border-2 transition-all duration-300 group",
              "hover:shadow-lg hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-border bg-card hover:border-primary/50"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Gradient background when selected */}
            {isSelected && (
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-10",
                option.color
              )} />
            )}
            
            {/* Animated glow effect */}
            {isSelected && (
              <div className="absolute inset-0 animate-pulse-glow rounded-xl" style={{ animationDuration: '2s' }} />
            )}
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              {/* Icon with animation */}
              <div className={cn(
                "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                isSelected 
                  ? `bg-gradient-to-br ${option.color} shadow-lg`
                  : "bg-muted group-hover:bg-primary/10"
              )}>
                <Icon
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isSelected 
                      ? "text-white animate-bounce" 
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                  style={{ animationDuration: '1s' }}
                />
                
                {/* Floating emoji */}
                <span className={cn(
                  "absolute -top-1 -right-1 text-lg transition-all duration-300",
                  isSelected ? "animate-float scale-100" : "scale-0 group-hover:scale-75"
                )}>
                  {option.emoji}
                </span>
              </div>
              
              <span
                className={cn(
                  "font-semibold text-lg font-display transition-all duration-300",
                  isSelected 
                    ? `bg-gradient-to-r ${option.color} bg-clip-text text-transparent` 
                    : "text-foreground"
                )}
              >
                {option.label}
              </span>
              <span className={cn(
                "text-xs transition-colors duration-300",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {t(option.descriptionKey)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}