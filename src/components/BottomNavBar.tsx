import { Home, ChefHat, Heart, Calendar, HeartPulse, MoreHorizontal, Lock } from "lucide-react";
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
  { id: "inicio",     labelKey: "menuHome",       icon: Home,       requiresAuth: false },
  { id: "cocinar",    labelKey: "menuCook",        icon: ChefHat,    requiresAuth: false },
  { id: "micocina",   labelKey: "menuMyKitchen",   icon: Heart,      requiresAuth: true  },
  { id: "planificar", labelKey: "menuPlan",        icon: Calendar,   requiresAuth: true  },
  { id: "balance",    labelKey: "subTabHealth",    icon: HeartPulse, requiresAuth: true,  lockedWhenExpired: true },
  { id: "mas",        labelKey: "menuMore",        icon: MoreHorizontal, requiresAuth: false },
];

export function BottomNavBar({ activeTab, onTabChange, clickedTab }: BottomNavBarProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasAnyAccess } = usePremium();
  const isFuture = theme === "future";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-inset-bottom">
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
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 flex-1 min-w-0 transition-all duration-200 active:scale-90 ${
                isActive
                  ? isFuture
                    ? "text-primary"
                    : "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                {isActive && (
                  <span
                    className={`absolute inset-0 -m-1.5 rounded-xl ${
                      isFuture
                        ? "bg-primary/10 shadow-[0_0_8px_hsl(195_100%_50%/0.4)]"
                        : "bg-primary/10"
                    }`}
                  />
                )}
                <div className={`relative ${isClicked ? "animate-bounce" : ""}`}>
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                      isActive ? "drop-shadow-sm scale-110" : ""
                    }`}
                  />
                  {showLock && (
                    <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-500 z-20" />
                  )}
                </div>
              </div>
              <span className={`text-[10px] leading-tight font-medium truncate w-full text-center ${isActive ? "font-semibold" : ""}`}>
                {t(item.labelKey as any)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
