import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { MealLog, MealType } from "@/hooks/useMealLogs";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; hint: string; gradient: string; iconBg: string }> = {
  desayuno: {
    label: "Desayuno",
    emoji: "☀️",
    hint: "Empezá el día con energía",
    gradient: "from-amber-500/15 to-orange-500/5",
    iconBg: "bg-amber-500/20 text-amber-600",
  },
  almuerzo: {
    label: "Almuerzo",
    emoji: "🍽️",
    hint: "Tu comida principal del mediodía",
    gradient: "from-emerald-500/15 to-green-500/5",
    iconBg: "bg-emerald-500/20 text-emerald-600",
  },
  merienda: {
    label: "Merienda",
    emoji: "🍪",
    hint: "Un snack para la tarde",
    gradient: "from-purple-500/15 to-violet-500/5",
    iconBg: "bg-purple-500/20 text-purple-600",
  },
  cena: {
    label: "Cena",
    emoji: "🌙",
    hint: "Algo liviano para cerrar el día",
    gradient: "from-blue-500/15 to-indigo-500/5",
    iconBg: "bg-blue-500/20 text-blue-600",
  },
  entre_comidas: {
    label: "Snacks",
    emoji: "🍎",
    hint: "Colaciones durante el día",
    gradient: "from-rose-500/15 to-pink-500/5",
    iconBg: "bg-rose-500/20 text-rose-600",
  },
};

interface MealSlotProps {
  mealType: MealType;
  meals: MealLog[];
  onAddMeal: (mealType: MealType) => void;
  onDeleteMeal: (id: string) => void;
}

export function MealSlot({ mealType, meals, onAddMeal, onDeleteMeal }: MealSlotProps) {
  const config = MEAL_CONFIG[mealType];
  const slotMeals = meals.filter((m) => m.meal_type === mealType);
  const hasMeals = slotMeals.length > 0;

  // Sync expanded state with actual data: auto-expand when meals arrive, auto-collapse when all deleted
  const [expanded, setExpanded] = useState(hasMeals);
  useEffect(() => {
    setExpanded(hasMeals);
  }, [hasMeals]);

  const slotTotals = slotMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories),
      protein: acc.protein + Number(m.protein),
      carbs: acc.carbs + Number(m.carbs),
      fats: acc.fats + Number(m.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className={cn(
      "rounded-xl border border-border/40 overflow-hidden transition-all duration-200",
      hasMeals ? "shadow-sm" : "opacity-80 hover:opacity-100"
    )}>
      {/* Header */}
      <button
        onClick={() => hasMeals ? setExpanded(!expanded) : onAddMeal(mealType)}
        className={cn(
          "w-full flex items-center gap-3 p-3 transition-colors",
          hasMeals ? `bg-gradient-to-r ${config.gradient}` : "bg-card hover:bg-accent/30"
        )}
      >
        <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0", config.iconBg)}>
          {config.emoji}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm">{config.label}</p>
          {hasMeals ? (
            <p className="text-[11px] text-muted-foreground">
              {slotMeals.length} {slotMeals.length === 1 ? "comida" : "comidas"} · {Math.round(slotTotals.calories)} kcal
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">{config.hint}</p>
          )}
        </div>
        {hasMeals ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="text-[10px] h-5 font-bold">
              {Math.round(slotTotals.calories)} kcal
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        ) : (
          <Plus className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && hasMeals && (
        <div className="bg-card border-t border-border/30">
          <div className="divide-y divide-border/30">
            {slotMeals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meal.food_name}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground/70">{Math.round(Number(meal.calories))} kcal</span>
                    <span>P: {Math.round(Number(meal.protein))}g</span>
                    <span>C: {Math.round(Number(meal.carbs))}g</span>
                    <span>G: {Math.round(Number(meal.fats))}g</span>
                    {meal.portion && <span className="text-primary/70">· {meal.portion}</span>}
                  </div>
                </div>
                {/* Delete always visible (not just on hover) — needed for mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); onDeleteMeal(meal.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          {/* Add more */}
          <div className="px-3 py-2 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-primary gap-1.5"
              onClick={() => onAddMeal(mealType)}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar más
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { MEAL_CONFIG };
