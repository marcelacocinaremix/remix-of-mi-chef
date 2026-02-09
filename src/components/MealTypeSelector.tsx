import { cn } from "@/lib/utils";
import { Sun, Moon, Coffee, Cookie, Zap, PiggyBank, Baby, Snowflake, Salad } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MealTypeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

interface MealType {
  id: string;
  labelKey: "breakfast" | "lunch" | "snack" | "dinner" | "quick" | "economic" | "light" | "forKids" | "forFreezing";
  icon: LucideIcon;
}

// Momento del día
const momentOptions: MealType[] = [
  { id: "desayuno", labelKey: "breakfast", icon: Coffee },
  { id: "almuerzo", labelKey: "lunch", icon: Sun },
  { id: "merienda", labelKey: "snack", icon: Cookie },
  { id: "cena", labelKey: "dinner", icon: Moon },
];

// Tipo de comida
const typeOptions: MealType[] = [
  { id: "rapida", labelKey: "quick", icon: Zap },
  { id: "economica", labelKey: "economic", icon: PiggyBank },
  { id: "liviana", labelKey: "light", icon: Salad },
  { id: "para-chicos", labelKey: "forKids", icon: Baby },
  { id: "para-freezar", labelKey: "forFreezing", icon: Snowflake },
];

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-5">
      {/* Momento del día */}
      <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
        <span className="text-xs font-medium text-foreground mb-2.5 block flex items-center gap-1.5">
          ☀️ {t("timeOfDay")}
        </span>
        <div className="flex flex-wrap gap-2">
          {momentOptions.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onChange(isSelected ? null : type.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full",
                  "border-2 transition-all duration-200",
                  "text-sm font-medium",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {t(type.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tipo de comida */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
        <span className="text-xs font-medium text-foreground mb-2.5 block flex items-center gap-1.5">
          🍽️ {t("mealTypeCategory")}
        </span>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onChange(isSelected ? null : type.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full",
                  "border-2 transition-all duration-200",
                  "text-sm font-medium",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {t(type.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
