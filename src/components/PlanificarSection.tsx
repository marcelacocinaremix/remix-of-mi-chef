import { useState, useEffect } from "react";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { PaywallModal } from "@/components/PaywallModal";
import { PlanificarSkeleton } from "@/components/skeletons/TabSkeletons";
import calendarBanner from "@/assets/calendar-banner.jpg";

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
  const { t } = useLanguage();
  const [showPaywall, setShowPaywall] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return <PlanificarSkeleton />;

  return (
    <div className="space-y-4">
      {/* Slim Banner */}
      <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-md transition-all duration-150">
        <img
          src={calendarBanner}
          alt={t("planBannerCalendarTitle")}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">{t("planBannerCalendarTitle")}</h3>
            <p className="text-white/80 text-xs font-light">{t("planBannerCalendarDesc")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        <MonthlyCalendar onNavigateToCooking={onNavigateToCooking || (() => {})} />
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
};
