import { useState, useEffect } from "react";
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

const momentIds = momentOptions.map(o => o.id);
const typeIds = typeOptions.map(o => o.id);

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const { t } = useLanguage();
  
  // Parse the combined value into separate states
  const parseValue = (val: string | null): { moment: string | null; type: string | null } => {
    if (!val) return { moment: null, type: null };
    const parts = val.split(",").map(p => p.trim()).filter(Boolean);
    let moment: string | null = null;
    let type: string | null = null;
    
    for (const part of parts) {
      if (momentIds.includes(part)) moment = part;
      if (typeIds.includes(part)) type = part;
    }
    
    return { moment, type };
  };
  
  const { moment: selectedMoment, type: selectedType } = parseValue(value);
  
  const handleMomentSelect = (id: string) => {
    const newMoment = selectedMoment === id ? null : id;
    const combined = [newMoment, selectedType].filter(Boolean).join(",");
    onChange(combined || null);
  };
  
  const handleTypeSelect = (id: string) => {
    const newType = selectedType === id ? null : id;
    const combined = [selectedMoment, newType].filter(Boolean).join(",");
    onChange(combined || null);
  };
  
  return (
    <div className="space-y-4">
      {/* Momento del día */}
      <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
        <span className="text-xs font-medium text-foreground mb-2.5 block flex items-center gap-1.5">
          ☀️ {t("timeOfDay")}
        </span>
        <div className="flex flex-wrap gap-2">
          {momentOptions.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedMoment === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleMomentSelect(type.id)}
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
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
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
