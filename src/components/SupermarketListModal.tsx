import { useState, useEffect } from "react";
import { 
  ShoppingCart, Check, Trash2, Package, Copy, Plus, Minus, 
  Star, Sparkles, Trophy, Gift, ChefHat, Heart, TrendingUp,
  X, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useShoppingList, ShoppingListItem } from "@/hooks/useShoppingList";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface SupermarketListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; order: number; color: string }> = {
  verduras: { emoji: "🥬", label: "Verduras", order: 1, color: "bg-green-100 text-green-700 border-green-200" },
  frutas: { emoji: "🍎", label: "Frutas", order: 2, color: "bg-red-100 text-red-700 border-red-200" },
  carnes: { emoji: "🥩", label: "Carnes", order: 3, color: "bg-rose-100 text-rose-700 border-rose-200" },
  pescados: { emoji: "🐟", label: "Pescados", order: 4, color: "bg-blue-100 text-blue-700 border-blue-200" },
  lacteos: { emoji: "🧀", label: "Lácteos", order: 5, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  huevos: { emoji: "🥚", label: "Huevos", order: 6, color: "bg-amber-100 text-amber-700 border-amber-200" },
  almacen: { emoji: "🏪", label: "Almacén", order: 7, color: "bg-orange-100 text-orange-700 border-orange-200" },
  panaderia: { emoji: "🍞", label: "Panadería", order: 8, color: "bg-amber-100 text-amber-700 border-amber-200" },
  condimentos: { emoji: "🧂", label: "Condimentos", order: 9, color: "bg-purple-100 text-purple-700 border-purple-200" },
  bebidas: { emoji: "🥤", label: "Bebidas", order: 10, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  congelados: { emoji: "🧊", label: "Congelados", order: 11, color: "bg-sky-100 text-sky-700 border-sky-200" },
  otros: { emoji: "📦", label: "Otros", order: 99, color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const SUGGESTED_PRODUCTS = [
  { name: "Huevos", category: "huevos" },
  { name: "Leche", category: "lacteos" },
  { name: "Pan", category: "panaderia" },
  { name: "Tomate", category: "verduras" },
  { name: "Cebolla", category: "verduras" },
  { name: "Pollo", category: "carnes" },
  { name: "Arroz", category: "almacen" },
  { name: "Aceite", category: "almacen" },
  { name: "Sal", category: "condimentos" },
  { name: "Ajo", category: "verduras" },
];

interface ExtendedShoppingItem extends Omit<ShoppingListItem, 'quantity' | 'unit'> {
  quantity: number;
  unit: string;
  is_favorite?: boolean;
}

export function SupermarketListModal({ open, onOpenChange }: SupermarketListModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, isLoading, togglePurchased, removeItem, clearPurchased, pendingCount, addItem, refetch } = useShoppingList();
  const [newItemName, setNewItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("otros");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compatibleRecipes, setCompatibleRecipes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "add" | "recipes">("list");

  // Calculate progress and achievements
  const purchasedCount = items.filter((i) => i.is_purchased).length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

  // Achievement milestones
  const achievements = [
    { threshold: 5, icon: "🛒", label: "Primer carrito" },
    { threshold: 15, icon: "🏆", label: "Comprador estrella" },
    { threshold: 30, icon: "👑", label: "Master del súper" },
  ];

  const currentAchievement = achievements.filter(a => purchasedCount >= a.threshold).pop();

  // Find compatible recipes based on items
  useEffect(() => {
    const findCompatibleRecipes = async () => {
      if (!user || items.length === 0) {
        setCompatibleRecipes([]);
        return;
      }

      const ingredientNames = items.filter(i => !i.is_purchased).map(i => i.ingredient_name.toLowerCase());
      
      try {
        const { data } = await supabase
          .from("cached_recipes")
          .select("recipe_name, main_ingredients")
          .limit(50);

        if (data) {
          const compatible = data.filter(recipe => {
            const recipeIngredients = recipe.main_ingredients.map((i: string) => i.toLowerCase());
            const matchCount = recipeIngredients.filter((ing: string) => 
              ingredientNames.some(itemIng => ing.includes(itemIng) || itemIng.includes(ing))
            ).length;
            return matchCount >= 2;
          }).map(r => r.recipe_name);

          setCompatibleRecipes(compatible.slice(0, 5));
        }
      } catch (error) {
        console.error("Error finding compatible recipes:", error);
      }
    };

    findCompatibleRecipes();
  }, [items, user]);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category?.toLowerCase() || "otros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  // Sort categories by order
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const orderA = CATEGORY_CONFIG[a]?.order || 99;
    const orderB = CATEGORY_CONFIG[b]?.order || 99;
    return orderA - orderB;
  });

  // Filter items by search
  const filteredCategories = sortedCategories.filter(category => {
    if (!searchTerm) return true;
    return groupedItems[category].some(item => 
      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const success = await addItem(newItemName.trim(), selectedCategory);
    if (success) {
      setNewItemName("");
      toast({
        title: "🛒 ¡Agregado al carrito!",
        description: `${newItemName} fue agregado a tu lista.`,
      });
    }
  };

  const handleAddSuggested = async (product: { name: string; category: string }) => {
    const success = await addItem(product.name, product.category);
    if (success) {
      toast({
        title: "🛒 ¡Agregado!",
        description: `${product.name} fue agregado a tu lista.`,
      });
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[itemId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [itemId]: newValue };
    });
  };

  const toggleFavorite = (itemName: string) => {
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(itemName)) {
        newFavs.delete(itemName);
      } else {
        newFavs.add(itemName);
      }
      return newFavs;
    });
  };

  const copyToClipboard = () => {
    const text = sortedCategories
      .map((category) => {
        const config = CATEGORY_CONFIG[category] || { emoji: "📦", label: category };
        const categoryItems = groupedItems[category].filter((i) => !i.is_purchased);
        if (categoryItems.length === 0) return null;
        return `${config.emoji} ${config.label}:\n${categoryItems.map((i) => {
          const qty = quantities[i.id] || 1;
          return `  • ${i.ingredient_name}${qty > 1 ? ` (x${qty})` : ""}`;
        }).join("\n")}`;
      })
      .filter(Boolean)
      .join("\n\n");

    if (!text) {
      toast({
        title: "Lista vacía",
        description: "No hay ingredientes pendientes para copiar.",
      });
      return;
    }

    navigator.clipboard.writeText(text);
    toast({
      title: "¡Copiado!",
      description: "Lista copiada al portapapeles.",
    });
  };

  // Animated cart fill percentage
  const cartFillLevel = Math.min(100, (pendingCount * 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-2 border-primary/20">
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        

        <DialogHeader className="relative z-10 p-5 pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-emerald-500/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-display">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                {/* Animated sparkles around cart */}
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-primary animate-ping" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary via-emerald-500 to-accent bg-clip-text text-transparent">
                  Mi Súper
                </span>
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white animate-heartbeat border-0 shadow-lg">
                    {pendingCount} items
                  </Badge>
                )}
              </div>
            </DialogTitle>
            {currentAchievement && (
              <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 border-yellow-500/40 animate-pulse shadow-lg">
                <Trophy className="w-3 h-3 mr-1" />
                {currentAchievement.icon} {currentAchievement.label}
              </Badge>
            )}
          </div>

          {/* Enhanced Progress bar */}
          {totalItems > 0 && (
            <div className="mt-4 bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-primary/10">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Check className="w-3 h-3 text-emerald-500" />
                  {purchasedCount} de {totalItems} comprados
                </span>
                <span className={cn(
                  "font-bold",
                  progressPercentage === 100 ? "text-emerald-500" : "text-primary"
                )}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-primary to-emerald-400 rounded-full transition-all duration-700 ease-out animate-rainbow"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/30 to-transparent rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {progressPercentage === 100 && (
                <p className="text-center text-xs text-emerald-500 font-medium mt-2 animate-pulse">
                  🎉 ¡Lista completa! ¡Sos un crack!
                </p>
              )}
            </div>
          )}

          {/* Enhanced Tab navigation */}
          <div className="flex gap-2 mt-4">
            {[
              { id: "list", label: "Lista", icon: ShoppingCart, gradient: "from-emerald-500 to-emerald-600" },
              { id: "add", label: "Agregar", icon: Plus, gradient: "from-primary to-accent" },
              { id: "recipes", label: "Recetas", icon: ChefHat, gradient: "from-orange-500 to-orange-600" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 text-xs font-semibold transition-all duration-300 gap-1.5",
                  activeTab === tab.id 
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105 border-0`
                    : "hover:bg-primary/10 hover:scale-102"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {!user ? (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">¡Bienvenido al Súper!</p>
              <p className="text-muted-foreground text-sm">
                Iniciá sesión para crear tu lista de compras personalizada
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <ShoppingCart className="w-16 h-16 text-primary/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              <p className="text-muted-foreground">Cargando tu carrito...</p>
            </div>
          ) : activeTab === "list" ? (
            <div className="p-4">
              {/* Search */}
              {items.length > 0 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en tu lista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
                    <Package className="w-12 h-12 text-primary/50" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">Tu carrito está vacío</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Agregá productos para empezar tu lista
                  </p>
                  <Button onClick={() => setActiveTab("add")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar productos
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((category) => {
                    const config = CATEGORY_CONFIG[category] || { emoji: "📦", label: category, order: 99, color: "bg-gray-100" };
                    const categoryItems = groupedItems[category].filter(item => 
                      !searchTerm || item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    const pendingItems = categoryItems.filter((i) => !i.is_purchased);
                    const purchasedItems = categoryItems.filter((i) => i.is_purchased);

                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <div className={cn(
                          "flex items-center gap-2 sticky top-0 py-2 px-3 rounded-lg z-10 border",
                          config.color
                        )}>
                          <span className="text-xl">{config.emoji}</span>
                          <h3 className="font-display font-semibold flex-1">
                            {config.label}
                          </h3>
                          <Badge variant="secondary" className="text-xs bg-background/50">
                            {pendingItems.length}/{categoryItems.length}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 pl-2">
                          {pendingItems.map((item) => (
                            <ShoppingItem
                              key={item.id}
                              item={item}
                              quantity={quantities[item.id] || 1}
                              isFavorite={favorites.has(item.ingredient_name)}
                              onToggle={() => togglePurchased(item.id)}
                              onRemove={() => removeItem(item.id)}
                              onQuantityChange={(delta) => updateQuantity(item.id, delta)}
                              onToggleFavorite={() => toggleFavorite(item.ingredient_name)}
                            />
                          ))}
                          {purchasedItems.map((item) => (
                            <ShoppingItem
                              key={item.id}
                              item={item}
                              quantity={quantities[item.id] || 1}
                              isFavorite={favorites.has(item.ingredient_name)}
                              onToggle={() => togglePurchased(item.id)}
                              onRemove={() => removeItem(item.id)}
                              onQuantityChange={(delta) => updateQuantity(item.id, delta)}
                              onToggleFavorite={() => toggleFavorite(item.ingredient_name)}
                              purchased
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "add" ? (
            <div className="p-4 space-y-6">
              {/* Add new item form */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Agregar producto
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre del producto..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddItem} disabled={!newItemName.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Category selector */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORY_CONFIG).slice(0, 8).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs transition-all border",
                        selectedCategory === key
                          ? config.color
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {config.emoji} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested products */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Productos sugeridos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_PRODUCTS.filter(p => !items.some(i => i.ingredient_name.toLowerCase() === p.name.toLowerCase())).map((product) => {
                    const config = CATEGORY_CONFIG[product.category];
                    return (
                      <button
                        key={product.name}
                        onClick={() => handleAddSuggested(product)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border transition-all",
                          "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                          config.color
                        )}
                      >
                        <span>{config.emoji}</span>
                        <span className="text-sm font-medium">{product.name}</span>
                        <Plus className="w-3 h-3 ml-auto opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite products */}
              {favorites.size > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                    Tus favoritos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(favorites).map((fav) => (
                      <button
                        key={fav}
                        onClick={() => addItem(fav, "otros")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        <Heart className="w-3 h-3 fill-current" />
                        {fav}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                Recetas con tus ingredientes
              </h3>
              
              {compatibleRecipes.length > 0 ? (
                <div className="space-y-2">
                  {compatibleRecipes.map((recipe, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/10 border border-primary/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{recipe}</p>
                        <p className="text-xs text-muted-foreground">Podés preparar con tu lista</p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChefHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Agregá más productos para ver recetas compatibles
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && activeTab === "list" && (
          <div className="p-3 border-t bg-muted/30 flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            {purchasedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPurchased}
                className="text-muted-foreground hover:text-destructive gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar ({purchasedCount})
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ShoppingItemProps {
  item: ShoppingListItem;
  quantity: number;
  isFavorite: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onQuantityChange: (delta: number) => void;
  onToggleFavorite: () => void;
  purchased?: boolean;
}

function ShoppingItem({ 
  item, 
  quantity, 
  isFavorite, 
  onToggle, 
  onRemove, 
  onQuantityChange, 
  onToggleFavorite, 
  purchased 
}: ShoppingItemProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-xl group transition-all duration-500 overflow-hidden",
        purchased
          ? "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 scale-[0.98] border border-emerald-500/20"
          : "bg-gradient-to-r from-card to-card/80 border border-border/50 hover:shadow-lg hover:border-primary/30 hover:scale-[1.01]"
      )}
    >
      {/* Subtle glow effect */}
      {!purchased && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300",
          purchased 
            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md" 
            : "bg-muted/50 group-hover:bg-primary/20"
        )}>
          <Checkbox
            checked={purchased}
            onCheckedChange={onToggle}
            className={cn(
              "flex-shrink-0 border-2 transition-all",
              purchased ? "border-white data-[state=checked]:bg-transparent" : "border-primary/50"
            )}
          />
        </div>
        
        <span
          className={cn(
            "flex-1 text-sm font-medium transition-all duration-300",
            purchased && "line-through text-emerald-600/70"
          )}
        >
          {item.ingredient_name}
          {quantity > 1 && !purchased && (
            <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">
              x{quantity}
            </Badge>
          )}
        </span>

        {purchased && (
          <div className="flex items-center gap-1 text-emerald-500 animate-fade-in">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">¡Listo!</span>
          </div>
        )}

        {!purchased && (
          <>
            {/* Quantity controls */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-muted/50 rounded-full px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuantityChange(-1)}
                className="h-7 w-7 p-0 rounded-full hover:bg-primary/20 hover:text-primary"
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center text-xs font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuantityChange(1)}
                className="h-7 w-7 p-0 rounded-full hover:bg-primary/20 hover:text-primary"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Favorite toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-300",
                isFavorite 
                  ? "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20" 
                  : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"
              )}
            >
              <Heart className={cn("w-4 h-4 transition-transform", isFavorite && "fill-current scale-110")} />
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
