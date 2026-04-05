import { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart, Check, Trash2, Plus, Minus,
  Search, ChevronDown, PackageCheck, X, Undo2, Zap, Copy
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useShoppingList, ShoppingListItem } from "@/hooks/useShoppingList";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SuperSmartHistory } from "./SuperSmartHistory";

const CATEGORY_KEYS: Record<string, { emoji: string; order: number; label: string }> = {
  verduras: { emoji: "🥬", order: 1, label: "Verduras" },
  frutas: { emoji: "🍎", order: 2, label: "Frutas" },
  carnes: { emoji: "🥩", order: 3, label: "Carnes" },
  pescados: { emoji: "🐟", order: 4, label: "Pescados" },
  lacteos: { emoji: "🧀", order: 5, label: "Lácteos" },
  huevos: { emoji: "🥚", order: 6, label: "Huevos" },
  almacen: { emoji: "🏪", order: 7, label: "Almacén" },
  panaderia: { emoji: "🍞", order: 8, label: "Panadería" },
  condimentos: { emoji: "🧂", order: 9, label: "Condimentos" },
  bebidas: { emoji: "🥤", order: 10, label: "Bebidas" },
  congelados: { emoji: "🧊", order: 11, label: "Congelados" },
  otros: { emoji: "📦", order: 99, label: "Otros" },
};

const UNIT_OPTIONS = [
  { value: "unidad", label: "ud" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "litros", label: "lt" },
  { value: "ml", label: "ml" },
  { value: "docena", label: "doc" },
  { value: "paquete", label: "paq" },
  { value: "lata", label: "lata" },
  { value: "botella", label: "bot" },
];

const QUICK_ADD = [
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

function AddToPantryDialog({ open, onClose, items, onConfirm }: {
  open: boolean; onClose: () => void; items: ShoppingListItem[];
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map(i => i.id)));

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <PackageCheck className="w-4 h-4 text-primary" />
            Enviar a Despensa
          </DialogTitle>
          <DialogDescription className="text-xs">
            Elegí qué productos agregar a tu despensa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto py-1">
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set(items.map(i => i.id)))} className="text-[10px] h-6">Todos</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())} className="text-[10px] h-6">Ninguno</Button>
          </div>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                selected.has(item.id) ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-transparent"
              )}
            >
              <Checkbox checked={selected.has(item.id)} className="pointer-events-none" />
              <span>{CATEGORY_KEYS[item.category]?.emoji || "📦"}</span>
              <span className="flex-1 truncate">{item.ingredient_name}</span>
              {item.quantity > 1 && <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}><X className="w-3 h-3 mr-1" />Cancelar</Button>
          <Button size="sm" onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0}>
            <PackageCheck className="w-3 h-3 mr-1" />Confirmar ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShoppingListDirect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { items, isLoading, togglePurchased, removeItem, clearPurchased, pendingCount, addItem, updateQuantity, refetch } = useShoppingList();

  const [newItemName, setNewItemName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState("unidad");
  const [selectedCategory, setSelectedCategory] = useState("otros");
  const [catOpen, setCatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [recentlyPurchased, setRecentlyPurchased] = useState<string[]>([]);
  const [showPantryDialog, setShowPantryDialog] = useState(false);
  const [itemsForPantry, setItemsForPantry] = useState<ShoppingListItem[]>([]);

  const purchasedCount = items.filter(i => i.is_purchased).length;
  const totalItems = items.length;

  const { pendingItems, purchasedItems } = useMemo(() => ({
    pendingItems: items.filter(i => !i.is_purchased),
    purchasedItems: items.filter(i => i.is_purchased),
  }), [items]);

  const groupedPending = useMemo(() => {
    return pendingItems.reduce((acc, item) => {
      const cat = item.category?.toLowerCase() || "otros";
      (acc[cat] = acc[cat] || []).push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [pendingItems]);

  const sortedCats = useMemo(() =>
    Object.keys(groupedPending).sort((a, b) =>
      (CATEGORY_KEYS[a]?.order || 99) - (CATEGORY_KEYS[b]?.order || 99)
    ), [groupedPending]);

  const filteredCats = useMemo(() => {
    if (!searchTerm) return sortedCats;
    return sortedCats.filter(cat =>
      groupedPending[cat].some(i => i.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedCats, groupedPending, searchTerm]);

  useEffect(() => {
    if (expandedCategories.size === 0 && sortedCats.length > 0) {
      setExpandedCategories(new Set(sortedCats));
    }
  }, [sortedCats]);

  const toggleCat = (cat: string) => {
    setExpandedCategories(prev => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    await addItem(newItemName.trim(), selectedCategory, newQuantity, newUnit);
    setNewItemName("");
    setNewQuantity(1);
  };

  const handleQuickAdd = async (p: typeof QUICK_ADD[0]) => {
    await addItem(p.name, p.category, 1, p.unit);
    toast({ title: `${p.emoji} Agregado`, description: `${p.name} se agregó a tu lista` });
  };

  const handleToggle = async (item: ShoppingListItem) => {
    await togglePurchased(item.id);
    if (!item.is_purchased) {
      setRecentlyPurchased(prev => [...prev, item.id]);
      setTimeout(() => setRecentlyPurchased(prev => prev.filter(id => id !== item.id)), 5000);
    }
  };

  const handleUndo = async (id: string) => {
    await togglePurchased(id);
    setRecentlyPurchased(prev => prev.filter(i => i !== id));
  };

  const handleFinalize = () => {
    if (purchasedItems.length === 0) {
      toast({ title: "Sin compras", description: "Marcá productos como comprados primero" });
      return;
    }
    setItemsForPantry(purchasedItems);
    setShowPantryDialog(true);
  };

  const handleAddToPantry = async (ids: string[]) => {
    if (!user) return;
    const toAdd = purchasedItems.filter(i => ids.includes(i.id));
    try {
      for (const item of toAdd) {
        await supabase.from("pantry_items").insert({
          user_id: user.id,
          ingredient_name: item.ingredient_name,
          category: item.category,
          source: "shopping_list",
        });
      }
      await clearPurchased();
      toast({ title: "✅ Listo", description: `${ids.length} productos enviados a despensa` });
    } catch {
      toast({ title: "Error", description: "No se pudo enviar a despensa", variant: "destructive" });
    }
    setShowPantryDialog(false);
    setItemsForPantry([]);
  };

  const copyList = () => {
    const text = sortedCats.map(cat => {
      const cfg = CATEGORY_KEYS[cat] || CATEGORY_KEYS.otros;
      const catItems = groupedPending[cat];
      if (!catItems?.length) return null;
      return `${cfg.emoji} ${cfg.label}:\n${catItems.map(i =>
        `  • ${i.quantity > 1 ? `${i.quantity} ${i.unit} ` : ""}${i.ingredient_name}`
      ).join("\n")}`;
    }).filter(Boolean).join("\n\n");
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "📋 Copiado", description: "Lista copiada al portapapeles" });
  };

  const fmt = (item: ShoppingListItem) => {
    if (item.quantity === 1 && item.unit === "unidad") return "";
    return `${item.quantity} ${item.unit}`;
  };

  if (!user) {
    return (
      <Card className="text-center py-8 border-dashed">
        <CardContent>
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Iniciá sesión para usar tu lista</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {/* Compact Add Form */}
      <div className="flex gap-1.5 items-center">
        <Input
          placeholder="Agregar producto..."
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="h-10 text-base flex-1"
        />
        <Select value={newUnit} onValueChange={setNewUnit}>
          <SelectTrigger className="h-10 w-18 text-sm px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center bg-muted/50 rounded-md h-10">
          <button onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))} className="px-2 text-muted-foreground"><Minus className="w-3.5 h-3.5" /></button>
          <span className="text-base font-semibold w-6 text-center">{newQuantity}</span>
          <button onClick={() => setNewQuantity(newQuantity + 1)} className="px-2 text-muted-foreground"><Plus className="w-3.5 h-3.5" /></button>
        </div>
        <Button onClick={handleAdd} disabled={!newItemName.trim()} size="icon" className="h-10 w-10 shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Category selector - compact */}
      <button
        onClick={() => setCatOpen(!catOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span>{CATEGORY_KEYS[selectedCategory]?.emoji} {CATEGORY_KEYS[selectedCategory]?.label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", catOpen && "rotate-180")} />
      </button>
      {catOpen && (
        <div className="flex gap-1.5 flex-wrap animate-fade-in">
          {Object.entries(CATEGORY_KEYS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setSelectedCategory(key); setCatOpen(false); }}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-md transition-all",
                selectedCategory === key ? "bg-primary/15 border border-primary/40 font-semibold" : "bg-muted/40 border border-transparent"
              )}
            >
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
      )}

      {/* Quick add chips - horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {QUICK_ADD.map(p => (
          <button
            key={p.name}
            onClick={() => handleQuickAdd(p)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/40 hover:bg-primary/10 text-sm border border-transparent hover:border-primary/20 transition-all"
          >
            <span>{p.emoji}</span><span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Smart History - collapsible grid */}
      <SuperSmartHistory currentItems={items} />

      {/* Search + Copy (only if many items) */}
      {totalItems > 3 && (
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9 pl-7 text-sm" />
          </div>
          <Button variant="outline" size="icon" onClick={copyList} className="h-8 w-8"><Copy className="w-3.5 h-3.5" /></Button>
        </div>
      )}

      {/* Undo bar */}
      <AnimatePresence>
        {recentlyPurchased.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs"
          >
            <Check className="w-3 h-3 text-emerald-500" />
            <span className="flex-1 text-emerald-700 dark:text-emerald-400">{recentlyPurchased.length} marcado(s)</span>
            <button onClick={() => recentlyPurchased.forEach(id => handleUndo(id))} className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground">
              <Undo2 className="w-3 h-3" />Deshacer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main list */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />)}</div>
      ) : totalItems === 0 ? (
        <div className="text-center py-6">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Tu lista está vacía. Agregá productos arriba.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredCats.map(cat => {
            const cfg = CATEGORY_KEYS[cat] || CATEGORY_KEYS.otros;
            const catItems = searchTerm
              ? groupedPending[cat].filter(i => i.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()))
              : groupedPending[cat];
            if (!catItems?.length) return null;
            const expanded = expandedCategories.has(cat);

            return (
              <div key={cat} className="rounded-lg border border-border/50 overflow-hidden">
                <button onClick={() => toggleCat(cat)} className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-muted/30 transition-colors">
                  <span className="text-base">{cfg.emoji}</span>
                  <span className="text-sm font-semibold flex-1 text-left">{cfg.label}</span>
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">{catItems.length}</Badge>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-2 pb-1.5 space-y-0.5">
                        {catItems.map(item => (
                          <div key={item.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors">
                            <button
                              onClick={() => handleToggle(item)}
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                item.is_purchased ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30 hover:border-primary"
                              )}
                            >
                              {item.is_purchased && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className={cn("flex-1 text-base truncate", item.is_purchased && "line-through opacity-50")}>
                              {item.ingredient_name}
                            </span>
                            {fmt(item) && <span className="text-xs text-muted-foreground">{fmt(item)}</span>}
                            <div className="flex items-center gap-0">
                              <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-0.5 text-muted-foreground" disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                              <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-0.5 text-muted-foreground"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Purchased section */}
          {purchasedItems.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 overflow-hidden">
              <div className="flex items-center gap-2 px-2.5 py-2 bg-emerald-500/5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-1">Comprados</span>
                <Badge className="h-4 text-[9px] px-1.5 bg-emerald-500/20 text-emerald-600 border-0">{purchasedItems.length}</Badge>
              </div>
              <div className="px-2 pb-1.5 space-y-0.5">
                {purchasedItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded-md">
                    <button onClick={() => togglePurchased(item.id)} className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <span className="flex-1 text-sm line-through text-muted-foreground truncate">{item.ingredient_name}</span>
                    <button onClick={() => removeItem(item.id)} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB - Finalizar y Enviar a Despensa */}
      {purchasedItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
          <Button
            onClick={handleFinalize}
            className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg rounded-xl text-sm"
          >
            <PackageCheck className="w-4 h-4" />
            Finalizar y Enviar a Despensa ({purchasedItems.length})
          </Button>
        </div>
      )}

      <AddToPantryDialog
        open={showPantryDialog}
        onClose={() => setShowPantryDialog(false)}
        items={itemsForPantry}
        onConfirm={handleAddToPantry}
      />
    </div>
  );
}
