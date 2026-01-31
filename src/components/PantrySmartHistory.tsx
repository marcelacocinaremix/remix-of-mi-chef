import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Calendar,
  Leaf,
  BarChart3,
  Clock,
  ShoppingCart,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PantryItem {
  id: string;
  ingredient_name: string;
  category: string;
  expiration_date?: string | null;
  created_at?: string;
  source?: string;
}

interface PantrySmartHistoryProps {
  items: PantryItem[];
  onAddToShoppingList?: (name: string, category: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  verduras: { label: "Verduras", emoji: "🥬", color: "text-green-600" },
  frutas: { label: "Frutas", emoji: "🍎", color: "text-red-600" },
  carnes: { label: "Carnes", emoji: "🥩", color: "text-rose-600" },
  lacteos: { label: "Lácteos", emoji: "🧀", color: "text-yellow-600" },
  granos: { label: "Granos", emoji: "🌾", color: "text-amber-600" },
  condimentos: { label: "Condimentos", emoji: "🧂", color: "text-purple-600" },
  bebidas: { label: "Bebidas", emoji: "🥤", color: "text-blue-600" },
  congelados: { label: "Congelados", emoji: "🧊", color: "text-cyan-600" },
  otros: { label: "Otros", emoji: "📦", color: "text-gray-600" },
};

function getDaysUntilExpiration(expirationDate: string | null | undefined): number | null {
  if (!expirationDate) return null;
  const expiry = new Date(expirationDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PantrySmartHistory({ items, onAddToShoppingList }: PantrySmartHistoryProps) {
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Productos vencidos
    const expired = items.filter(item => {
      if (!item.expiration_date) return false;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days < 0;
    });

    // Productos por vencer (próximos 3 días)
    const expiringSoon = items.filter(item => {
      if (!item.expiration_date) return false;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days >= 0 && days <= 3;
    });

    // Productos OK (más de 3 días o sin fecha)
    const okProducts = items.filter(item => {
      if (!item.expiration_date) return true;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days > 3;
    });

    // Conteo por categoría
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || "otros";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Ordenar categorías por cantidad
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    // Productos agregados recientemente (últimos 7 días)
    const recentlyAdded = items.filter(item => {
      if (!item.created_at) return false;
      const created = new Date(item.created_at);
      const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    // Productos por fuente
    const sourceCount: Record<string, number> = {};
    items.forEach(item => {
      const source = item.source || "manual";
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    return {
      total: items.length,
      expired,
      expiringSoon,
      okProducts,
      categoryCount: sortedCategories,
      recentlyAdded: recentlyAdded.length,
      sourceCount,
      healthScore: items.length > 0 
        ? Math.round(((items.length - expired.length) / items.length) * 100) 
        : 100,
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="py-6 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            ¡Agregá productos a tu despensa para ver estadísticas!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {/* Header con puntaje de salud */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Resumen de Despensa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stats principales */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-background/60 border border-border/30">
              <Package className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold text-green-600">{stats.okProducts.length}</p>
              <p className="text-[10px] text-muted-foreground">OK</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{stats.expiringSoon.length}</p>
              <p className="text-[10px] text-muted-foreground">Por vencer</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="text-lg font-bold text-red-600">{stats.expired.length}</p>
              <p className="text-[10px] text-muted-foreground">Vencidos</p>
            </div>
          </div>

          {/* Barra de salud */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Estado de despensa
              </span>
              <span className={cn(
                "font-medium",
                stats.healthScore >= 80 ? "text-green-600" :
                stats.healthScore >= 50 ? "text-amber-600" : "text-red-600"
              )}>
                {stats.healthScore}%
              </span>
            </div>
            <Progress 
              value={stats.healthScore} 
              className={cn(
                "h-2",
                stats.healthScore >= 80 ? "[&>div]:bg-green-500" :
                stats.healthScore >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Productos por vencer */}
      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              ¡Por vencer pronto!
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                {stats.expiringSoon.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-24">
              <div className="flex flex-wrap gap-1.5">
                {stats.expiringSoon.map((item, idx) => {
                  const days = getDaysUntilExpiration(item.expiration_date);
                  const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.otros;
                  return (
                    <Badge 
                      key={item.id || idx}
                      variant="outline" 
                      className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-xs animate-in fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <span className="mr-1">{cat.emoji}</span>
                      {item.ingredient_name}
                      <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                        {days === 0 ? "HOY" : days === 1 ? "mañana" : `${days}d`}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Productos vencidos */}
      {stats.expired.length > 0 && (
        <Card className="border-red-500/30 bg-gradient-to-r from-red-500/10 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              Productos vencidos
              <Badge variant="destructive" className="ml-auto">
                {stats.expired.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-24">
              <div className="flex flex-wrap gap-1.5">
                {stats.expired.map((item, idx) => {
                  const days = Math.abs(getDaysUntilExpiration(item.expiration_date) || 0);
                  const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.otros;
                  return (
                    <Badge 
                      key={item.id || idx}
                      variant="outline" 
                      className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-xs line-through opacity-75"
                    >
                      <span className="mr-1">{cat.emoji}</span>
                      {item.ingredient_name}
                      <span className="ml-1 text-red-600 dark:text-red-400 text-[10px]">
                        hace {days}d
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-2 flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              Considerá reponerlos en tu próxima compra
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribución por categorías */}
      <Card className="border-muted bg-gradient-to-r from-muted/30 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-500" />
            Por categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.categoryCount.slice(0, 5).map(({ category, count }, idx) => {
            const cat = CATEGORY_LABELS[category] || CATEGORY_LABELS.otros;
            const percentage = Math.round((count / stats.total) * 100);
            return (
              <div 
                key={category} 
                className="flex items-center gap-2 animate-in slide-in-from-left-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="text-sm w-5">{cat.emoji}</span>
                <span className={cn("text-xs font-medium w-20 truncate", cat.color)}>
                  {cat.label}
                </span>
                <div className="flex-1">
                  <Progress value={percentage} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Info adicional */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-muted/50 bg-muted/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{stats.recentlyAdded}</p>
            <p className="text-[10px] text-muted-foreground">Agregados esta semana</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-muted/20">
          <CardContent className="p-3 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold">
              {items.filter(i => i.expiration_date).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Con fecha de venc.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
