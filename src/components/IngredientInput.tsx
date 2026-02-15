import { useState, KeyboardEvent, useEffect } from "react";
import { X, Plus, Package, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
}

interface PantryItem {
  id: string;
  ingredient_name: string;
  category: string | null;
}

export function IngredientInput({ ingredients, onIngredientsChange }: IngredientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedPantryItems, setSelectedPantryItems] = useState<string[]>([]);
  const { user } = useAuth();
  const { t } = useLanguage();

  const categoryLabels: Record<string, string> = {
    'verduras': t('vegetables'),
    'frutas': t('fruits'),
    'carnes': t('meats'),
    'lácteos': t('dairy'),
    'granos': t('grains'),
    'especias': t('condiments'),
    'otros': t('others')
  };
  useEffect(() => {
    if (showPantryModal && user) {
      fetchPantryItems();
    }
  }, [showPantryModal, user]);

  const fetchPantryItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pantry_items')
      .select('id, ingredient_name, category')
      .eq('user_id', user.id)
      .order('category');
    if (data) setPantryItems(data);
  };

  const togglePantryItem = (ingredientName: string) => {
    setSelectedPantryItems(prev => 
      prev.includes(ingredientName)
        ? prev.filter(i => i !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  const addSelectedPantryItems = () => {
    const newIngredients = selectedPantryItems.filter(
      ing => !ingredients.includes(ing.toLowerCase())
    );
    if (newIngredients.length > 0) {
      onIngredientsChange([...ingredients, ...newIngredients.map(i => i.toLowerCase())]);
    }
    setSelectedPantryItems([]);
    setShowPantryModal(false);
  };

  const addIngredient = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      onIngredientsChange([...ingredients, trimmed]);
      setInputValue("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(ingredients.filter((i) => i !== ingredient));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient();
    }
  };


  const groupedPantryItems = pantryItems.reduce((acc, item) => {
    const category = item.category || 'otros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const categoryEmojis: Record<string, string> = {
    'verduras': '🥬',
    'frutas': '🍎',
    'carnes': '🥩',
    'lácteos': '🧀',
    'granos': '🌾',
    'especias': '🌶️',
    'otros': '📦'
  };

  const getCategoryLabel = (category: string) => categoryLabels[category] || category;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* Pantry button */}
        <button
          onClick={() => setShowPantryModal(true)}
          className={cn(
            "h-12 px-4 rounded-xl shrink-0",
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
            "flex items-center justify-center gap-2",
            "hover:from-amber-600 hover:to-orange-600 transition-all duration-300",
            "border-2 border-amber-400/50 hover:border-amber-300",
            "shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40",
            "font-medium"
          )}
          title={t('selectFromPantry')}
        >
          <Package className="w-5 h-5" />
          <span className="hidden sm:inline">{t('pantry')}</span>
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ingredientInputPlaceholder')}
            className={cn(
              "w-full h-12 px-4 rounded-xl",
              "bg-card border-2 border-border",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "transition-all duration-300 font-body"
            )}
          />
        </div>
        <button
          onClick={addIngredient}
          disabled={!inputValue.trim()}
          className={cn(
            "h-12 w-12 rounded-xl shrink-0",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "hover:bg-primary/90 transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-soft hover:shadow-card"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {ingredients.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                  "bg-secondary text-secondary-foreground",
                  "text-sm font-medium capitalize",
                  "transition-all duration-200 hover:bg-secondary/80"
                )}
              >
                {ingredient}
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          {ingredients.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => onIngredientsChange([])}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "text-destructive hover:bg-destructive/10 transition-all duration-200"
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Borrar ingredientes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pantry Modal */}
      <Dialog open={showPantryModal} onOpenChange={setShowPantryModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Package className="w-6 h-6 text-amber-500" />
              {t('selectFromPantry')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pantryItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('pantryEmpty')}</p>
                <p className="text-sm">{t('addProductsInPantry')}</p>
              </div>
            ) : (
              Object.entries(groupedPantryItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-semibold capitalize flex items-center gap-2 text-foreground">
                    <span>{categoryEmojis[category] || '📦'}</span>
                    {getCategoryLabel(category)}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => {
                      const isSelected = selectedPantryItems.includes(item.ingredient_name);
                      const isAlreadyAdded = ingredients.includes(item.ingredient_name.toLowerCase());
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isAlreadyAdded && togglePantryItem(item.ingredient_name)}
                          disabled={isAlreadyAdded}
                          className={cn(
                            "p-3 rounded-xl text-left transition-all duration-200",
                            "border-2 flex items-center gap-2",
                            isAlreadyAdded 
                              ? "bg-muted border-muted-foreground/20 opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/10 border-primary text-primary shadow-md"
                                : "bg-card border-border hover:border-primary/50 hover:bg-secondary/50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                            isSelected 
                              ? "bg-primary border-primary" 
                              : "border-muted-foreground/30"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="capitalize text-sm truncate">
                            {item.ingredient_name}
                          </span>
                          {isAlreadyAdded && (
                            <span className="text-xs text-muted-foreground ml-auto">({t('alreadyAdded')})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedPantryItems.length > 0 && (
            <div className="pt-4 border-t border-border">
              <button
                onClick={addSelectedPantryItems}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold",
                  "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                  "hover:from-amber-600 hover:to-orange-600 transition-all",
                  "shadow-lg shadow-amber-500/30",
                  "flex items-center justify-center gap-2"
                )}
              >
                <Plus className="w-5 h-5" />
                {t('addSelected')} {selectedPantryItems.length} {selectedPantryItems.length > 1 ? t('ingredients') : t('ingredients').slice(0, -1)}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
