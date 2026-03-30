import { useMemo, useState } from "react";
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
  CheckCircle2,
  ChevronDown
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

    const expired = items.filter(item => {
      if (!item.expiration_date) return false;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days < 0;
    });

    const expiringSoon = items.filter(item => {
      if (!item.expiration_date) return false;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days >= 0 && days <= 3;
    });

    const okProducts = items.filter(item => {
      if (!item.expiration_date) return true;
      const days = getDaysUntilExpiration(item.expiration_date);
      return days !== null && days > 3;
    });

    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || "otros";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    const recentlyAdded = items.filter(item => {
      if (!item.created_at) return false;
      const created = new Date(item.created_at);
      const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    return {
      total: items.length,
      expired,
      expiringSoon,
      okProducts,
      categoryCount: sortedCategories,
      recentlyAdded: recentlyAdded.length,
      healthScore: items.length > 0 
        ? Math.round(((items.length - expired.length) / items.length) * 100) 
        : 100,
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="py-4 text-center">
        <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-muted-foreground text-xs">
          ¡Agregá productos a tu despensa para ver estadísticas!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      {/* Compact stats row */}
      <div className="flex items-center gap-1 px-1">
        <div className="flex-1 flex items-center gap-1.5">
          <Package className="w-3 h-3 text-primary shrink-0" />
          <span className="text-xs font-semibold">{stats.total}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
          <span className="text-xs font-semibold text-green-600">{stats.okProducts.length}</span>
          <span className="text-[10px] text-muted-foreground">OK</span>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-amber-600">{stats.expiringSoon.length}</span>
          <span className="text-[10px] text-muted-foreground truncate">Por vencer</span>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-xs font-semibold text-red-600">{stats.expired.length}</span>
          <span className="text-[10px] text-muted-foreground">Vencidos</span>
        </div>
      </div>

      {/* Ultra-thin health bar */}
      <div className="px-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Estado de despensa
          </span>
          <span className={cn(
            "text-[10px] font-semibold ml-auto",
            stats.healthScore >= 80 ? "text-green-600" :
            stats.healthScore >= 50 ? "text-amber-600" : "text-red-600"
          )}>
            {stats.healthScore}%
          </span>
        </div>
        <Progress 
          value={stats.healthScore} 
          className={cn(
            "h-1",
            stats.healthScore >= 80 ? "[&>div]:bg-green-500" :
            stats.healthScore >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
          )}
        />
      </div>

      {/* Expiring soon - compact */}
      {stats.expiringSoon.length > 0 && (
        <div className="px-1 py-1.5">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3" />
            Por vencer pronto
            <Badge variant="secondary" className="ml-auto h-4 text-[9px] px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              {stats.expiringSoon.length}
            </Badge>
          </p>
          <div className="flex flex-wrap gap-1">
            {stats.expiringSoon.map((item, idx) => {
              const days = getDaysUntilExpiration(item.expiration_date);
              const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.otros;
              return (
                <Badge 
                  key={item.id || idx}
                  variant="outline" 
                  className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-[10px] py-0 h-5"
                >
                  <span className="mr-0.5">{cat.emoji}</span>
                  {item.ingredient_name}
                  <span className="ml-0.5 text-amber-600 dark:text-amber-400 font-medium">
                    {days === 0 ? "HOY" : days === 1 ? "mañana" : `${days}d`}
                  </span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired - compact */}
      {stats.expired.length > 0 && (
        <div className="px-1 py-1.5">
          <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            Vencidos
            <Badge variant="destructive" className="ml-auto h-4 text-[9px] px-1.5">
              {stats.expired.length}
            </Badge>
          </p>
          <div className="flex flex-wrap gap-1">
            {stats.expired.map((item, idx) => {
              const days = Math.abs(getDaysUntilExpiration(item.expiration_date) || 0);
              const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.otros;
              return (
                <Badge 
                  key={item.id || idx}
                  variant="outline" 
                  className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-[10px] line-through opacity-75 py-0 h-5"
                >
                  <span className="mr-0.5">{cat.emoji}</span>
                  {item.ingredient_name}
                  <span className="ml-0.5 text-red-600 dark:text-red-400 text-[9px]">
                    hace {days}d
                  </span>
                </Badge>
              );
            })}
          </div>
          <p className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-1 flex items-center gap-0.5">
            <ShoppingCart className="w-2.5 h-2.5" />
            Considerá reponerlos en tu próxima compra
          </p>
        </div>
      )}

      {/* Categories - collapsible */}
      <div className="px-1 pt-0.5 pb-1">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between mb-1.5"
        >
          <p className="text-[11px] font-semibold flex items-center gap-1">
            <Leaf className="w-3 h-3 text-green-500" />
            Por categoría
          </p>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", categoriesOpen && "rotate-180")} />
        </button>
        {categoriesOpen && (
          <div className="space-y-1 animate-fade-in">
            {stats.categoryCount.slice(0, 5).map(({ category, count }) => {
              const cat = CATEGORY_LABELS[category] || CATEGORY_LABELS.otros;
              const percentage = Math.round((count / stats.total) * 100);
              return (
                <div key={category} className="flex items-center gap-1.5">
                  <span className="text-xs w-4">{cat.emoji}</span>
                  <span className={cn("text-[10px] font-medium w-16 truncate", cat.color)}>
                    {cat.label}
                  </span>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-1" />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact bottom stats */}
      <div className="flex items-center gap-3 px-1 py-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-primary" />
          <strong className="text-foreground">{stats.recentlyAdded}</strong> esta semana
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-purple-500" />
          <strong className="text-foreground">{items.filter(i => i.expiration_date).length}</strong> con venc.
        </span>
      </div>
    </div>
  );
}
