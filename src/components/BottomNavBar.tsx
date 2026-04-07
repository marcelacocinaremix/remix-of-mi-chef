import { UtensilsCrossed, Bookmark, Package, ShoppingCart, LayoutGrid, Lock } from "lucide-react";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export type MainTab = "cocinar" | "micocina" | "despensa" | "super" | "mas";

interface BottomNavBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  clickedTab?: string | null;
}

const NAV_ITEMS: { id: MainTab; labelKey: string; icon: React.ElementType; requiresAuth: boolean; lockedWhenExpired?: boolean }[] = [
  { id: "cocinar",    labelKey: "menuCook",        icon: UtensilsCrossed,  requiresAuth: false },
  { id: "micocina",   labelKey: "menuMyKitchen",   icon: Bookmark,         requiresAuth: true  },
  { id: "despensa",   labelKey: "subTabPantry",    icon: Package,          requiresAuth: true  },
  { id: "super",      labelKey: "menuShopping",    icon: ShoppingCart,     requiresAuth: true  },
  { id: "mas",        labelKey: "menuMore",        icon: LayoutGrid,       requiresAuth: false },
];

export function BottomNavBar({ activeTab, onTabChange, clickedTab }: BottomNavBarProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasAnyAccess } = usePremium();
  const isFuture = theme === "future";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/20"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06), 0 -1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto" style={{ height: 65 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isClicked = clickedTab === item.id;
          const showLock = item.lockedWhenExpired && user && !hasAnyAccess;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative",
                "transition-all duration-300 ease-in-out active:scale-90",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/70 hover:text-muted-foreground"
              )}
            >
              {/* Active indicator pill — top line */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full transition-all duration-300 ease-in-out",
                  isActive
                    ? "w-8 bg-primary opacity-100"
                    : "w-0 bg-transparent opacity-0"
                )}
              />

              {/* Icon container */}
              <div className="relative flex items-center justify-center w-10 h-8">
                {isActive && (
                  <span
                    className={cn(
                      "absolute inset-0 rounded-xl transition-all duration-300",
                      isFuture
                        ? "bg-primary/12 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                        : "bg-primary/8"
                    )}
                  />
                )}
                <div className={cn(
                  "relative flex items-center justify-center transition-transform duration-300",
                  isClicked && "animate-bounce"
                )}>
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    className="relative z-10 transition-all duration-300"
                  />
                  {showLock && (
                    <Lock
                      size={9}
                      strokeWidth={2}
                      className="absolute -top-1 -right-1 text-amber-500 z-20"
                    />
                  )}
                </div>
              </div>

              {/* Label */}
              <span
                className={cn(
                  "leading-none truncate w-full text-center transition-all duration-300",
                  isActive ? "font-semibold text-[11px]" : "font-normal text-[10px]"
                )}
              >
                {t(item.labelKey as any)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
