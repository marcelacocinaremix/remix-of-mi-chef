import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, Package, ShoppingCart, BarChart3, 
  Trophy, Star, Clock, RefreshCw, ArrowUp, ArrowDown,
  Sparkles, Target, Zap, Calendar, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ShoppingHistoryItem {
  id: string;
  ingredient_name: string;
  category: string;
  is_purchased: boolean;
  created_at: string;
  quantity: number;
  unit: string;
}

interface SuperSmartHistoryProps {
  currentItems: ShoppingHistoryItem[];
  onSuggestItem?: (name: string, category: string) => void;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  verduras: { emoji: "🥬", label: "Verduras", color: "emerald" },
  frutas: { emoji: "🍎", label: "Frutas", color: "rose" },
  carnes: { emoji: "🥩", label: "Carnes", color: "red" },
  pescados: { emoji: "🐟", label: "Pescados", color: "cyan" },
  lacteos: { emoji: "🧀", label: "Lácteos", color: "amber" },
  huevos: { emoji: "🥚", label: "Huevos", color: "orange" },
  almacen: { emoji: "🏪", label: "Almacén", color: "amber" },
  panaderia: { emoji: "🍞", label: "Panadería", color: "yellow" },
  condimentos: { emoji: "🧂", label: "Condimentos", color: "purple" },
  bebidas: { emoji: "🥤", label: "Bebidas", color: "blue" },
  congelados: { emoji: "🧊", label: "Congelados", color: "sky" },
  otros: { emoji: "📦", label: "Otros", color: "slate" },
};

export function SuperSmartHistory({ currentItems, onSuggestItem }: SuperSmartHistoryProps) {
  const { user } = useAuth();
  const [historicalData, setHistoricalData] = useState<ShoppingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Fetch historical shopping data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get all shopping list items including deleted ones would require a history table
        // For now, we analyze current and patterns from pantry additions from shopping
        const { data, error } = await supabase
          .from("shopping_list_items")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        setHistoricalData(data || []);
      } catch (error) {
        console.error("Error fetching shopping history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    const allItems = [...currentItems];
    const purchasedItems = allItems.filter(i => i.is_purchased);
    const pendingItems = allItems.filter(i => !i.is_purchased);
    
    // Completion rate
    const completionRate = allItems.length > 0 
      ? Math.round((purchasedItems.length / allItems.length) * 100) 
      : 0;

    // Items by category
    const categoryBreakdown: Record<string, number> = {};
    allItems.forEach(item => {
      const cat = item.category?.toLowerCase() || "otros";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // Most bought items (frequency analysis)
    const itemFrequency: Record<string, { count: number; category: string }> = {};
    allItems.forEach(item => {
      const name = item.ingredient_name.toLowerCase();
      if (!itemFrequency[name]) {
        itemFrequency[name] = { count: 0, category: item.category };
      }
      itemFrequency[name].count += item.quantity || 1;
    });

    const topItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Items added this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekItems = allItems.filter(i => new Date(i.created_at) >= oneWeekAgo);

    // Category with most items
    const topCategory = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];

    // Average items per list (estimate based on current data)
    const avgItemsPerList = allItems.length;

    return {
      totalItems: allItems.length,
      purchasedCount: purchasedItems.length,
      pendingCount: pendingItems.length,
      completionRate,
      categoryBreakdown,
      topItems,
      thisWeekItems: thisWeekItems.length,
      topCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null,
      avgItemsPerList,
    };
  }, [currentItems]);

  // Generate suggestions based on patterns
  const suggestions = useMemo(() => {
    const currentItemNames = new Set(currentItems.map(i => i.ingredient_name.toLowerCase()));
    
    // Common items that might be missing
    const commonItems = [
      { name: "Leche", category: "lacteos" },
      { name: "Pan", category: "panaderia" },
      { name: "Huevos", category: "huevos" },
      { name: "Aceite", category: "almacen" },
      { name: "Sal", category: "condimentos" },
      { name: "Azúcar", category: "almacen" },
      { name: "Arroz", category: "almacen" },
      { name: "Fideos", category: "almacen" },
      { name: "Tomate", category: "verduras" },
      { name: "Cebolla", category: "verduras" },
    ];

    // Filter items not in current list
    const missingCommon = commonItems.filter(
      item => !currentItemNames.has(item.name.toLowerCase())
    ).slice(0, 4);

    return missingCommon;
  }, [currentItems]);

  // Shopping efficiency score
  const efficiencyScore = useMemo(() => {
    if (stats.totalItems === 0) return 0;
    
    // Base score from completion rate
    let score = stats.completionRate * 0.7;
    
    // Bonus for variety (using multiple categories)
    const categoryCount = Object.keys(stats.categoryBreakdown).length;
    score += Math.min(categoryCount * 3, 15);
    
    // Bonus for organized shopping (items in list)
    score += Math.min(stats.totalItems * 0.5, 15);
    
    return Math.min(Math.round(score), 100);
  }, [stats]);

  if (!user) return null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
      rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
      red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-700 dark:text-red-400",
      cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400",
      amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
      orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-700 dark:text-orange-400",
      yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
      purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-700 dark:text-purple-400",
      blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
      sky: "from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-700 dark:text-sky-400",
      slate: "from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-700 dark:text-slate-400",
    };
    return colors[category] || colors.slate;
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display">Historial Inteligente</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Análisis de tus compras
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-yellow-500 ml-auto animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">En lista</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalItems}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-3 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Comprados</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.purchasedCount}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl p-3 border border-amber-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingCount}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 border border-purple-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Esta semana</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.thisWeekItems}</p>
          </motion.div>
        </div>

        {/* Efficiency Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl p-4 border border-primary/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium">Eficiencia de compras</span>
            </div>
            <Badge 
              className={cn(
                "font-bold",
                efficiencyScore >= 80 ? "bg-emerald-500" :
                efficiencyScore >= 50 ? "bg-amber-500" : "bg-red-500"
              )}
            >
              {efficiencyScore}%
            </Badge>
          </div>
          <Progress 
            value={efficiencyScore} 
            className="h-2.5"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {efficiencyScore >= 80 
              ? "🏆 ¡Excelente! Sos un/a experto/a en compras" 
              : efficiencyScore >= 50 
                ? "👍 Vas bien, seguí así" 
                : "💪 Agregá más items a tu lista para mejorar"}
          </p>
        </motion.div>

        {/* Completion Rate */}
        {stats.totalItems > 0 && (
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Progreso de la lista
              </span>
              <span className={cn(
                "text-sm font-bold",
                stats.completionRate === 100 ? "text-emerald-500" : "text-primary"
              )}>
                {stats.completionRate}%
              </span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
        )}

        {/* Category Breakdown */}
        {Object.keys(stats.categoryBreakdown).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Distribución por categoría
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, count]) => {
                  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.otros;
                  const percentage = Math.round((count / stats.totalItems) * 100);
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-lg w-6">{config.emoji}</span>
                      <span className="text-sm flex-1 truncate">{config.label}</span>
                      <div className="w-24">
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Top Items */}
        {stats.topItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Productos más frecuentes
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.topItems.map(([name, data], index) => {
                const config = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.otros;
                return (
                  <Badge 
                    key={name}
                    variant="secondary"
                    className={cn(
                      "px-3 py-1.5 bg-gradient-to-r border",
                      getCategoryColor(config.color)
                    )}
                  >
                    <span className="mr-1">{config.emoji}</span>
                    <span className="capitalize">{name}</span>
                    {index === 0 && <Star className="w-3 h-3 ml-1 fill-yellow-500 text-yellow-500" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && onSuggestItem && showSuggestions && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                ¿Te olvidaste de algo?
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setShowSuggestions(false)}
              >
                Ocultar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => {
                const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.otros;
                return (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => onSuggestItem(item.name, item.category)}
                  >
                    <span>{config.emoji}</span>
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Top Category Highlight */}
        {stats.topCategory && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <Award className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">Categoría favorita:</span>{" "}
                <span className="text-primary">
                  {CATEGORY_CONFIG[stats.topCategory.name]?.emoji}{" "}
                  {CATEGORY_CONFIG[stats.topCategory.name]?.label || stats.topCategory.name}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.topCategory.count} productos en esta categoría
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalItems === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Agregá productos a tu lista para ver estadísticas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
