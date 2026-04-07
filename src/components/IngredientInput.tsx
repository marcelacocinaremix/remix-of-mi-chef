import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Plus, Package, Check, Trash2, Search } from "lucide-react";
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
import {
  NormalizedIngredient,
  searchIngredients,
  getIngredientById,
  MAX_INGREDIENTS,
} from "@/data/normalizedIngredients";

interface IngredientInputProps {
  ingredients: string[]; // These are now ingredient IDs
  onIngredientsChange: (ingredients: string[]) => void;
}

interface PantryItem {
  id: string;
  ingredient_name: string;
  category: string | null;
}

export function IngredientInput({ ingredients, onIngredientsChange }: IngredientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<NormalizedIngredient[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedPantryItems, setSelectedPantryItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAtMax = ingredients.length >= MAX_INGREDIENTS;

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

  // Update suggestions when input changes
  useEffect(() => {
    if (inputValue.trim().length > 0 && !isAtMax) {
      const results = searchIngredients(inputValue, 20)
        .filter(ing => !ingredients.includes(ing.id));
      setSuggestions(results);
      // Always show dropdown when typing (either results or "add manually" option)
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, ingredients, isAtMax]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    // For pantry items, we use the name as-is (they might not have IDs)
    const newItems = selectedPantryItems.filter(
      ing => !ingredients.includes(ing.toLowerCase())
    );
    const available = MAX_INGREDIENTS - ingredients.length;
    const toAdd = newItems.slice(0, available).map(i => i.toLowerCase());
    if (toAdd.length > 0) {
      onIngredientsChange([...ingredients, ...toAdd]);
    }
    setSelectedPantryItems([]);
    setShowPantryModal(false);
  };

  const selectIngredient = (ing: NormalizedIngredient) => {
    if (isAtMax || ingredients.includes(ing.id)) return;
    onIngredientsChange([...ingredients, ing.id]);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const addManualIngredient = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || isAtMax || ingredients.includes(trimmed)) return;
    onIngredientsChange([...ingredients, trimmed]);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeIngredient = (id: string) => {
    onIngredientsChange(ingredients.filter(i => i !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        selectIngredient(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        selectIngredient(suggestions[0]);
      } else if (inputValue.trim().length >= 2) {
        // No suggestions found → add manually
        addManualIngredient(inputValue);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getDisplayName = (id: string): string => {
    const ing = getIngredientById(id);
    return ing ? ing.name : id;
  };

  const getEmoji = (id: string): string => {
    const ing = getIngredientById(id);
    return ing?.emoji ?? "🍽️";
  };

  const groupedPantryItems = pantryItems.reduce((acc, item) => {
    const category = item.category || 'otros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const categoryEmojis: Record<string, string> = {
    'verduras': '🥬', 'frutas': '🍎', 'carnes': '🥩',
    'lácteos': '🧀', 'granos': '🌾', 'especias': '🌶️', 'otros': '📦'
  };

  const getCategoryLabel = (category: string) => categoryLabels[category] || category;

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-end">
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full",
          ingredients.length === 0 ? "bg-muted text-muted-foreground" :
          isAtMax ? "bg-amber-500/20 text-amber-600" :
          "bg-primary/20 text-primary"
        )}>
          {ingredients.length}/{MAX_INGREDIENTS}
        </span>
      </div>

      <div className="flex gap-2">
        {/* Pantry button */}
        <button
          onClick={() => setShowPantryModal(true)}
          disabled={isAtMax}
          className={cn(
            "h-12 px-4 rounded-xl shrink-0",
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
            "flex items-center justify-center gap-2",
            "hover:from-amber-600 hover:to-orange-600 transition-all duration-300",
            "border-2 border-amber-400/50 hover:border-amber-300",
            "shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40",
            "font-medium",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          title={t('selectFromPantry')}
        >
          <Package className="w-5 h-5" />
          <span className="hidden sm:inline">{t('pantry')}</span>
        </button>

        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              disabled={isAtMax}
              placeholder={isAtMax ? "Máximo alcanzado" : "Buscá un ingrediente..."}
              className={cn(
                "w-full h-12 pl-9 pr-4 rounded-xl",
                "bg-card border-2 border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-300 font-body",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-popover border-2 border-border rounded-xl shadow-xl overflow-hidden animate-fade-in"
            >
              {suggestions.map((ing, index) => (
                <button
                  key={ing.id}
                  onClick={() => selectIngredient(ing)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-accent/50",
                    index === highlightedIndex && "bg-accent/50",
                    "border-b border-border/50"
                  )}
                >
                  <span className="text-lg">{ing.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{ing.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{ing.category}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}

              {/* Manual add option — always shown when typing */}
              {inputValue.trim().length >= 2 && !ingredients.includes(inputValue.trim().toLowerCase()) && (
                <button
                  onClick={() => addManualIngredient(inputValue)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/10"
                >
                  <span className="text-lg">✏️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-primary">
                      Agregar "{inputValue.trim()}"
                    </p>
                    <p className="text-[10px] text-muted-foreground">No está en la lista · agregar igual</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected ingredient chips */}
      {ingredients.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {ingredients.map((id) => (
              <span
                key={id}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                  "bg-primary/10 text-primary border-2 border-primary/20",
                  "text-sm font-medium",
                  "transition-all duration-200 hover:bg-primary/20"
                )}
              >
                <span>{getEmoji(id)}</span>
                <span className="capitalize">{getDisplayName(id)}</span>
                <button
                  onClick={() => removeIngredient(id)}
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
              {isAtMax && (
                <span className="text-xs font-normal text-amber-600 ml-2">
                  (máximo {MAX_INGREDIENTS} ingredientes)
                </span>
              )}
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
                      const wouldExceedMax = !isSelected && selectedPantryItems.length + ingredients.length >= MAX_INGREDIENTS;

                      return (
                        <button
                          key={item.id}
                          onClick={() => !isAlreadyAdded && !wouldExceedMax && togglePantryItem(item.ingredient_name)}
                          disabled={isAlreadyAdded || (!isSelected && wouldExceedMax)}
                          className={cn(
                            "p-3 rounded-xl text-left transition-all duration-200",
                            "border-2 flex items-center gap-2",
                            isAlreadyAdded
                              ? "bg-muted border-muted-foreground/20 opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/10 border-primary text-primary shadow-md"
                                : wouldExceedMax
                                  ? "opacity-40 cursor-not-allowed bg-card border-border"
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
