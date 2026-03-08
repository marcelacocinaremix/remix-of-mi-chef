import { useState } from "react";
import { Sun, Moon, Plus, X, Copy, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recipe } from "@/components/RecipeList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MealPlan {
  id?: string;
  dayOfWeek: number;
  mealType: 'almuerzo' | 'cena';
  recipe: Recipe;
}

interface MealSlotDraggableProps {
  meal?: MealPlan;
  mealType: 'almuerzo' | 'cena';
  dayIndex: number;
  onAdd: () => void;
  onView: (recipe: Recipe) => void;
  onRemove: () => void;
  onDuplicate: (recipe: Recipe) => void;
  onDragStart: (meal: MealPlan) => void;
  onDragEnd: () => void;
  onDrop: (dayIndex: number, mealType: 'almuerzo' | 'cena') => void;
  isDragging: boolean;
  draggedMeal: MealPlan | null;
}

export function MealSlotDraggable({
  meal,
  mealType,
  dayIndex,
  onAdd,
  onView,
  onRemove,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  draggedMeal,
}: MealSlotDraggableProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(dayIndex, mealType);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (meal) {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(meal);
    }
  };

  const isDropTarget = isDragging && draggedMeal && 
    !(draggedMeal.dayOfWeek === dayIndex && draggedMeal.mealType === mealType);

  return (
    <div 
      className="flex-1 mb-2"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-1 mb-1">
        {mealType === 'almuerzo' ? (
          <Sun className="w-3 h-3 text-orange-500" />
        ) : (
          <Moon className="w-3 h-3 text-indigo-500" />
        )}
        <span className="text-xs text-muted-foreground capitalize">{mealType}</span>
      </div>
      
      {meal ? (
        <div 
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          className={cn(
            "p-2 rounded-lg cursor-grab active:cursor-grabbing group relative transition-all",
            mealType === 'almuerzo' 
              ? "bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50" 
              : "bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50",
            isOver && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {/* Drag handle */}
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
          
          {/* Action buttons — always visible on touch, hover on desktop */}
          <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(meal.recipe);
              }}
              className="p-1 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 active:scale-90"
              title="Copiar a otro día"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:bg-destructive/90 active:scale-90"
              title="Eliminar"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <p 
            onClick={() => onView(meal.recipe)}
            className="text-xs font-medium text-foreground line-clamp-2 hover:underline cursor-pointer pl-3"
          >
            {meal.recipe.name}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 pl-3">
            {meal.recipe.time} min
          </p>
        </div>
      ) : (
        <button
          onClick={onAdd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "w-full p-2 rounded-lg border-2 border-dashed",
            "text-muted-foreground transition-all flex items-center justify-center gap-1",
            isDropTarget 
              ? "border-primary bg-primary/10 text-primary" 
              : "hover:text-primary hover:border-primary/50",
            isOver && "ring-2 ring-primary ring-offset-2 scale-105"
          )}
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs">{isOver ? "Soltar aquí" : "Agregar"}</span>
        </button>
      )}
    </div>
  );
}
