import { useState } from "react";
import { Copy, Check, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Recipe } from "@/components/RecipeList";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = [
  { name: 'Lunes', short: 'Lun', emoji: '🌙' },
  { name: 'Martes', short: 'Mar', emoji: '🔥' },
  { name: 'Miércoles', short: 'Mié', emoji: '💧' },
  { name: 'Jueves', short: 'Jue', emoji: '⚡' },
  { name: 'Viernes', short: 'Vie', emoji: '🎉' },
  { name: 'Sábado', short: 'Sáb', emoji: '🌟' },
  { name: 'Domingo', short: 'Dom', emoji: '☀️' },
];

interface DuplicateMealDialogProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  currentDay: number;
  currentMeal: 'almuerzo' | 'cena';
  existingSlots: { dayIndex: number; mealType: 'almuerzo' | 'cena' }[];
  onDuplicate: (targets: { dayIndex: number; mealType: 'almuerzo' | 'cena' }[]) => void;
}

export function DuplicateMealDialog({
  open,
  onClose,
  recipe,
  currentDay,
  currentMeal,
  existingSlots,
  onDuplicate,
}: DuplicateMealDialogProps) {
  const [selectedTargets, setSelectedTargets] = useState<{ dayIndex: number; mealType: 'almuerzo' | 'cena' }[]>([]);

  const isSlotOccupied = (dayIndex: number, mealType: 'almuerzo' | 'cena') => {
    return existingSlots.some(slot => slot.dayIndex === dayIndex && slot.mealType === mealType);
  };

  const isCurrentSlot = (dayIndex: number, mealType: 'almuerzo' | 'cena') => {
    return dayIndex === currentDay && mealType === currentMeal;
  };

  const isSelected = (dayIndex: number, mealType: 'almuerzo' | 'cena') => {
    return selectedTargets.some(t => t.dayIndex === dayIndex && t.mealType === mealType);
  };

  const toggleSlot = (dayIndex: number, mealType: 'almuerzo' | 'cena') => {
    if (isCurrentSlot(dayIndex, mealType)) return;
    
    const exists = isSelected(dayIndex, mealType);
    if (exists) {
      setSelectedTargets(prev => prev.filter(t => !(t.dayIndex === dayIndex && t.mealType === mealType)));
    } else {
      setSelectedTargets(prev => [...prev, { dayIndex, mealType }]);
    }
  };

  const handleConfirm = () => {
    if (selectedTargets.length > 0) {
      onDuplicate(selectedTargets);
      setSelectedTargets([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTargets([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Copiar "{recipe?.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Seleccioná los días y comidas donde querés copiar esta receta:
          </p>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, dayIndex) => (
              <div key={day.name} className="space-y-2">
                {/* Day header */}
                <div className="text-center">
                  <span className="text-lg">{day.emoji}</span>
                  <p className="text-xs font-medium">{day.short}</p>
                </div>

                {/* Almuerzo slot */}
                <button
                  onClick={() => toggleSlot(dayIndex, 'almuerzo')}
                  disabled={isCurrentSlot(dayIndex, 'almuerzo')}
                  className={cn(
                    "w-full p-2 rounded-lg border-2 transition-all text-center",
                    isCurrentSlot(dayIndex, 'almuerzo') 
                      ? "border-primary bg-primary/20 opacity-50 cursor-not-allowed"
                      : isSelected(dayIndex, 'almuerzo')
                        ? "border-primary bg-primary/10"
                        : isSlotOccupied(dayIndex, 'almuerzo')
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                          : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <Sun className={cn(
                    "w-4 h-4 mx-auto",
                    isSelected(dayIndex, 'almuerzo') ? "text-primary" : "text-orange-500"
                  )} />
                  {isSelected(dayIndex, 'almuerzo') && (
                    <Check className="w-3 h-3 text-primary mx-auto mt-1" />
                  )}
                </button>

                {/* Cena slot */}
                <button
                  onClick={() => toggleSlot(dayIndex, 'cena')}
                  disabled={isCurrentSlot(dayIndex, 'cena')}
                  className={cn(
                    "w-full p-2 rounded-lg border-2 transition-all text-center",
                    isCurrentSlot(dayIndex, 'cena')
                      ? "border-primary bg-primary/20 opacity-50 cursor-not-allowed"
                      : isSelected(dayIndex, 'cena')
                        ? "border-primary bg-primary/10"
                        : isSlotOccupied(dayIndex, 'cena')
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                          : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <Moon className={cn(
                    "w-4 h-4 mx-auto",
                    isSelected(dayIndex, 'cena') ? "text-primary" : "text-indigo-500"
                  )} />
                  {isSelected(dayIndex, 'cena') && (
                    <Check className="w-3 h-3 text-primary mx-auto mt-1" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-primary bg-primary/20" />
              <span>Origen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
              <span>Seleccionado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-amber-300 bg-amber-50" />
              <span>Ya tiene receta (se reemplazará)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedTargets.length === 0}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar a {selectedTargets.length} {selectedTargets.length === 1 ? 'lugar' : 'lugares'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
