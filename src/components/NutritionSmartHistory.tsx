import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, Package, BarChart3, Activity,
  Trophy, Star, AlertTriangle, Sparkles, 
  Target, Zap, Heart, Flame, Droplets, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ScannedProduct {
  id: string;
  product_name: string;
  brand: string | null;
  calories: number | null;
  total_fat: number | null;
  saturated_fat: number | null;
  trans_fat: number | null;
  sodium: number | null;
  total_carbs: number | null;
  dietary_fiber: number | null;
  sugars: number | null;
  protein: number | null;
  added_to_pantry: boolean;
  created_at: string;
}

export function NutritionSmartHistory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("scanned_products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  // Calculate nutritional stats
  const stats = useMemo(() => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        inPantry: 0,
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        avgSodium: 0,
        avgSugars: 0,
        avgFiber: 0,
        highProteinCount: 0,
        lowSugarCount: 0,
        highFiberCount: 0,
        highSodiumCount: 0,
        thisWeekCount: 0,
        healthScore: 0,
        bestProducts: [],
        warningProducts: [],
      };
    }

    const productsWithCalories = products.filter(p => p.calories !== null);
    const productsWithProtein = products.filter(p => p.protein !== null);
    const productsWithCarbs = products.filter(p => p.total_carbs !== null);
    const productsWithFat = products.filter(p => p.total_fat !== null);
    const productsWithSodium = products.filter(p => p.sodium !== null);
    const productsWithSugars = products.filter(p => p.sugars !== null);
    const productsWithFiber = products.filter(p => p.dietary_fiber !== null);

    const avgCalories = productsWithCalories.length > 0
      ? Math.round(productsWithCalories.reduce((sum, p) => sum + (p.calories || 0), 0) / productsWithCalories.length)
      : 0;

    const avgProtein = productsWithProtein.length > 0
      ? Math.round(productsWithProtein.reduce((sum, p) => sum + (p.protein || 0), 0) / productsWithProtein.length * 10) / 10
      : 0;

    const avgCarbs = productsWithCarbs.length > 0
      ? Math.round(productsWithCarbs.reduce((sum, p) => sum + (p.total_carbs || 0), 0) / productsWithCarbs.length * 10) / 10
      : 0;

    const avgFat = productsWithFat.length > 0
      ? Math.round(productsWithFat.reduce((sum, p) => sum + (p.total_fat || 0), 0) / productsWithFat.length * 10) / 10
      : 0;

    const avgSodium = productsWithSodium.length > 0
      ? Math.round(productsWithSodium.reduce((sum, p) => sum + (p.sodium || 0), 0) / productsWithSodium.length)
      : 0;

    const avgSugars = productsWithSugars.length > 0
      ? Math.round(productsWithSugars.reduce((sum, p) => sum + (p.sugars || 0), 0) / productsWithSugars.length * 10) / 10
      : 0;

    const avgFiber = productsWithFiber.length > 0
      ? Math.round(productsWithFiber.reduce((sum, p) => sum + (p.dietary_fiber || 0), 0) / productsWithFiber.length * 10) / 10
      : 0;

    // Products categories
    const highProteinCount = products.filter(p => (p.protein || 0) >= 15).length;
    const lowSugarCount = products.filter(p => p.sugars !== null && (p.sugars || 0) <= 5).length;
    const highFiberCount = products.filter(p => (p.dietary_fiber || 0) >= 3).length;
    const highSodiumCount = products.filter(p => (p.sodium || 0) > 400).length;

    // This week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = products.filter(p => new Date(p.created_at) >= oneWeekAgo).length;

    // Best products (high protein, low sugar, high fiber)
    const bestProducts = products
      .filter(p => (p.protein || 0) >= 10 && (p.sugars || 0) <= 10)
      .slice(0, 3);

    // Warning products (high sodium or high sugar)
    const warningProducts = products
      .filter(p => (p.sodium || 0) > 500 || (p.sugars || 0) > 15)
      .slice(0, 3);

    // Health score calculation
    let healthScore = 50; // Base score
    if (avgProtein >= 10) healthScore += 15;
    if (avgSugars <= 10) healthScore += 15;
    if (avgFiber >= 2) healthScore += 10;
    if (avgSodium <= 300) healthScore += 10;
    if (highProteinCount > 0) healthScore += 5;
    if (lowSugarCount > highSodiumCount) healthScore += 5;
    healthScore = Math.min(100, Math.max(0, healthScore));

    return {
      totalProducts: products.length,
      inPantry: products.filter(p => p.added_to_pantry).length,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      avgSodium,
      avgSugars,
      avgFiber,
      highProteinCount,
      lowSugarCount,
      highFiberCount,
      highSodiumCount,
      thisWeekCount,
      healthScore,
      bestProducts,
      warningProducts,
    };
  }, [products]);

  if (!user) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-cyan-500/5 to-teal-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display">Historial Nutricional</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Análisis de tus productos escaneados
            </p>
          </div>
          <Heart className="w-4 h-4 text-rose-500 ml-auto animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stats.totalProducts === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
              <Package className="w-8 h-8 text-cyan-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Escaneá productos para ver estadísticas nutricionales
            </p>
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-3 border border-cyan-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs text-muted-foreground">Escaneados</span>
                </div>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.totalProducts}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-3 border border-orange-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Prom. kcal</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.avgCalories}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 border border-blue-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Prom. prot</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgProtein}g</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 border border-purple-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Esta semana</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.thisWeekCount}</p>
              </motion.div>
            </div>

            {/* Health Score */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span className="font-medium">Puntuación nutricional</span>
                </div>
                <Badge 
                  className={cn(
                    "font-bold",
                    stats.healthScore >= 70 ? "bg-emerald-500" :
                    stats.healthScore >= 50 ? "bg-amber-500" : "bg-red-500"
                  )}
                >
                  {stats.healthScore}/100
                </Badge>
              </div>
              <Progress 
                value={stats.healthScore} 
                className="h-2.5"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.healthScore >= 70 
                  ? "🏆 ¡Excelente! Elegís productos muy saludables" 
                  : stats.healthScore >= 50 
                    ? "👍 Buen balance, pero podés mejorar" 
                    : "💪 Intentá elegir productos con menos azúcar y sodio"}
              </p>
            </motion.div>

            {/* Macro Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                Promedios por producto
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm flex-1">Carbohidratos</span>
                  <span className="text-sm font-medium">{stats.avgCarbs}g</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm flex-1">Grasas</span>
                  <span className="text-sm font-medium">{stats.avgFat}g</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm flex-1">Azúcares</span>
                  <span className="text-sm font-medium">{stats.avgSugars}g</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm flex-1">Fibra</span>
                  <span className="text-sm font-medium">{stats.avgFiber}g</span>
                </div>
              </div>
            </div>

            {/* Product Categories */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Clasificación de productos
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.highProteinCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    {stats.highProteinCount} altos en proteína
                  </Badge>
                )}
                {stats.lowSugarCount > 0 && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    <Star className="w-3 h-3 mr-1" />
                    {stats.lowSugarCount} bajos en azúcar
                  </Badge>
                )}
                {stats.highFiberCount > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {stats.highFiberCount} altos en fibra
                  </Badge>
                )}
                {stats.highSodiumCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    <Droplets className="w-3 h-3 mr-1" />
                    {stats.highSodiumCount} altos en sodio
                  </Badge>
                )}
              </div>
            </div>

            {/* Best Products */}
            {stats.bestProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Mejores opciones
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.bestProducts.map((product) => (
                    <Badge 
                      key={product.id}
                      variant="outline"
                      className="bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    >
                      ✓ {product.product_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Products */}
            {stats.warningProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Consumir con moderación
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.warningProducts.map((product) => (
                    <Badge 
                      key={product.id}
                      variant="outline"
                      className="bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    >
                      ⚠️ {product.product_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pantry Integration */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{stats.inPantry}</span> de {stats.totalProducts} productos en tu despensa
                </p>
                <Progress 
                  value={(stats.inPantry / stats.totalProducts) * 100} 
                  className="h-1.5 mt-1"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
