import { cn } from "@/lib/utils";
import { Sun, Moon, Coffee, Cookie } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MealTypeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

interface MealType {
  id: string;
  labelKey: "breakfast" | "lunch" | "snack" | "dinner";
  icon: LucideIcon;
}

const momentOptions: MealType[] = [
  { id: "desayuno", labelKey: "breakfast", icon: Coffee },
  { id: "almuerzo", labelKey: "lunch", icon: Sun },
  { id: "merienda", labelKey: "snack", icon: Cookie },
  { id: "cena", labelKey: "dinner", icon: Moon },
];

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const { t } = useLanguage();
  
  // Extract only the moment part (ignore legacy "para-freezar" in value)
  const selectedMoment = value?.split(",").map(p => p.trim()).find(p => momentOptions.some(o => o.id === p)) ?? null;

  const handleSelect = (id: string) => {
    onChange(selectedMoment === id ? null : id);
  };

  const renderButton = (type: MealType, isSelected: boolean) => {
    const Icon = type.icon;
    return (
      <button
        key={type.id}
        onClick={() => handleSelect(type.id)}
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
    <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
      <span className="text-xs font-medium text-foreground mb-2.5 block flex items-center gap-1.5">
        ☀️ {t("timeOfDay")}
      </span>
      <div className="flex flex-wrap gap-2">
        {momentOptions.map((type) => renderButton(type, selectedMoment === type.id))}
      </div>
    </div>
  );
}
