import { useState } from "react";
import { ShoppingCart, ArrowLeft, Check, Copy, Printer, Sparkles, Package, Star, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShoppingListProps {
  shoppingList: Record<string, string[]>;
  pantryItems?: string[];
  onBack: () => void;
}

export function ShoppingList({ shoppingList, pantryItems = [], onBack }: ShoppingListProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);

  const toggleItem = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  // Normalize items for comparison
  const normalizedPantry = pantryItems.map(item => item.toLowerCase().trim());

  const isInPantry = (item: string): boolean => {
    const itemLower = item.toLowerCase();
    return normalizedPantry.some(pantryItem => 
      itemLower.includes(pantryItem) || pantryItem.includes(itemLower.split(' ').pop() || '')
    );
  };

  // Filter shopping list based on pantry
  const getFilteredList = (): Record<string, { item: string; inPantry: boolean }[]> => {
    const result: Record<string, { item: string; inPantry: boolean }[]> = {};
    
    Object.entries(shoppingList).forEach(([category, items]) => {
      const processedItems = items.map(item => ({
        item,
        inPantry: isInPantry(item)
      }));

      if (showOnlyMissing) {
        const missingItems = processedItems.filter(i => !i.inPantry);
        if (missingItems.length > 0) {
          result[category] = missingItems;
        }
      } else {
        result[category] = processedItems;
      }
    });

    return result;
  };

  const filteredList = getFilteredList();

  const copyToClipboard = () => {
    const text = Object.entries(filteredList)
      .map(([category, items]) => `${category}:\n${items.map(i => `- ${i.item}`).join('\n')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast({
      title: `🎉 ${t("listCopied")}`,
      description: t("listCopiedDesc"),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = Object.values(filteredList).flat().length;
  const checkedCount = Array.from(checkedItems).filter(item => {
    return Object.values(filteredList).flat().some(i => `${i.item}` === item.split('-').slice(1).join('-'));
  }).length;

  const pantryItemsCount = Object.values(shoppingList).flat().filter(item => isInPantry(item)).length;
  const progressPercentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'Verduras': '🥬',
      'Frutas': '🍎',
      'Carnes': '🥩',
      'Pescados': '🐟',
      'Lácteos': '🧀',
      'Huevos': '🥚',
      'Almacén': '🏪',
      'Panadería': '🍞',
      'Condimentos': '🧂',
      'Bebidas': '🥤',
      'Congelados': '🧊',
      'Otros': '📦'
    };
    return emojis[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Verduras': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
      'Frutas': 'from-red-500/20 to-red-600/10 border-red-500/30',
      'Carnes': 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
      'Pescados': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      'Lácteos': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
      'Huevos': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
      'Almacén': 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
      'Panadería': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
      'Condimentos': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      'Bebidas': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
      'Congelados': 'from-sky-500/20 to-sky-600/10 border-sky-500/30',
      'Otros': 'from-gray-500/20 to-gray-600/10 border-gray-500/30'
    };
    return colors[category] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
  };

  return (
    <div className="animate-slide-up space-y-6 print:p-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-primary/10 transition-all hover:scale-105">
          <ArrowLeft className="w-4 h-4" />
          {t("backToMenu")}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105">
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">{t("copy")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t("print")}</span>
          </Button>
        </div>
      </div>

      <div className={cn(
        "relative bg-gradient-to-br from-card via-primary/5 to-accent/5 rounded-3xl p-6",
        "shadow-xl border-2 border-primary/20 overflow-hidden",
        "print:shadow-none print:border-none"
      )}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-8 text-3xl opacity-20 animate-float">🛒</div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-primary via-emerald-500 to-accent bg-clip-text text-transparent">
                {t("shoppingListTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {totalItems} {t("itemsTotal")}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          {totalItems > 0 && (
            <div className="mb-6 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {t("shoppingProgress")}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  progressPercentage === 100 ? "text-emerald-500" : "text-primary"
                )}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-primary to-emerald-400 rounded-full transition-all duration-700 animate-rainbow"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {checkedCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  {checkedCount} {t("itemsMarked")} {totalItems} {t("itemsMarkedSuffix")}
                </p>
              )}
            </div>
          )}

          {/* Smart filter toggle */}
          {pantryItems.length > 0 && (
            <div className="mb-6 print:hidden">
              <button
                onClick={() => setShowOnlyMissing(!showOnlyMissing)}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-xl",
                  "border-2 transition-all duration-500 text-sm font-medium",
                  "hover:scale-[1.02] hover:shadow-lg",
                  showOnlyMissing
                    ? "border-primary bg-gradient-to-r from-primary/20 to-accent/10 text-primary shadow-md"
                    : "border-border bg-background hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  showOnlyMissing ? "bg-primary/20" : "bg-muted"
                )}>
                  <Sparkles className={cn("w-4 h-4", showOnlyMissing ? "text-primary animate-pulse" : "text-muted-foreground")} />
                </div>
                <span>{t("smartList")}</span>
                {showOnlyMissing && pantryItemsCount > 0 && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 animate-heartbeat">
                    -{pantryItemsCount} items
                  </Badge>
                )}
              </button>
              {showOnlyMissing && pantryItemsCount > 0 && (
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2 pl-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span>{pantryItemsCount} {t("itemsInPantry")}</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </p>
              )}
            </div>
          )}

          {/* Shopping list items */}
          <div className="space-y-6">
            {Object.entries(filteredList).map(([category, items], categoryIndex) => (
              items.length > 0 && (
                <div 
                  key={category} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                  <div className={cn(
                    "flex items-center gap-3 mb-3 p-3 rounded-xl bg-gradient-to-r border",
                    getCategoryColor(category)
                  )}>
                    <span className="text-2xl animate-swing">{getCategoryEmoji(category)}</span>
                    <h3 className="font-display font-bold text-foreground flex-1">
                      {category}
                    </h3>
                    <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm">
                      {items.filter(i => !i.inPantry && !checkedItems.has(`${category}-${i.item}`)).length}/{items.length}
                    </Badge>
                  </div>
                  <div className="grid gap-2 pl-2">
                    {items.map((itemData, index) => {
                      const itemKey = `${category}-${itemData.item}`;
                      const isChecked = checkedItems.has(itemKey);
                      
                      return (
                        <label
                          key={index}
                          className={cn(
                            "relative flex items-center gap-4 p-4 rounded-xl cursor-pointer group",
                            "transition-all duration-300 overflow-hidden",
                            "hover:shadow-lg print:hover:bg-transparent",
                            isChecked 
                              ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 scale-[0.98]" 
                              : "bg-card border border-border/50 hover:border-primary/30 hover:scale-[1.01]",
                            itemData.inPantry && "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5"
                          )}
                          style={{ animationDelay: `${(categoryIndex * 100) + (index * 50)}ms` }}
                        >
                          {/* Hover glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className={cn(
                            "relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300",
                            (isChecked || itemData.inPantry) 
                              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md" 
                              : "bg-muted/50 group-hover:bg-primary/20"
                          )}>
                            <Checkbox
                              checked={isChecked || itemData.inPantry}
                              onCheckedChange={() => toggleItem(itemKey)}
                              className={cn(
                                "print:hidden border-2",
                                (isChecked || itemData.inPantry) ? "border-white" : "border-primary/50"
                              )}
                              disabled={itemData.inPantry}
                            />
                          </div>
                          
                          <span className={cn(
                            "relative z-10 flex-1 font-medium transition-all duration-300",
                            (isChecked || itemData.inPantry) && "line-through text-emerald-600/70"
                          )}>
                            {itemData.item}
                          </span>
                          
                          {itemData.inPantry && (
                            <Badge className="relative z-10 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs print:hidden border-0 shadow-md animate-pulse">
                              <Package className="w-3 h-3 mr-1" />
                              {t("inPantry")}
                            </Badge>
                          )}
                          {isChecked && !itemData.inPantry && (
                            <div className="relative z-10 flex items-center gap-1 text-emerald-500 animate-fade-in print:hidden">
                              <Check className="w-5 h-5" />
                              <span className="text-xs font-medium">{t("done")}</span>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Empty state */}
          {totalItems === 0 && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center mx-auto">
                  <Package className="w-12 h-12 text-emerald-500 animate-float" />
                </div>
                <Trophy className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-heartbeat" />
              </div>
              <p className="text-xl font-bold text-foreground mb-2">{t("youHaveEverything")}</p>
              <p className="text-muted-foreground">{t("allInPantry")}</p>
            </div>
          )}

          {/* Completion celebration */}
          {checkedCount === totalItems && totalItems > 0 && (
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-primary/10 to-emerald-500/20 border border-emerald-500/30 text-center print:hidden animate-scale-in">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-heartbeat" />
                <span className="text-2xl">🎉</span>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />
              </div>
              <p className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-primary bg-clip-text text-transparent">
                {t("listComplete")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("readyToCook")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}