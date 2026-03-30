import { useState, useEffect, useMemo } from "react";
import { 
  ShoppingCart, Check, Trash2, Copy, Plus, Minus,
  Star, Sparkles, Trophy, Search, ChevronDown, ChevronUp,
  ListChecks, Package2, CircleCheck, ShoppingBag, ArrowRight,
  PackageCheck, X, Undo2, Clock, TrendingUp, Zap, Lock, Crown
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useShoppingList, ShoppingListItem } from "@/hooks/useShoppingList";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";
import { SuperSmartHistory } from "./SuperSmartHistory";

const CATEGORY_KEYS: Record<string, { emoji: string; order: number; color: string; tKey: string }> = {
  verduras: { emoji: "🥬", order: 1, color: "emerald", tKey: "superCategoryVerduras" },
  frutas: { emoji: "🍎", order: 2, color: "rose", tKey: "superCategoryFrutas" },
  carnes: { emoji: "🥩", order: 3, color: "red", tKey: "superCategoryCarnes" },
  pescados: { emoji: "🐟", order: 4, color: "cyan", tKey: "superCategoryPescados" },
  lacteos: { emoji: "🧀", order: 5, color: "amber", tKey: "superCategoryLacteos" },
  huevos: { emoji: "🥚", order: 6, color: "orange", tKey: "superCategoryHuevos" },
  almacen: { emoji: "🏪", order: 7, color: "amber", tKey: "superCategoryAlmacen" },
  panaderia: { emoji: "🍞", order: 8, color: "yellow", tKey: "superCategoryPanaderia" },
  condimentos: { emoji: "🧂", order: 9, color: "purple", tKey: "superCategoryCondimentos" },
  bebidas: { emoji: "🥤", order: 10, color: "blue", tKey: "superCategoryBebidas" },
  congelados: { emoji: "🧊", order: 11, color: "sky", tKey: "superCategoryCongelados" },
  otros: { emoji: "📦", order: 99, color: "slate", tKey: "superCategoryOtros" },
};

// Keep CATEGORY_CONFIG for backward compatibility (used in AddToPantryDialog before t() is available)
const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; order: number; color: string }> = Object.fromEntries(
  Object.entries(CATEGORY_KEYS).map(([k, v]) => [k, { ...v, label: k }])
);

function getCategoryConfig(key: string, t: (k: any) => string) {
  const base = CATEGORY_KEYS[key];
  if (!base) return { emoji: "📦", label: key, order: 99, color: "slate" };
  return { ...base, label: t(base.tKey as any) };
}

const UNIT_OPTIONS = [
  { value: "unidad", label: "unidad(es)" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "litros", label: "litros" },
  { value: "ml", label: "ml" },
  { value: "docena", label: "docena(s)" },
  { value: "paquete", label: "paquete(s)" },
  { value: "lata", label: "lata(s)" },
  { value: "botella", label: "botella(s)" },
];

const QUICK_ADD_PRODUCTS = [
  { name: "Leche", category: "lacteos", unit: "litros", emoji: "🥛" },
  { name: "Pan", category: "panaderia", unit: "unidad", emoji: "🍞" },
  { name: "Huevos", category: "huevos", unit: "docena", emoji: "🥚" },
  { name: "Tomate", category: "verduras", unit: "kg", emoji: "🍅" },
  { name: "Pollo", category: "carnes", unit: "kg", emoji: "🍗" },
  { name: "Arroz", category: "almacen", unit: "kg", emoji: "🍚" },
  { name: "Aceite", category: "almacen", unit: "litros", emoji: "🫒" },
  { name: "Cebolla", category: "verduras", unit: "kg", emoji: "🧅" },
  { name: "Queso", category: "lacteos", unit: "kg", emoji: "🧀" },
  { name: "Banana", category: "frutas", unit: "kg", emoji: "🍌" },
];

interface AddToPantryDialogProps {
  open: boolean;
  onClose: () => void;
  items: ShoppingListItem[];
  onConfirm: (selectedItems: string[]) => void;
}

function AddToPantryDialog({ open, onClose, items, onConfirm }: AddToPantryDialogProps) {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items.map(i => i.id)));

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedItems(new Set(items.map(i => i.id)));
  const selectNone = () => setSelectedItems(new Set());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" />
            {t("superAddToPantryTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("superAddToPantryDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
              {t("superSelectAll")}
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone} className="text-xs">
              {t("superSelectNone")}
            </Button>
          </div>
          
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                selectedItems.has(item.id) 
                  ? "bg-primary/10 border-2 border-primary/30" 
                  : "bg-muted/50 border-2 border-transparent"
              )}
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox 
                checked={selectedItems.has(item.id)}
                className="pointer-events-none"
              />
              <span className="text-xl">
                {getCategoryConfig(item.category, t)?.emoji || "📦"}
              </span>
              <div className="flex-1">
                <span className="font-medium">{item.ingredient_name}</span>
                {item.quantity > 1 && (
                  <span className="text-sm text-muted-foreground ml-1">
                    ({item.quantity} {item.unit})
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            {t("cancel")}
          </Button>
          <Button 
            onClick={() => onConfirm(Array.from(selectedItems))}
            disabled={selectedItems.size === 0}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <PackageCheck className="w-4 h-4 mr-2" />
            {t("superConfirmPurchase").replace("{count}", String(selectedItems.size))} {selectedItems.size > 0 && `(${selectedItems.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ShoppingStep = "agregar" | "lista" | "confirmar";

export function ShoppingListDirect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { items, isLoading, togglePurchased, removeItem, clearPurchased, pendingCount, addItem, updateQuantity, updateUnit, refetch } = useShoppingList();
  const { canUseFeature } = usePremium();
  const superBlocked = !canUseFeature('balance_add'); // same lock as balance/pantry
  const [showSuperPaywall, setShowSuperPaywall] = useState(false);
  
  const STEPS_CONFIG = [
    { id: "agregar" as ShoppingStep, label: t("superStepAdd"), icon: Plus, description: t("superStepAddDesc") },
    { id: "lista" as ShoppingStep, label: t("superStepMyList"), icon: ListChecks, description: t("superStepMyListDesc") },
    { id: "confirmar" as ShoppingStep, label: t("superStepConfirm"), icon: PackageCheck, description: t("superStepConfirmDesc") },
  ];
  
  // Step state
  const [currentStep, setCurrentStep] = useState<ShoppingStep>("agregar");
  
  // Form state
  const [newItemName, setNewItemName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState("unidad");
  const [selectedCategory, setSelectedCategory] = useState("otros");
  
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showPurchased, setShowPurchased] = useState(false);
  const [recentlyPurchased, setRecentlyPurchased] = useState<string[]>([]);
  
  // Dialog state
  const [showPantryDialog, setShowPantryDialog] = useState(false);
  const [itemsForPantry, setItemsForPantry] = useState<ShoppingListItem[]>([]);

  // Calculate progress
  const purchasedCount = items.filter((i) => i.is_purchased).length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

  // Separate pending and purchased items
  const { pendingItems, purchasedItems } = useMemo(() => {
    const pending = items.filter(i => !i.is_purchased);
    const purchased = items.filter(i => i.is_purchased);
    return { pendingItems: pending, purchasedItems: purchased };
  }, [items]);

  // Group pending items by category
  const groupedPendingItems = useMemo(() => {
    return pendingItems.reduce((acc, item) => {
      const category = item.category?.toLowerCase() || "otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [pendingItems]);

  // Sort categories by order
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedPendingItems).sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a]?.order || 99;
      const orderB = CATEGORY_CONFIG[b]?.order || 99;
      return orderA - orderB;
    });
  }, [groupedPendingItems]);

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return sortedCategories;
    return sortedCategories.filter(category =>
      groupedPendingItems[category].some(item =>
        item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedCategories, groupedPendingItems, searchTerm]);

  // Initialize expanded categories
  useEffect(() => {
    if (expandedCategories.size === 0 && sortedCategories.length > 0) {
      setExpandedCategories(new Set(sortedCategories));
    }
  }, [sortedCategories]);


  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const success = await addItem(newItemName.trim(), selectedCategory, newQuantity, newUnit);
    if (success) {
      setNewItemName("");
      setNewQuantity(1);
      // Ir a la lista después de agregar
      setCurrentStep("lista");
    }
  };

  const handleQuickAdd = async (product: typeof QUICK_ADD_PRODUCTS[0]) => {
    const success = await addItem(product.name, product.category, 1, product.unit);
    if (success) {
      toast({
        title: `${product.emoji} ${t("superAddedToast")}`,
        description: `${product.name} ${t("superAddedToastDesc")}`,
      });
    }
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    await togglePurchased(item.id);
    
    if (!item.is_purchased) {
      // Item was just marked as purchased
      setRecentlyPurchased(prev => [...prev, item.id]);
      
      // Auto-remove from recently purchased after 5 seconds
      setTimeout(() => {
        setRecentlyPurchased(prev => prev.filter(id => id !== item.id));
      }, 5000);
    }
  };

  const handleUndoPurchase = async (itemId: string) => {
    await togglePurchased(itemId);
    setRecentlyPurchased(prev => prev.filter(id => id !== itemId));
  };

  const handleConfirmAllPurchases = () => {
    if (purchasedItems.length === 0) {
      toast({
        title: t("superNoPurchases"),
        description: t("superNoPurchasesDesc"),
      });
      return;
    }
    setItemsForPantry(purchasedItems);
    setShowPantryDialog(true);
  };

  const handleAddToPantry = async (selectedItemIds: string[]) => {
    if (!user) return;
    
    const itemsToAdd = purchasedItems.filter(item => selectedItemIds.includes(item.id));
    
    try {
      for (const item of itemsToAdd) {
        await supabase.from("pantry_items").insert({
          user_id: user.id,
          ingredient_name: item.ingredient_name,
          category: item.category,
          source: "shopping_list",
        });
      }
      
      await clearPurchased();
      
      toast({
        title: t("superPurchaseConfirmed"),
        description: selectedItemIds.length > 0 
          ? t("superPurchaseConfirmedDesc").replace("{count}", String(selectedItemIds.length))
          : t("superListCleaned"),
      });
    } catch (error) {
      console.error("Error adding to pantry:", error);
      toast({
        title: t("error"),
        description: t("superErrorAddPantry"),
        variant: "destructive",
      });
    }
    
    setShowPantryDialog(false);
    setItemsForPantry([]);
  };

  const handleQuantityChange = (itemId: string, delta: number, currentQty: number) => {
    const newQty = Math.max(1, currentQty + delta);
    updateQuantity(itemId, newQty);
  };

  const copyToClipboard = () => {
    const text = sortedCategories
      .map((category) => {
        const config = getCategoryConfig(category, t);
        const categoryItems = groupedPendingItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;
        return `${config.emoji} ${config.label}:\n${categoryItems.map((i) => 
          `  • ${i.quantity > 1 ? `${i.quantity} ${i.unit} de ` : ""}${i.ingredient_name}`
        ).join("\n")}`;
      })
      .filter(Boolean)
      .join("\n\n");

    if (!text) {
      toast({ title: t("superEmptyList"), description: t("superEmptyListDesc") });
      return;
    }

    navigator.clipboard.writeText(text);
    toast({ title: t("superCopied"), description: t("superCopiedDesc") });
  };

  const formatQuantity = (item: ShoppingListItem) => {
    if (item.quantity === 1 && item.unit === "unidad") return "";
    return `${item.quantity} ${item.unit}`;
  };

  if (!user) {
    return (
      <Card className="text-center py-12 animate-fade-in border-dashed">
        <CardContent>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("superLoginTitle")}</h3>
          <p className="text-muted-foreground">{t("superLoginDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <PaywallModal open={showSuperPaywall} onOpenChange={setShowSuperPaywall} />
      {/* Header Card with Stats */}
      <Card className="overflow-hidden border-0 shadow-card bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-display font-bold">{t("superListTitle")}</h2>
                {totalItems > 0 && (
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-muted-foreground">{pendingCount} pend.</span>
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {purchasedCount}</span>
                  </div>
                )}
              </div>
              
              {totalItems > 0 && (
                <div className="mt-1.5">
                  <div className="relative h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        progressPercentage === 100 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                          : "bg-gradient-to-r from-primary to-primary/70"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-xl p-2 border border-border/50">
        <div className="grid grid-cols-3 gap-1.5">
          {STEPS_CONFIG.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const stepNumber = index + 1;
            
            let badge = null;
            if (step.id === "lista" && pendingCount > 0) {
              badge = pendingCount;
            } else if (step.id === "confirmar" && purchasedCount > 0) {
              badge = purchasedCount;
            }
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg font-medium text-[10px] transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/60 hover:bg-background text-foreground"
                )}
              >
                <div className={cn(
                  "absolute -top-1 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border",
                  isActive 
                    ? "bg-accent text-accent-foreground border-primary" 
                    : "bg-muted text-muted-foreground border-background"
                )}>
                  {stepNumber}
                </div>
                
                <Icon className={cn("w-4 h-4", isActive && "animate-pulse")} />
                <span className="truncate">{step.label}</span>
                
                {badge !== null && (
                  <span className={cn(
                    "absolute -top-1 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center",
                    isActive ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PASO 1: Agregar */}
      {currentStep === "agregar" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Add Form */}
          <Card className="border-primary/30 shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t("superNewProduct")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  {t("superWhatToBuy")}
                </label>
                <Input
                  placeholder="Ej: Tomates, Leche, Arroz..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Cantidad
                  </label>
                  <div className="flex items-center bg-muted/50 rounded-xl p-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg"
                      onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-10 text-center border-0 bg-transparent text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg"
                      onClick={() => setNewQuantity(newQuantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Unidad
                  </label>
                  <Select value={newUnit} onValueChange={setNewUnit}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Categoría
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_CONFIG).slice(0, 8).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-xs",
                        selectedCategory === key
                          ? "bg-primary/15 border-2 border-primary/50 scale-105"
                          : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                      )}
                    >
                      <span className="text-lg">{config.emoji}</span>
                      <span className="truncate w-full text-center">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                {t("superAddToList")}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Add Section */}
          <Card className="border-dashed">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground">{t("superQuickAdd")}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {QUICK_ADD_PRODUCTS.map((product, i) => (
                  <motion.button
                    key={product.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleQuickAdd(product)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 hover:bg-primary/10 hover:scale-105 transition-all text-sm border border-transparent hover:border-primary/30"
                  >
                    <span>{product.emoji}</span>
                    <span>{product.name}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Ir a mi lista si hay items */}
          {totalItems > 0 && (
            <Button
              onClick={() => setCurrentStep("lista")}
              variant="outline"
              className="w-full h-11 gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Ver mi lista ({totalItems} productos)
            </Button>
          )}
        </motion.div>
      )}

      {/* PASO 2: Mi Lista */}
      {currentStep === "lista" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Search */}
          {totalItems > 3 && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copiar lista" className="h-11 w-11">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Shopping List Content */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : totalItems === 0 ? (
            <Card className="text-center py-12 border-dashed animate-fade-in">
              <CardContent>
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("superEmptyState")}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                  {t("superEmptyStateDesc")}
                </p>
                <Button onClick={() => setCurrentStep("agregar")} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ir a agregar productos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Recently Purchased Undo Bar */}
              <AnimatePresence>
                {recentlyPurchased.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="flex-1 text-sm text-emerald-700 dark:text-emerald-400">
                      {recentlyPurchased.length} producto(s) marcado(s)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => recentlyPurchased.forEach(id => handleUndoPurchase(id))}
                      className="text-xs h-7"
                    >
                      <Undo2 className="w-3 h-3 mr-1" />
                      Deshacer
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pending Items by Category */}
              {filteredCategories.map((category, categoryIndex) => {
                const config = CATEGORY_CONFIG[category] || { emoji: "📦", label: category, color: "slate" };
                const categoryItems = searchTerm
                  ? groupedPendingItems[category].filter(item =>
                      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  : groupedPendingItems[category];

                if (!categoryItems || categoryItems.length === 0) return null;

                const isExpanded = expandedCategories.has(category);

                return (
                  <motion.div 
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.05 }}
                    className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm"
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-3 p-4 transition-all duration-200 hover:bg-muted/50"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl shadow-sm">
                        {config.emoji}
                      </div>
                      <span className="font-semibold flex-1 text-left">{config.label}</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                        {categoryItems.length}
                      </Badge>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2">
                            {categoryItems.map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                  "group flex items-center gap-3 p-3 rounded-xl transition-all",
                                  "bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20"
                                )}
                              >
                                <button
                                  onClick={() => handleTogglePurchased(item)}
                                  className={cn(
                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                    item.is_purchased
                                      ? "bg-emerald-500 border-emerald-500"
                                      : "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                                  )}
                                >
                                  {item.is_purchased && <Check className="w-4 h-4 text-white" />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <span className={cn(
                                    "font-medium block truncate transition-all",
                                    item.is_purchased && "line-through text-muted-foreground"
                                  )}>
                                    {item.ingredient_name}
                                  </span>
                                  {formatQuantity(item) && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatQuantity(item)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                                    className="w-7 h-7 rounded-lg"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                                    className="w-7 h-7 rounded-lg"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setCurrentStep("agregar")}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar más
                </Button>
                {purchasedCount > 0 && (
                  <Button
                    onClick={() => setCurrentStep("confirmar")}
                    className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                  >
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Confirmar ({purchasedCount})
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* PASO 3: Confirmar */}
      {currentStep === "confirmar" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {purchasedItems.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent>
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-primary/20 flex items-center justify-center">
                  <CircleCheck className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay productos comprados</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                  Primero tachá productos en tu lista como comprados
                </p>
                <Button onClick={() => setCurrentStep("lista")} variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir a mi lista
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Completion Banner */}
              {progressPercentage === 100 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Card className="bg-gradient-to-r from-emerald-500/20 via-primary/10 to-emerald-500/20 border-emerald-500/30 text-center overflow-hidden">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Trophy className="w-7 h-7 text-yellow-500 fill-yellow-500 animate-bounce" />
                        <span className="text-3xl">🎉</span>
                        <Star className="w-7 h-7 text-yellow-500 fill-yellow-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                        ¡Compras completadas!
                      </h3>
                      <p className="text-muted-foreground">
                        Terminaste toda tu lista 🛒
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Purchased Items List */}
              <Card className="border-emerald-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CircleCheck className="w-5 h-5" />
                    Productos comprados
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0">
                      {purchasedItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {purchasedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5"
                    >
                      <button
                        onClick={() => togglePurchased(item.id)}
                        className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <span className="flex-1 text-sm line-through text-muted-foreground">
                        {item.ingredient_name}
                        {formatQuantity(item) && ` (${formatQuantity(item)})`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Confirm Button */}
              <Button 
                onClick={handleConfirmAllPurchases}
                className="w-full h-12 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg text-sm px-3"
              >
                <PackageCheck className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Confirmar y agregar a despensa</span>
              </Button>

              {/* Back to list */}
              <Button
                onClick={() => setCurrentStep("lista")}
                variant="outline"
                className="w-full h-11"
              >
                Volver a mi lista
              </Button>
            </>
          )}
        </motion.div>
      )}

      {/* Smart History - visible en todos los pasos */}
      <SuperSmartHistory 
        currentItems={items}
        onSuggestItem={(name, category) => addItem(name, category, 1, "unidad")}
      />

      {/* Add to Pantry Dialog */}
      <AddToPantryDialog
        open={showPantryDialog}
        onClose={() => setShowPantryDialog(false)}
        items={itemsForPantry}
        onConfirm={handleAddToPantry}
      />
    </div>
  );
}
