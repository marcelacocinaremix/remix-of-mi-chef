import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { MealType, useMealLogs } from "@/hooks/useMealLogs";
import { MealSlot } from "./MealSlot";
import { AddMealDialog } from "./AddMealDialog";
import { toast } from "sonner";

const MEAL_TYPES: MealType[] = ["desayuno", "almuerzo", "merienda", "cena", "entre_comidas"];

export function DailyMealLog() {
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
    if (success) toast.success("Comida eliminada");
  };

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
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

      {/* Daily totals summary */}
      {dailyMeals.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <Flame className="w-4 h-4 mx-auto mb-0.5 text-accent" />
                <p className="text-sm font-bold">{Math.round(dailyTotals.calories)}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
              <div>
                <Beef className="w-4 h-4 mx-auto mb-0.5 text-chart-1" />
                <p className="text-sm font-bold text-chart-1">{Math.round(dailyTotals.protein)}g</p>
                <p className="text-[10px] text-muted-foreground">Proteínas</p>
              </div>
              <div>
                <Wheat className="w-4 h-4 mx-auto mb-0.5 text-chart-2" />
                <p className="text-sm font-bold text-chart-2">{Math.round(dailyTotals.carbs)}g</p>
                <p className="text-[10px] text-muted-foreground">Carbos</p>
              </div>
              <div>
                <Droplets className="w-4 h-4 mx-auto mb-0.5 text-chart-3" />
                <p className="text-sm font-bold text-chart-3">{Math.round(dailyTotals.fats)}g</p>
                <p className="text-[10px] text-muted-foreground">Grasas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          onAddMeal={addMeal}
        />
      )}
    </div>
  );
}
