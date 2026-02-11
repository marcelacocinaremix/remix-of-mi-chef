import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets, CalendarIcon, Target } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { MealType, useMealLogs } from "@/hooks/useMealLogs";
import { MealSlot } from "./MealSlot";
import { AddMealDialog } from "./AddMealDialog";
import { toast } from "sonner";

const MEAL_TYPES: MealType[] = ["desayuno", "almuerzo", "merienda", "cena", "entre_comidas"];

// Daily targets based on fitness goal
function getDailyTargets(goal?: string) {
  switch (goal) {
    case "lose_fat":
      return { calories: 1600, protein: 100, carbs: 150, fats: 50, label: "Bajar de peso" };
    case "gain_muscle":
      return { calories: 2500, protein: 140, carbs: 280, fats: 70, label: "Ganar músculo" };
    case "improve_performance":
      return { calories: 2200, protein: 120, carbs: 260, fats: 65, label: "Mejorar rendimiento" };
    case "stay_active":
    default:
      return { calories: 2000, protein: 80, carbs: 230, fats: 60, label: "Mantener peso" };
  }
}

interface DailyMealLogProps {
  onMealsChanged?: () => void;
  fitnessGoal?: string;
}

export function DailyMealLog({ onMealsChanged, fitnessGoal }: DailyMealLogProps) {
  const {
    dailyMeals,
    dailyTotals,
    selectedDate,
    setSelectedDate,
    addMeal,
    deleteMeal,
  } = useMealLogs();

  const [addMealType, setAddMealType] = useState<MealType | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    if (isToday) return "Hoy";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Ayer";
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  };

  const handleDelete = async (id: string) => {
    const success = await deleteMeal(id);
    if (success) {
      toast.success("Comida eliminada");
      onMealsChanged?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="text-center">
            <p className="font-semibold text-sm">{formatDate(selectedDate)}</p>
            {!isToday && (
              <button
                className="text-[10px] text-primary underline"
                onClick={() => setSelectedDate(today)}
              >
                Volver a hoy
              </button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={new Date(selectedDate + "T12:00:00")}
                onSelect={(date) => {
                  if (date) setSelectedDate(date.toISOString().split("T")[0]);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigateDate(1)}
          disabled={isToday}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Daily totals summary with goal targets */}
      {dailyMeals.length > 0 && (() => {
        const targets = getDailyTargets(fitnessGoal);
        const calPct = Math.min(100, (dailyTotals.calories / targets.calories) * 100);
        const protPct = Math.min(100, (dailyTotals.protein / targets.protein) * 100);
        const carbsPct = Math.min(100, (dailyTotals.carbs / targets.carbs) * 100);
        const fatsPct = Math.min(100, (dailyTotals.fats / targets.fats) * 100);

        return (
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <CardContent className="py-3 px-4">
              {fitnessGoal && (
                <div className="flex items-center gap-1.5 mb-2.5 justify-center">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                    Metas para: {targets.label}
                  </span>
                </div>
              )}
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" /> Calorías
                    </span>
                    <span className="text-xs font-semibold">
                      {Math.round(dailyTotals.calories)} <span className="text-muted-foreground font-normal">/ {targets.calories} kcal</span>
                    </span>
                  </div>
                  <Progress value={calPct} className="h-1.5 [&>div]:bg-orange-500" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Beef className="w-3 h-3 text-chart-1 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">Prot</span>
                    </div>
                    <span className="text-[10px] font-semibold block mb-1">{Math.round(dailyTotals.protein)} / <span className="text-muted-foreground font-normal">{targets.protein}g</span></span>
                    <Progress value={protPct} className="h-1 [&>div]:bg-chart-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Wheat className="w-3 h-3 text-chart-2 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">Carbs</span>
                    </div>
                    <span className="text-[10px] font-semibold block mb-1">{Math.round(dailyTotals.carbs)} / <span className="text-muted-foreground font-normal">{targets.carbs}g</span></span>
                    <Progress value={carbsPct} className="h-1 [&>div]:bg-chart-2" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="w-3 h-3 text-chart-3 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">Grasas</span>
                    </div>
                    <span className="text-[10px] font-semibold block mb-1">{Math.round(dailyTotals.fats)} / <span className="text-muted-foreground font-normal">{targets.fats}g</span></span>
                    <Progress value={fatsPct} className="h-1 [&>div]:bg-chart-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Meal slots */}
      <div className="space-y-2">
        {MEAL_TYPES.map((type) => (
          <MealSlot
            key={type}
            mealType={type}
            meals={dailyMeals}
            onAddMeal={(mt) => setAddMealType(mt)}
            onDeleteMeal={handleDelete}
          />
        ))}
      </div>

      {/* Add meal dialog */}
      {addMealType && (
        <AddMealDialog
          open={!!addMealType}
          onOpenChange={(open) => { if (!open) setAddMealType(null); }}
          mealType={addMealType}
          mealDate={selectedDate}
          onAddMeal={async (meal) => {
            const result = await addMeal(meal);
            if (result) onMealsChanged?.();
            return result;
          }}
        />
      )}
    </div>
  );
}
