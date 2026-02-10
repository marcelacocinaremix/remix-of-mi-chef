import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Coffee, UtensilsCrossed, Cookie, Moon, Apple } from "lucide-react";
import { MealLog, MealType } from "@/hooks/useMealLogs";

const MEAL_CONFIG: Record<MealType, { label: string; icon: React.ReactNode; hint: string; color: string }> = {
  desayuno: {
    label: "Desayuno",
    icon: <Coffee className="w-4 h-4" />,
    hint: "Empezá el día con energía",
    color: "text-amber-500",
  },
  almuerzo: {
    label: "Almuerzo",
    icon: <UtensilsCrossed className="w-4 h-4" />,
    hint: "Tu comida principal del mediodía",
    color: "text-emerald-500",
  },
  merienda: {
    label: "Merienda",
    icon: <Cookie className="w-4 h-4" />,
    hint: "Un snack para la tarde",
    color: "text-purple-500",
  },
  cena: {
    label: "Cena",
    icon: <Moon className="w-4 h-4" />,
    hint: "Algo liviano para cerrar el día",
    color: "text-blue-500",
  },
  entre_comidas: {
    label: "Entre comidas",
    icon: <Apple className="w-4 h-4" />,
    hint: "Colaciones y snacks durante el día",
    color: "text-rose-500",
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
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            <span className="font-medium text-sm">{config.label}</span>
            {slotMeals.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {Math.round(slotTotals.calories)} kcal
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-primary"
            onClick={() => onAddMeal(mealType)}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </div>

        {slotMeals.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pl-6">{config.hint}</p>
        ) : (
          <div className="space-y-1.5 pl-6">
            {slotMeals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between py-1 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{meal.food_name}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{Math.round(Number(meal.calories))} kcal</span>
                    <span>P:{Math.round(Number(meal.protein))}g</span>
                    <span>C:{Math.round(Number(meal.carbs))}g</span>
                    <span>G:{Math.round(Number(meal.fats))}g</span>
                    {meal.portion && <span>• {meal.portion}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => onDeleteMeal(meal.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { MEAL_CONFIG };
