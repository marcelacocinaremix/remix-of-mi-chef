import { useState } from "react";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { Pantry } from "./Pantry";
import { ShoppingListDirect } from "./ShoppingListDirect";
import { CalendarDays, Package, ShoppingCart, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import calendarBanner from "@/assets/calendar-banner.jpg";
import pantryBanner from "@/assets/pantry-banner-fixed.jpg";
import superBanner from "@/assets/super-banner.jpg";

type SubTab = "calendario" | "despensa" | "super";

const getBannerImages = (t: (key: any) => string): Record<SubTab, { src: string; title: string; description: string }> => ({
  calendario: { src: calendarBanner, title: t("planBannerCalendarTitle"), description: t("planBannerCalendarDesc") },
  despensa:   { src: pantryBanner,   title: t("planBannerPantryTitle"),   description: t("planBannerPantryDesc")   },
  super:      { src: superBanner,    title: t("planBannerShoppingTitle"), description: t("planBannerShoppingDesc") },
});

interface PlanificarSectionProps {
  ingredients: string[];
  pantryItems: string[];
  onStateChange: (state: { isActive: boolean; isGeneratingAI: boolean; mealsPlanned: number }) => void;
  onSelectIngredients: (items: string[]) => void;
  onSubTabChange?: (subTab: string) => void;
  onNavigateToCooking?: () => void;
}

export const PlanificarSection = ({
  ingredients,
  pantryItems,
  onStateChange,
  onSelectIngredients,
  onSubTabChange,
  onNavigateToCooking,
}: PlanificarSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("calendario");
  const { t } = useLanguage();
  const { isTrialActive, trialDaysRemaining, isPremium, hasAnyAccess } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  const currentTabBlocked = !hasAnyAccess && (activeSubTab === "despensa" || activeSubTab === "super");

  const subTabs = [
    { id: "calendario" as SubTab, label: t("subTabCalendar"), icon: CalendarDays, premium: false },
    { id: "despensa"   as SubTab, label: t("subTabPantry"),   icon: Package,      premium: true  },
    { id: "super"      as SubTab, label: t("subTabGrocery"),  icon: ShoppingCart, premium: true  },
  ];

  const bannerImages = getBannerImages(t);
  const currentBanner = bannerImages[activeSubTab];

  const handleTabChange = (id: SubTab) => {
    setActiveSubTab(id);
    onSubTabChange?.(id);
  };

  return (
    <div className="space-y-4">
      {/* Slim Banner */}
      <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-md transition-all duration-150">
        <img
          src={currentBanner.src}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">{currentBanner.title}</h3>
            <p className="text-white/80 text-xs font-light">{currentBanner.description}</p>
          </div>
        </div>
      </div>

      {/* Blocked banner */}
      {currentTabBlocked && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">
                <span className="font-medium text-foreground">Función Premium.</span>{" "}
                Activá para usar Despensa y Super.
              </p>
              <Button size="sm" onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-7 px-2.5 flex-shrink-0">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segmented Control — underline style */}
      <div className="flex border-b border-border/50">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          const isBlocked = !hasAnyAccess && tab.premium;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 pb-2.5 pt-1 text-xs font-medium transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2 : 1.5} />
                {isBlocked && (
                  <Lock className="w-2 h-2 absolute -top-1 -right-1 text-amber-500" />
                )}
              </div>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4/5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content with overlay when blocked */}
      <div className="relative">
        <div className={cn("animate-fade-in", currentTabBlocked && "opacity-50 pointer-events-none")}>
          {activeSubTab === "calendario" && (
            <MonthlyCalendar onNavigateToCooking={onNavigateToCooking || (() => {})} />
          )}
          {activeSubTab === "despensa" && (
            <div className="max-w-xl mx-auto">
              <Pantry onSelectIngredients={onSelectIngredients} />
            </div>
          )}
          {activeSubTab === "super" && (
            <div className="max-w-xl mx-auto">
              <ShoppingListDirect />
            </div>
          )}
        </div>
        {currentTabBlocked && (
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setShowPaywall(true)} />
        )}
      </div>

      {!isPremium && isTrialActive && (
        <div className="text-center py-2">
          <span className="text-xs text-muted-foreground">
            🎁 Prueba gratuita: {trialDaysRemaining} días restantes
          </span>
        </div>
      )}

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
};
