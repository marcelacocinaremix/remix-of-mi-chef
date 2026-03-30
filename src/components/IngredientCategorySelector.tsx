import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  NORMALIZED_INGREDIENTS,
  INGREDIENT_CATEGORIES_META,
  getIngredientsByCategory,
  MAX_INGREDIENTS,
  NormalizedIngredient,
} from "@/data/normalizedIngredients";

interface IngredientCategorySelectorProps {
  selectedIngredients: string[]; // ingredient IDs
  onIngredientsChange: (ingredients: string[]) => void;
}

export function IngredientCategorySelector({
  selectedIngredients,
  onIngredientsChange,
}: IngredientCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const grouped = getIngredientsByCategory();
  const isAtMax = selectedIngredients.length >= MAX_INGREDIENTS;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleIngredient = (ing: NormalizedIngredient) => {
    if (selectedIngredients.includes(ing.id)) {
      onIngredientsChange(selectedIngredients.filter((i) => i !== ing.id));
    } else if (!isAtMax) {
      onIngredientsChange([...selectedIngredients, ing.id]);
    }
  };

  const isSelected = (id: string) => selectedIngredients.includes(id);

  const getCategorySelectedCount = (items: NormalizedIngredient[]) =>
    items.filter((item) => isSelected(item.id)).length;

  const totalSelected = selectedIngredients.length;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg",
          "bg-secondary/50 hover:bg-secondary/80 transition-all duration-300",
          "border",
          isOpen ? "border-primary/50" : "border-border"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <span className="font-medium text-sm text-foreground">Elegir de la lista</span>
          {totalSelected > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
              {totalSelected}/{MAX_INGREDIENTS}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <ScrollArea className="h-[300px] pr-2 animate-fade-in">
          <div className="space-y-2">
            {Object.entries(grouped).map(([key, items]) => {
              const meta = INGREDIENT_CATEGORIES_META[key];
              if (!meta) return null;
              const isExpanded = expandedCategories.includes(key);
              const selectedCount = getCategorySelectedCount(items);

              return (
                <div key={key} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      "w-full flex items-center justify-between p-3",
                      "bg-card hover:bg-accent/50 transition-colors",
                      "text-left"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {meta.emoji} {meta.label}
                      </span>
                      {selectedCount > 0 && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            meta.color
                          )}
                        >
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 bg-card/50">
                      <div className="flex flex-wrap gap-2 pt-2">
                        {items.map((item) => {
                          const selected = isSelected(item.id);
                          const disabled = !selected && isAtMax;
                          return (
                            <button
                              key={item.id}
                              onClick={() => !disabled && toggleIngredient(item)}
                              disabled={disabled}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium",
                                "border-2 transition-all duration-200",
                                "capitalize",
                                selected
                                  ? cn(meta.color, "border-current")
                                  : disabled
                                    ? "bg-muted/50 border-transparent text-muted-foreground/50 cursor-not-allowed"
                                    : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                              )}
                            >
                              {selected && (
                                <Check className="h-3 w-3 inline-block mr-1" />
                              )}
                              {item.emoji} {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
