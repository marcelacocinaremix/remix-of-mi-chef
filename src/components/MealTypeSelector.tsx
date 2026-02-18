import { cn } from "@/lib/utils";
import { Sun, Moon, Coffee, Cookie, Snowflake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MealTypeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

interface MealType {
  id: string;
  labelKey: "breakfast" | "lunch" | "snack" | "dinner" | "forFreezing";
  icon: LucideIcon;
}

const momentOptions: MealType[] = [
  { id: "desayuno", labelKey: "breakfast", icon: Coffee },
  { id: "almuerzo", labelKey: "lunch", icon: Sun },
  { id: "merienda", labelKey: "snack", icon: Cookie },
  { id: "cena", labelKey: "dinner", icon: Moon },
];

const extraOptions: MealType[] = [
  { id: "para-freezar", labelKey: "forFreezing", icon: Snowflake },
];

const momentIds = momentOptions.map(o => o.id);
const extraIds = extraOptions.map(o => o.id);

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const { t } = useLanguage();
  
  const parseValue = (val: string | null): { moment: string | null; extra: string | null } => {
    if (!val) return { moment: null, extra: null };
    const parts = val.split(",").map(p => p.trim()).filter(Boolean);
    let moment: string | null = null;
    let extra: string | null = null;
    
    for (const part of parts) {
      if (momentIds.includes(part)) moment = part;
      if (extraIds.includes(part)) extra = part;
    }
    
    return { moment, extra };
  };
  
  const { moment: selectedMoment, extra: selectedExtra } = parseValue(value);
  
  const handleMomentSelect = (id: string) => {
    const newMoment = selectedMoment === id ? null : id;
    const combined = [newMoment, selectedExtra].filter(Boolean).join(",");
    onChange(combined || null);
  };
  
  const handleExtraSelect = (id: string) => {
    const newExtra = selectedExtra === id ? null : id;
    const combined = [selectedMoment, newExtra].filter(Boolean).join(",");
    onChange(combined || null);
  };

  const renderButton = (type: MealType, isSelected: boolean, onSelect: (id: string) => void) => {
    const Icon = type.icon;
    return (
      <button
        key={type.id}
        onClick={() => onSelect(type.id)}
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
  };
  
  return (
    <div className="space-y-4">
      {/* Momento del día */}
      <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
        <span className="text-xs font-medium text-foreground mb-2.5 block flex items-center gap-1.5">
          ☀️ {t("timeOfDay")}
        </span>
        <div className="flex flex-wrap gap-2">
          {momentOptions.map((type) => renderButton(type, selectedMoment === type.id, handleMomentSelect))}
        </div>
      </div>

      {/* Extra: Para freezar */}
      <div className="flex flex-wrap gap-2">
        {extraOptions.map((type) => renderButton(type, selectedExtra === type.id, handleExtraSelect))}
      </div>
    </div>
  );
}
