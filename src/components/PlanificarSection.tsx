import { useState } from "react";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { Pantry } from "./Pantry";
import { ShoppingListDirect } from "./ShoppingListDirect";
import { CalendarDays, Package, ShoppingCart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";
import { Button } from "@/components/ui/button";
import calendarBanner from "@/assets/calendar-banner.jpg";
import pantryBanner from "@/assets/pantry-banner-fixed.jpg";
import superBanner from "@/assets/super-banner.jpg";

type SubTab = "calendario" | "despensa" | "super";

// Banner images for each sub-tab with title and description
const bannerImages: Record<SubTab, { src: string; alt: string; title: string; description: string }> = {
  calendario: { src: calendarBanner, alt: "Planificador de comidas", title: "Calendario", description: "Planificá tus comidas de la semana" },
  despensa: { src: pantryBanner, alt: "Tu despensa", title: "Tu Despensa", description: "Gestioná tus ingredientes" },
  super: { src: superBanner, alt: "Lista de supermercado", title: "Lista de Super", description: "Organizá tus compras" },
};

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
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canUseFeature, isTrialActive, trialDaysRemaining, isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const planBlocked = !canUseFeature('planificador_modify');

  const subTabs = [
    { id: "calendario" as SubTab, label: t("subTabCalendar"), icon: CalendarDays },
    { id: "despensa" as SubTab, label: t("subTabPantry"), icon: Package },
    { id: "super" as SubTab, label: t("subTabGrocery"), icon: ShoppingCart },
  ];

  const currentBanner = bannerImages[activeSubTab];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-3 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  onSubTabChange?.(tab.id);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl font-medium text-xs transition-all duration-300",
                  activeSubTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "bg-background/60 hover:bg-background text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", activeSubTab === tab.id && "animate-bounce")} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Banner Image */}
      <div className="relative w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={currentBanner.src} 
          alt={currentBanner.alt} 
          className="w-full h-full object-cover transition-all duration-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="px-5">
            <h3 className="text-white font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {currentBanner.title}
            </h3>
            <p className="text-white text-sm drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              {currentBanner.description}
            </p>
          </div>
        </div>
      </div>

      {/* Blocked banner */}
      {planBlocked && activeSubTab === "calendario" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Tu prueba gratuita terminó</p>
            <p className="text-xs text-muted-foreground">Podés ver tu planificación pero no agregar o modificar</p>
          </div>
          <Button size="sm" onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
            Premium
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="animate-fade-in">
        {activeSubTab === "calendario" && (
          <MonthlyCalendar
            onNavigateToCooking={onNavigateToCooking || (() => {})}
            onBlockedAction={planBlocked ? () => setShowPaywall(true) : undefined}
          />
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

      {/* Trial info */}
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
