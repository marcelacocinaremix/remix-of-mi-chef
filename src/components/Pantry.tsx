import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, X, Package, Search, Star, ShoppingCart, ChefHat,
  Calendar, AlertTriangle, Sparkles, Trophy, Gift, Heart,
  ArrowRight, Lightbulb, Filter, Grid3X3, List, DoorOpen, Refrigerator, Check, Info
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PANTRY_HELP_KEY = "miChef_pantry_help_dismissed";

function PantryHelpBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLanguage();
  const steps = [
    { num: 1, emoji: "➕", title: t("pantryStep1Title"), desc: t("pantryStep1Desc") },
    { num: 2, emoji: "📦", title: t("pantryStep2Title"), desc: t("pantryStep2Desc") },
    { num: 3, emoji: "⚠️", title: t("pantryStep3Title"), desc: t("pantryStep3Desc") },
    { num: 4, emoji: "🍳", title: t("pantryStep4Title"), desc: t("pantryStep4Desc") },
  ];
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">{t("pantryHowItWorks")}</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {steps.map((s) => (
          <div key={s.num} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/70">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20 bg-primary/10 text-primary">
              {s.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><span>{s.emoji}</span> {s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PantrySmartHistory from "@/components/PantrySmartHistory";

interface PantryItem {
  id: string;
  ingredient_name: string;
  category: string;
  quantity?: number;
  unit?: string;
  expiration_date?: string | null;
  is_favorite?: boolean;
  source?: string;
  scanned_product_id?: string | null;
}

const CATEGORIES = [
  { id: "verduras", label: "Verduras", emoji: "🥬", color: "from-green-500 to-emerald-600", bgColor: "bg-green-50 dark:bg-green-950/30", textColor: "text-green-700 dark:text-green-300", shelfColor: "from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-950/20" },
  { id: "frutas", label: "Frutas", emoji: "🍎", color: "from-red-500 to-rose-600", bgColor: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-700 dark:text-red-300", shelfColor: "from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-950/20" },
  { id: "carnes", label: "Carnes", emoji: "🥩", color: "from-rose-500 to-pink-600", bgColor: "bg-rose-50 dark:bg-rose-950/30", textColor: "text-rose-700 dark:text-rose-300", shelfColor: "from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-950/20" },
  { id: "lacteos", label: "Lácteos", emoji: "🧀", color: "from-yellow-500 to-amber-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", textColor: "text-yellow-700 dark:text-yellow-300", shelfColor: "from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-950/20" },
  { id: "granos", label: "Granos", emoji: "🌾", color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", textColor: "text-amber-700 dark:text-amber-300", shelfColor: "from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/20" },
  { id: "condimentos", label: "Condimentos", emoji: "🧂", color: "from-purple-500 to-violet-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", textColor: "text-purple-700 dark:text-purple-300", shelfColor: "from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-950/20" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤", color: "from-blue-500 to-cyan-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-700 dark:text-blue-300", shelfColor: "from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20" },
  { id: "congelados", label: "Congelados", emoji: "🧊", color: "from-cyan-500 to-teal-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/30", textColor: "text-cyan-700 dark:text-cyan-300", shelfColor: "from-cyan-100 to-cyan-50 dark:from-cyan-900/40 dark:to-cyan-950/20" },
  { id: "otros", label: "Otros", emoji: "📦", color: "from-gray-500 to-slate-600", bgColor: "bg-gray-50 dark:bg-gray-950/30", textColor: "text-gray-700 dark:text-gray-300", shelfColor: "from-gray-100 to-gray-50 dark:from-gray-900/40 dark:to-gray-950/20" },
];

const UNITS_KEYS = ["unidades", "kg", "g", "litros", "ml", "paquetes", "latas"];

interface PantryProps {
  onSelectIngredients: (ingredients: string[]) => void;
}

// Helper function to calculate days until expiration
function getDaysUntilExpiration(expirationDate: string | null | undefined): number | null {
  if (!expirationDate) return null;
  const expiry = new Date(expirationDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Get expiration status color
function getExpirationStatus(daysLeft: number | null): { color: string; urgency: 'expired' | 'urgent' | 'warning' | 'ok' | null } {
  if (daysLeft === null) return { color: '', urgency: null };
  if (daysLeft < 0) return { color: 'bg-red-600', urgency: 'expired' };
  if (daysLeft === 0) return { color: 'bg-red-500', urgency: 'expired' };
  if (daysLeft <= 2) return { color: 'bg-orange-500', urgency: 'urgent' };
  if (daysLeft <= 5) return { color: 'bg-yellow-500', urgency: 'warning' };
  return { color: 'bg-green-500', urgency: 'ok' };
}

// Animated product item component
function ProductItem({
  item,
  category,
  onRemove,
  onToggleFavorite,
  onAddToShoppingList,
  onUseIngredient,
  onEditExpiration,
  index,
}: {
  item: PantryItem;
  category: typeof CATEGORIES[0];
  onRemove: () => void;
  onToggleFavorite: () => void;
  onAddToShoppingList: () => void;
  onUseIngredient: () => void;
  onEditExpiration: () => void;
  index: number;
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    placement: "below" | "above";
  } | null>(null);

  const daysLeft = getDaysUntilExpiration(item.expiration_date);
  const expirationStatus = getExpirationStatus(daysLeft);

  useEffect(() => {
    setJustAdded(true);
    const timer = setTimeout(() => setJustAdded(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const computeMenuPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 200;
    const menuHeight = menuRef.current?.offsetHeight ?? 240;

    const viewportPadding = 12;
    const desiredGap = 10;

    // Horizontal: center on element, but clamp to viewport
    let left = rect.left + rect.width / 2;
    const halfMenu = menuWidth / 2;
    
    // Clamp left edge
    if (left - halfMenu < viewportPadding) {
      left = viewportPadding + halfMenu;
    }
    // Clamp right edge
    if (left + halfMenu > window.innerWidth - viewportPadding) {
      left = window.innerWidth - viewportPadding - halfMenu;
    }

    // Vertical: prefer below, fallback above
    const belowTop = rect.bottom + desiredGap;
    const wouldOverflowBottom = belowTop + menuHeight > window.innerHeight - viewportPadding;

    let placement: "below" | "above" = "below";
    let top = belowTop;

    const aboveTop = rect.top - desiredGap;
    const fitsAbove = aboveTop - menuHeight > viewportPadding;

    if (wouldOverflowBottom && fitsAbove) {
      placement = "above";
      top = aboveTop;
    }

    setMenuPos({ left, top, placement });
  }, []);

  useLayoutEffect(() => {
    if (!isMenuOpen) return;
    computeMenuPos();
    // re-measure after first paint to capture real menu height
    const raf = requestAnimationFrame(computeMenuPos);
    return () => cancelAnimationFrame(raf);
  }, [isMenuOpen, computeMenuPos]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onReposition = () => computeMenuPos();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [isMenuOpen, computeMenuPos]);

  // Close menu when clicking outside (works with portal)
  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const inAnchor = !!anchorRef.current?.contains(target);
      const inMenu = !!menuRef.current?.contains(target);
      if (inAnchor || inMenu) return;

      setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isMenuOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const { t } = useLanguage();

  const menuActions = [
    {
      icon: ChefHat,
      label: t("pantryCookAction"),
      variant: "default" as const,
      action: onUseIngredient,
    },
    {
      icon: Calendar,
      label: t("pantryExpiryAction"),
      variant: "secondary" as const,
      action: onEditExpiration,
    },
    {
      icon: Star,
      label: item.is_favorite ? t("pantryFavoriteRemove") : t("pantryFavoriteAdd"),
      variant: (item.is_favorite ? "secondary" : "outline") as "secondary" | "outline",
      action: onToggleFavorite,
      filled: item.is_favorite,
    },
    {
      icon: ShoppingCart,
      label: t("pantryToListAction"),
      variant: "outline" as const,
      action: onAddToShoppingList,
    },
    {
      icon: X,
      label: t("pantryRemoveAction"),
      variant: "destructive" as const,
      action: onRemove,
    },
  ];

  return (
    <div
      className={cn(
        "relative product-item-container transition-all duration-300",
        "animate-in fade-in slide-in-from-bottom-2",
        justAdded && "scale-110"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Product container - clickable */}
      <div
        ref={anchorRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsMenuOpen((v) => !v);
          }
          if (e.key === "Escape") setIsMenuOpen(false);
        }}
        className={cn(
          "relative w-16 h-20 md:w-20 md:h-24 flex flex-col items-center justify-end cursor-pointer",
          "rounded-lg transition-all duration-300",
          "hover:scale-105 hover:-translate-y-1",
          isMenuOpen && "scale-105 -translate-y-1 z-30 shadow-xl"
        )}
      >
        {/* Product visual */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg border-2 transition-all duration-300",
            "bg-gradient-to-b",
            category.shelfColor,
            isMenuOpen
              ? "border-primary shadow-xl ring-2 ring-primary/30"
              : "border-border/30 hover:border-primary/50"
          )}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 via-transparent to-transparent" />

          {/* Emoji icon */}
          <div
            className={cn(
              "absolute top-2 left-1/2 -translate-x-1/2 text-2xl md:text-3xl transition-transform duration-300",
              isMenuOpen && "scale-110"
            )}
          >
            {category.emoji}
          </div>

          {/* Quantity indicator */}
          {item.quantity && item.quantity > 1 && (
            <div className="absolute bottom-1 right-1 z-10 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              x{item.quantity}
            </div>
          )}
          {item.quantity === 1 && item.unit && item.unit !== 'unidad' && (
            <div className="absolute bottom-1 right-1 z-10 bg-muted text-muted-foreground text-[8px] font-medium px-1 py-0.5 rounded shadow-sm">
              1 {item.unit.slice(0, 2)}
            </div>
          )}
        </div>

        {/* Favorite indicator */}
        {item.is_favorite && (
          <div className="absolute -top-1 -right-1 z-20">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow animate-pulse" />
          </div>
        )}

        {/* Expiration indicator */}
        {daysLeft !== null && (
          <div
            className={cn(
              "absolute -top-1 -left-1 z-20 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white",
              expirationStatus.color,
              expirationStatus.urgency === "expired" && "animate-pulse"
            )}
          >
            {daysLeft < 0 ? "⚠️" : daysLeft === 0 ? "HOY" : `${daysLeft}d`}
          </div>
        )}

        {/* Product label */}
        <div
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 w-[110%]",
            "bg-card text-card-foreground rounded-md px-1.5 py-0.5",
            "border border-border/50 shadow-sm",
            "transition-all duration-300",
            isMenuOpen && "shadow-lg"
          )}
        >
          <p className="text-[10px] md:text-xs font-medium text-center truncate capitalize">
            {item.ingredient_name}
          </p>
        </div>
      </div>

      {/* Floating Action Menu (Portal: avoids clipping by overflow containers) */}
      {isMenuOpen && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Acciones para ${item.ingredient_name}`}
            className={cn(
              "fixed z-[9999]",
              "bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border",
              "p-3 min-w-[200px]",
              "animate-in fade-in zoom-in-95 duration-150",
              "-translate-x-1/2",
              menuPos.placement === "above" && "-translate-y-full"
            )}
            style={{ left: menuPos.left, top: menuPos.top, backgroundColor: "hsl(var(--popover))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            {menuPos.placement === "below" ? (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-popover border-l border-t border-border/50" />
            ) : (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-popover border-r border-b border-border/50" />
            )}

            {/* Product name header */}
            <div className="text-center pb-2 mb-2 border-b border-border/30">
              <p className="font-semibold text-sm capitalize">{item.ingredient_name}</p>
              {item.quantity && (
                <p className="text-xs text-primary font-medium">
                  {item.quantity} {item.unit || 'unidad'}{item.quantity > 1 && item.unit !== 'unidades' ? 's' : ''}
                </p>
              )}
              {daysLeft !== null && (
                <p
                  className={cn(
                    "text-xs",
                    expirationStatus.urgency === "expired"
                      ? "text-red-500"
                      : expirationStatus.urgency === "urgent"
                        ? "text-orange-500"
                        : expirationStatus.urgency === "warning"
                          ? "text-yellow-600"
                          : "text-green-500"
                  )}
                >
                  {daysLeft < 0
                    ? t("pantryExpiredAgo").replace("{days}", String(Math.abs(daysLeft)))
                    : daysLeft === 0
                      ? t("pantryExpiredTodayLabel")
                      : daysLeft === 1
                        ? t("pantryExpiredTomorrowLabel")
                        : t("pantryExpiredInDays").replace("{days}", String(daysLeft))}
                </p>
              )}
            </div>

            {/* Action buttons grid */}
            <div className="grid grid-cols-5 gap-2">
              {menuActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={i}
                    type="button"
                    variant={action.variant}
                    size="icon"
                    onClick={() => handleAction(action.action)}
                    className="h-10 w-10 rounded-lg"
                    title={action.label}
                  >
                    <Icon className={cn("h-4 w-4", action.filled && "fill-current")} />
                  </Button>
                );
              })}
            </div>

            {/* Labels */}
            <div className="grid grid-cols-5 gap-2 mt-1">
              {menuActions.map((action, i) => (
                <p key={i} className="text-[9px] text-center text-muted-foreground truncate">
                  {action.label}
                </p>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// Shelf component
function PantryShelf({ 
  category, 
  items, 
  onRemove, 
  onToggleFavorite, 
  onAddToShoppingList,
  onUseIngredient,
  onEditExpiration,
  onUseCategoryIngredients,
  index 
}: {
  category: typeof CATEGORIES[0];
  items: PantryItem[];
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddToShoppingList: (name: string, cat: string) => void;
  onUseIngredient: (name: string) => void;
  onEditExpiration: (item: PantryItem) => void;
  onUseCategoryIngredients: () => void;
  index: number;
}) {
  const { t } = useLanguage();
  return (
    <div 
      className={cn(
        "relative animate-in fade-in slide-in-from-left-4",
        "transition-all duration-500"
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'backwards'
      }}
    >
      {/* Shelf header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br",
            category.color,
            "shadow-lg"
          )}>
            <span className="text-lg drop-shadow">{category.emoji}</span>
          </div>
          <div>
            <h4 className={cn("font-semibold text-sm", category.textColor)}>{category.label}</h4>
            <p className="text-[10px] text-muted-foreground">{items.length} {t("pantryShelveProducts")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 h-7"
          onClick={onUseCategoryIngredients}
        >
          {t("pantryUseAllCategory")} <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Shelf container - looks like a wooden shelf */}
      <div className="relative">
        {/* Shelf back */}
        <div className={cn(
          "absolute inset-0 rounded-xl",
          "bg-gradient-to-b from-amber-100/50 to-amber-200/50 dark:from-amber-900/20 dark:to-amber-950/20",
          "border-2 border-amber-300/30 dark:border-amber-700/30"
        )} />

        {/* Shelf surface with wood texture effect */}
        <div className={cn(
          "relative min-h-[120px] md:min-h-[140px] p-3 pt-4",
          "rounded-xl overflow-visible"
        )}>
          {/* Wood grain lines */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-px bg-amber-800 dark:bg-amber-400"
                style={{ top: `${20 + i * 20}%` }}
              />
            ))}
          </div>

          {/* Products on shelf */}
          <div className="relative flex flex-wrap gap-2 md:gap-3 items-end min-h-[80px] md:min-h-[100px]">
            {items.map((item, itemIndex) => (
              <ProductItem
                key={item.id}
                item={item}
                category={category}
                onRemove={() => onRemove(item.id)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
                onAddToShoppingList={() => onAddToShoppingList(item.ingredient_name, item.category)}
                onUseIngredient={() => onUseIngredient(item.ingredient_name)}
                onEditExpiration={() => onEditExpiration(item)}
                index={itemIndex}
              />
            ))}
            
            {/* Empty shelf message */}
            {items.length === 0 && (
              <div className="w-full text-center py-4 text-muted-foreground text-sm">
                {t("emptyShelf")}
              </div>
            )}
          </div>
        </div>

        {/* Shelf edge (3D effect) */}
        <div className={cn(
          "h-3 rounded-b-xl",
          "bg-gradient-to-b from-amber-400/60 to-amber-600/60 dark:from-amber-600/40 dark:to-amber-800/40",
          "border-x-2 border-b-2 border-amber-500/30 dark:border-amber-600/30",
          "shadow-lg"
        )} />
      </div>
    </div>
  );
}

export function Pantry({ onSelectIngredients }: PantryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addItem: addToShoppingList } = useShoppingList();
  const { t } = useLanguage();

  // Dynamic i18n constants
  const MARCELA_TIPS = [
    `💡 ${t("pantryTip1")}`,
    `💡 ${t("pantryTip2")}`,
    `💡 ${t("pantryTip3")}`,
    `💡 ${t("pantryTip4")}`,
    `💡 ${t("pantryTip5")}`,
    `💡 ${t("pantryTip6")}`,
    `💡 ${t("pantryTip7")}`,
  ];

  const ACHIEVEMENTS = [
    { id: "starter", name: t("starterAchievement"), icon: "🌱", requirement: 5, description: t("addIngredientAchievement").replace("{count}", "5") },
    { id: "organized", name: t("organizedAchievement"), icon: "📋", requirement: 10, description: t("addIngredientAchievement").replace("{count}", "10") },
    { id: "chef", name: t("chefAchievement"), icon: "👨‍🍳", requirement: 20, description: t("addIngredientAchievement").replace("{count}", "20") },
    { id: "master", name: t("masterAchievement"), icon: "🏆", requirement: 50, description: t("addIngredientAchievement").replace("{count}", "50") },
  ];

  const PANTRY_STEPS = [
    { id: 1, label: t("pantryStepAdd"), description: t("pantryStepAddDesc"), icon: Plus },
    { id: 2, label: t("pantryStepMyPantry"), description: t("pantryStepMyPantryDesc"), icon: Package },
    { id: 3, label: t("pantryStepUse"), description: t("pantryStepUseDesc"), icon: ChefHat },
  ];

  const UNITS = [t("units"), t("kg"), t("g"), t("liters"), t("ml"), t("packages"), t("cans")];

  
  // Step state for guided flow
  const [currentStep, setCurrentStep] = useState(2); // Default to "Mi Despensa"
  
  const [items, setItems] = useState<PantryItem[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("otros");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState("unidades");
  const [expirationDate, setExpirationDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [doorOpen, setDoorOpen] = useState(true);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);
  const [editExpirationDate, setEditExpirationDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchPantryItems();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % MARCELA_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchPantryItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .eq("user_id", user.id)
        .order("category");

      if (error) throw error;
      setItems(data?.map(item => ({
        ...item,
        quantity: item.quantity || 1,
        unit: item.unit || "unidad",
        is_favorite: false,
        source: item.source || 'manual',
        scanned_product_id: item.scanned_product_id || null,
      })) || []);
    } catch (error) {
      console.error("Error fetching pantry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;

    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar tu despensa.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pantry_items")
        .insert({
          user_id: user.id,
          ingredient_name: newIngredient.trim().toLowerCase(),
          category: selectedCategory,
          expiration_date: expirationDate || null,
          quantity: parseInt(quantity) || 1,
          unit: unit,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: PantryItem = {
        ...data,
        quantity: parseInt(quantity) || 1,
        unit,
        is_favorite: false,
      };

      setItems([...items, newItem]);
      setNewIngredient("");
      setQuantity("1");
      setExpirationDate("");
      setShowAddDialog(false);
      
      toast({
        title: "¡Agregado al estante! 🎉",
        description: `${newIngredient} se agregó a tu despensa.`,
      });

      checkAchievements(items.length + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el ingrediente.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveIngredient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pantry_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== id));
      toast({
        title: "Producto retirado",
        description: "Se quitó del estante",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingrediente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
    ));
    const item = items.find(i => i.id === id);
    toast({
      title: item?.is_favorite ? "Quitado de favoritos" : "¡Agregado a favoritos! ⭐",
      description: item?.ingredient_name,
    });
  };

  const handleAddToShoppingList = async (ingredientName: string, category: string) => {
    await addToShoppingList(ingredientName, category);
  };

  const handleUseAllIngredients = () => {
    const ingredientNames = items.map((item) => item.ingredient_name);
    onSelectIngredients(ingredientNames);
    toast({
      title: "¡Listo!",
      description: `Se agregaron ${ingredientNames.length} ingredientes para cocinar.`,
    });
  };

  const handleUseCategoryIngredients = (categoryId: string) => {
    const categoryItems = items.filter(item => item.category === categoryId);
    const ingredientNames = categoryItems.map(item => item.ingredient_name);
    onSelectIngredients(ingredientNames);
    toast({
      title: "¡Listo!",
      description: `Se agregaron ${ingredientNames.length} ingredientes de esta categoría.`,
    });
  };

  const checkAchievements = (count: number) => {
    const achievement = ACHIEVEMENTS.find(a => a.requirement === count);
    if (achievement) {
      toast({
        title: `🏆 ¡Logro desbloqueado!`,
        description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
      });
    }
  };

  const expiringItems = useMemo(() => {
    return items.filter(item => {
      if (!item.expiration_date) return false;
      const daysLeft = getDaysUntilExpiration(item.expiration_date);
      return daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
    });
  }, [items]);

  const expiredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.expiration_date) return false;
      const daysLeft = getDaysUntilExpiration(item.expiration_date);
      return daysLeft !== null && daysLeft < 0;
    });
  }, [items]);

  const handleEditExpiration = (item: PantryItem) => {
    setEditingItem(item);
    setEditExpirationDate(item.expiration_date || "");
    setShowExpirationDialog(true);
  };

  const handleSaveExpiration = async () => {
    if (!editingItem || !user) return;

    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({ expiration_date: editExpirationDate || null })
        .eq("id", editingItem.id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, expiration_date: editExpirationDate || null }
          : item
      ));

      setShowExpirationDialog(false);
      setEditingItem(null);
      
      toast({
        title: "Vencimiento actualizado",
        description: editExpirationDate 
          ? `Vence el ${new Date(editExpirationDate).toLocaleDateString('es-AR')}`
          : "Se quitó la fecha de vencimiento",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el vencimiento.",
        variant: "destructive",
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesFavorite = !showFavoritesOnly || item.is_favorite;
      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [items, searchTerm, filterCategory, showFavoritesOnly]);

  const groupedItems = useMemo(() => {
    const manualItems = filteredItems.filter(item => item.source !== 'scanned');
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: manualItems.filter((item) => item.category === cat.id),
    })).filter((cat) => cat.items.length > 0);
  }, [filteredItems]);

  const scannedItems = useMemo(() => {
    return filteredItems.filter(item => item.source === 'scanned');
  }, [filteredItems]);

  const currentAchievement = [...ACHIEVEMENTS].reverse().find(a => items.length >= a.requirement);
  const nextAchievement = ACHIEVEMENTS.find(a => items.length < a.requirement);
  const progressToNext = nextAchievement 
    ? Math.round((items.length / nextAchievement.requirement) * 100) 
    : 100;

  if (!user) {
    return (
      <div className={cn(
        "bg-card rounded-xl p-6 border border-border/50",
        "text-center"
      )}>
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">Tu Despensa</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Iniciá sesión para guardar tus ingredientes y no tener que escribirlos cada vez.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Help banner */}
      {showHelp && <PantryHelpBanner onDismiss={() => { localStorage.setItem(PANTRY_HELP_KEY, "1"); setShowHelp(false); }} />}
      {!showHelp && (
        <button
          onClick={() => setShowHelp(true)}
          className="animate-neon-pulse flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-400/40 bg-sky-500/5 text-sky-500 text-xs font-medium transition-colors duration-300 hover:bg-sky-500/15 hover:border-sky-400/70"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Ver cómo funciona</span>
        </button>
      )}
      {/* Dialog always rendered */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Agregar a la Despensa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ingrediente</label>
              <Input
                placeholder="Ej: Tomates, Arroz, Leche..."
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Estante (Categoría)</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "p-2 rounded-lg border text-xs transition-all duration-200",
                      "hover:scale-105",
                      selectedCategory === cat.id
                        ? `${cat.bgColor} border-primary ${cat.textColor} shadow-md`
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg block mb-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cantidad</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-20"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Vencimiento</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleAddIngredient} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="w-4 h-4" />
              Poner en el Estante
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expiration Dialog */}
      <Dialog open={showExpirationDialog} onOpenChange={setShowExpirationDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Fecha de Vencimiento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingItem && (
              <>
                <div className="text-center">
                  <p className="text-lg font-medium capitalize">{editingItem.ingredient_name}</p>
                  {editingItem.expiration_date && (
                    <p className="text-sm text-muted-foreground">
                      Vence: {new Date(editingItem.expiration_date).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Nueva fecha de vencimiento</label>
                  <Input
                    type="date"
                    value={editExpirationDate}
                    onChange={(e) => setEditExpirationDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setEditExpirationDate("");
                    }}
                  >
                    Quitar fecha
                  </Button>
                  <Button 
                    onClick={handleSaveExpiration}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    Guardar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Step Indicators */}
      <div className="bg-card rounded-2xl p-4 shadow-elevated border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Mi Despensa
          </h2>
          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            {items.length} productos
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {PANTRY_STEPS.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = step.id < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all duration-300",
                  "border-2",
                  isActive 
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-lg scale-[1.02]" 
                    : isCompleted
                      ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
                      : "border-border/50 hover:border-amber-500/30 hover:bg-accent/30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all",
                  isActive 
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" 
                    : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  isActive ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Step Description */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            {PANTRY_STEPS[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* STEP 1: Add Products */}
      {currentStep === 1 && (
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-elevated border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Agregar Productos</h3>
              <p className="text-xs text-muted-foreground">Sumá ingredientes a tu despensa</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ingrediente</label>
              <Input
                placeholder="Ej: Tomates, Arroz, Leche..."
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
                className="text-lg"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Estante (Categoría)</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-lg border text-xs transition-all duration-200",
                      "hover:scale-105",
                      selectedCategory === cat.id
                        ? `${cat.bgColor} border-primary ${cat.textColor} shadow-md`
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cantidad</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-20"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Vencimiento</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={() => {
                handleAddIngredient();
                setCurrentStep(2);
              }} 
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-lg py-6"
            >
              <Plus className="w-5 h-5" />
              Agregar a la Despensa
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: View Pantry */}
      {currentStep === 2 && (
      <div className="relative">
        {/* Cabinet frame - outer border */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900",
          "dark:from-amber-900 dark:via-amber-800 dark:to-amber-950",
          "p-1.5 md:p-2 shadow-2xl"
        )}>
          {/* Cabinet interior */}
          <div className={cn(
            "relative rounded-xl overflow-hidden",
            "bg-gradient-to-b from-amber-50 to-amber-100/80",
            "dark:from-gray-900 dark:to-gray-950",
            "min-h-[500px]"
          )}>
            {/* Cabinet back texture */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(180,130,80,0.1)_50px,rgba(180,130,80,0.1)_100px)]" />
            </div>

            {/* Header */}
            <div className={cn(
              "sticky top-0 z-30 p-4",
              "bg-gradient-to-b from-amber-50/95 via-amber-50/90 to-transparent",
              "dark:from-gray-900/95 dark:via-gray-900/90 dark:to-transparent",
              "backdrop-blur-sm"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-500",
                    "bg-gradient-to-br from-amber-500 to-orange-600",
                    "shadow-lg shadow-amber-500/30"
                  )}>
                    <DoorOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                      Mi Despensa
                    </h3>
                    <p className="text-xs text-muted-foreground">{items.length} productos en {groupedItems.length} estantes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentAchievement && (
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                      {currentAchievement.icon} {currentAchievement.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {nextAchievement && (
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Próximo: {nextAchievement.icon} {nextAchievement.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{items.length}/{nextAchievement.requirement}</span>
                  </div>
                  <div className="h-2 bg-amber-200/50 dark:bg-amber-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => setCurrentStep(1)}
                  className="gap-2 flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </Button>

                <Button
                  variant="outline" 
                  className="gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  onClick={() => setCurrentStep(3)}
                  disabled={items.length === 0}
                >
                  <ChefHat className="w-4 h-4" />
                  Usar para Cocinar
                </Button>
              </div>

              {/* Search */}
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en estantes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/80 dark:bg-gray-800/80"
                  />
                </div>
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={showFavoritesOnly ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
                </Button>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-3">
                <Badge
                  variant={filterCategory === null ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer whitespace-nowrap transition-all",
                    filterCategory === null && "bg-amber-500 hover:bg-amber-600"
                  )}
                  onClick={() => setFilterCategory(null)}
                >
                  Todos los estantes
                </Badge>
                {CATEGORIES.map((cat) => {
                  const count = items.filter(i => i.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={cat.id}
                      variant={filterCategory === cat.id ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer whitespace-nowrap gap-1 transition-all",
                        filterCategory === cat.id && cat.bgColor
                      )}
                      onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    >
                      {cat.emoji} {count}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Marcela's Tips */}
            <div className="px-4 mb-4">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-900/30 dark:to-orange-900/30",
                "border border-amber-200/50 dark:border-amber-700/50"
              )}>
                <div className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>💡</div>
                <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 animate-fade-in">
                  {MARCELA_TIPS[currentTip]}
                </p>
              </div>
            </div>

            {/* Expired Alert */}
            {expiredItems.length > 0 && (
              <div className="px-4 mb-4">
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  "bg-gradient-to-r from-red-200/80 to-red-100/80 dark:from-red-900/50 dark:to-red-800/30",
                  "border border-red-300/50 dark:border-red-600/50"
                )}>
                  <div className="p-2 rounded-full bg-red-600/30 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">
                      🚨 {expiredItems.length} producto{expiredItems.length > 1 ? 's' : ''} vencido{expiredItems.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {expiredItems.map(i => i.ingredient_name).join(', ')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      expiredItems.forEach(item => handleRemoveIngredient(item.id));
                    }}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            )}

            {/* Expiring Soon Alert */}
            {expiringItems.length > 0 && (
              <div className="px-4 mb-4">
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  "bg-gradient-to-r from-orange-100/80 to-yellow-100/80 dark:from-orange-900/30 dark:to-yellow-900/30",
                  "border border-orange-200/50 dark:border-orange-700/50"
                )}>
                  <div className="p-2 rounded-full bg-orange-500/20">
                    <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      ⏰ {expiringItems.length} producto{expiringItems.length > 1 ? 's' : ''} por vencer (próximos 3 días)
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {expiringItems.map(i => {
                        const days = getDaysUntilExpiration(i.expiration_date);
                        return `${i.ingredient_name} (${days === 0 ? 'hoy' : days === 1 ? 'mañana' : `${days} días`})`;
                      }).join(', ')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-orange-600 hover:bg-orange-100"
                    onClick={() => onSelectIngredients(expiringItems.map(i => i.ingredient_name))}
                  >
                    Usar ahora
                  </Button>
                </div>
              </div>
            )}

            {/* Shelves */}
            <div className="px-4 pb-4 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <Refrigerator className="w-16 h-16 text-amber-500 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">Abriendo despensa...</p>
                </div>
              ) : groupedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-900 rounded-xl transform rotate-3" />
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-700 dark:to-amber-800 rounded-xl flex items-center justify-center">
                      <Package className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg mb-2 text-amber-800 dark:text-amber-200">Estantes vacíos</h4>
                  <p className="text-muted-foreground text-sm">
                    ¡Es hora de llenar tu despensa! Usá el botón de arriba para agregar productos.
                  </p>
                </div>
              ) : (
                groupedItems.map((category, index) => (
                  <PantryShelf
                    key={category.id}
                    category={category}
                    items={category.items}
                    onRemove={handleRemoveIngredient}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToShoppingList={handleAddToShoppingList}
                    onUseIngredient={(name) => onSelectIngredients([name])}
                    onEditExpiration={handleEditExpiration}
                    onUseCategoryIngredients={() => handleUseCategoryIngredients(category.id)}
                    index={index}
                  />
                ))
              )}

              {/* Scanned Products Section */}
              {scannedItems.length > 0 && (
                <div className={cn(
                  "p-4 rounded-xl border-2 border-dashed",
                  "border-cyan-300 dark:border-cyan-700",
                  "bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20">
                      <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h4 className="font-medium text-sm text-cyan-700 dark:text-cyan-300">Productos Escaneados</h4>
                    <Badge variant="secondary" className="text-xs bg-cyan-100 dark:bg-cyan-900/50">{scannedItems.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scannedItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center gap-1 bg-cyan-100/80 dark:bg-cyan-900/30 rounded-full pl-3 pr-1 py-1",
                          "animate-in fade-in slide-in-from-left-2",
                          "hover:scale-105 transition-transform"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-sm capitalize">{item.ingredient_name}</span>
                        <button
                          onClick={() => handleRemoveIngredient(item.id)}
                          className="p-1 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cabinet handles */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 flex gap-8">
          <div className="w-8 h-2 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg" />
          <div className="w-8 h-2 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg" />
        </div>
      </div>
      )}

      {/* STEP 3: Use for Cooking */}
      {currentStep === 3 && (
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-elevated border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Usar para Cocinar</h3>
              <p className="text-xs text-muted-foreground">Seleccioná ingredientes y generá recetas</p>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200/50">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Tenés {items.length} productos en tu despensa
                </p>
              </div>

              <Button 
                className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={handleUseAllIngredients}
              >
                <ChefHat className="w-5 h-5" />
                Cocinar con todos los ingredientes
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 bg-accent/30 rounded-xl">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tu despensa está vacía</p>
              <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(1)}>
                Agregar productos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pantry Smart History Section */}
      <PantrySmartHistory 
        items={items}
        onAddToShoppingList={handleAddToShoppingList}
      />
    </div>
  );
}
