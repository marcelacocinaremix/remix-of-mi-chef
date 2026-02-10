import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, PenLine, ChefHat, ArrowLeft } from "lucide-react";
import { MealType, MealLogInsert } from "@/hooks/useMealLogs";
import { MEAL_CONFIG } from "./MealSlot";
import { CommonFoodSearch } from "./CommonFoodSearch";
import { ManualMealEntry } from "./ManualMealEntry";
import { RecipeMealPicker } from "./RecipeMealPicker";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  mealDate: string;
  onAddMeal: (meal: MealLogInsert) => Promise<boolean>;
}

type Step = "choose" | "search" | "manual" | "recipe";

export function AddMealDialog({
  open,
  onOpenChange,
  mealType,
  mealDate,
  onAddMeal,
}: AddMealDialogProps) {
  const [step, setStep] = useState<Step>("choose");
  const config = MEAL_CONFIG[mealType];

  const handleAdd = async (meal: Omit<MealLogInsert, "meal_type" | "meal_date">) => {
    const success = await onAddMeal({
      ...meal,
      meal_type: mealType,
      meal_date: mealDate,
    });
    if (success) {
      setStep("choose");
      onOpenChange(false);
    }
    return success;
  };

  const handleClose = (v: boolean) => {
    if (!v) setStep("choose");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "choose" && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep("choose")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <span className={config.color}>{config.icon}</span>
            Agregar a {config.label}
          </DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              ¿Cómo querés agregar tu comida?
            </p>
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setStep("search")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Buscar comida</p>
                  <p className="text-xs text-muted-foreground">Buscá entre comidas comunes con datos nutricionales</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setStep("manual")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cargar manualmente</p>
                  <p className="text-xs text-muted-foreground">Ingresá el nombre y los datos nutricionales</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setStep("recipe")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Desde recetas de la app</p>
                  <p className="text-xs text-muted-foreground">Elegí una receta generada por la app</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "search" && <CommonFoodSearch onAdd={handleAdd} />}
        {step === "manual" && <ManualMealEntry onAdd={handleAdd} />}
        {step === "recipe" && <RecipeMealPicker onAdd={handleAdd} />}
      </DialogContent>
    </Dialog>
  );
}
