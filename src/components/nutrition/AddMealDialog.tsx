import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, PenLine, ChefHat, ArrowLeft, Sparkles, Lock } from "lucide-react";
import { MealType, MealLogInsert } from "@/hooks/useMealLogs";
import { MEAL_CONFIG } from "./MealSlot";
import { CommonFoodSearch } from "./CommonFoodSearch";
import { ManualMealEntry } from "./ManualMealEntry";
import { RecipeMealPicker } from "./RecipeMealPicker";
import { AIFoodEstimator } from "./AIFoodEstimator";
import { usePremium } from "@/hooks/usePremium";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  mealDate: string;
  onAddMeal: (meal: MealLogInsert) => Promise<boolean>;
}

type Step = "choose" | "search" | "manual" | "recipe" | "ai";

export function AddMealDialog({
  open,
  onOpenChange,
  mealType,
  mealDate,
  onAddMeal,
}: AddMealDialogProps) {
  const [step, setStep] = useState<Step>("choose");
  const { isPremium } = usePremium();
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
            <span>{config.emoji}</span>
            Agregar a {config.label}
          </DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              ¿Cómo querés agregar tu comida?
            </p>

            {/* AI option — Premium only */}
            {isPremium ? (
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors border-primary/20 bg-primary/5"
                onClick={() => setStep("ai")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Calcular con IA</p>
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">Premium</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">La IA estima las calorías y macros de cualquier alimento</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="opacity-60 cursor-not-allowed border-dashed">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-muted-foreground">Calcular con IA</p>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">🔒 Premium</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Estimación automática de calorías y macros</p>
                  </div>
                </CardContent>
              </Card>
            )}

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

        {step === "ai" && <AIFoodEstimator onAdd={handleAdd} />}
        {step === "search" && <CommonFoodSearch onAdd={handleAdd} />}
        {step === "manual" && <ManualMealEntry onAdd={handleAdd} />}
        {step === "recipe" && <RecipeMealPicker onAdd={handleAdd} />}
      </DialogContent>
    </Dialog>
  );
}
