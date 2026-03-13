import { Home, UtensilsCrossed, Bookmark, Calendar, LayoutGrid, Lock } from "lucide-react";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";

export type MainTab = "inicio" | "cocinar" | "micocina" | "planificar" | "balance" | "mas";

interface BottomNavBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  clickedTab?: string | null;
}

const NAV_ITEMS: { id: MainTab; labelKey: string; icon: React.ElementType; requiresAuth: boolean; lockedWhenExpired?: boolean }[] = [
  { id: "inicio",     labelKey: "menuHome",       icon: Home,             requiresAuth: false },
  { id: "cocinar",    labelKey: "menuCook",        icon: UtensilsCrossed,  requiresAuth: false },
  { id: "micocina",   labelKey: "menuMyKitchen",   icon: Bookmark,         requiresAuth: true  },
  { id: "planificar", labelKey: "menuPlan",        icon: Calendar,         requiresAuth: true  },
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isClicked = clickedTab === item.id;
          const showLock = item.lockedWhenExpired && user && !hasAnyAccess;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-[3px] py-2.5 px-2 flex-1 min-w-0 transition-all duration-200 active:scale-90 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <div className="relative flex items-center justify-center w-9 h-9">
                {isActive && (
                  <span
                    className={`absolute inset-0 rounded-2xl ${
                      isFuture
                        ? "bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.25)]"
                        : "bg-primary/8"
                    }`}
                  />
                )}
                <div className={`relative flex items-center justify-center ${isClicked ? "animate-bounce" : ""}`}>
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="relative z-10 transition-all duration-200"
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
              <span
                className={`text-[11px] leading-none truncate w-full text-center transition-all duration-200 ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
                style={{ fontSize: "11px" }}
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
