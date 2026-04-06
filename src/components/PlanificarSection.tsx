import { useState, useEffect } from "react";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { Pantry } from "./Pantry";
import { ShoppingListDirect } from "./ShoppingListDirect";
import { CalendarDays, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { PaywallModal } from "@/components/PaywallModal";
import { PlanificarSkeleton } from "@/components/skeletons/TabSkeletons";
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
  const [showPaywall, setShowPaywall] = useState(false);

  const subTabs = [
    { id: "calendario" as SubTab, label: t("subTabCalendar"), icon: CalendarDays },
    { id: "despensa"   as SubTab, label: t("subTabPantry"),   icon: Package      },
    { id: "super"      as SubTab, label: t("subTabGrocery"),  icon: ShoppingCart },
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">{currentBanner.title}</h3>
            <p className="text-white/80 text-xs font-light">{currentBanner.description}</p>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex border-b border-border/50">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
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
              <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4/5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
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

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
};
