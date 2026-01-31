import { useState } from "react";
import { FavoriteRecipes } from "./FavoriteRecipes";
import SmartHistory from "./SmartHistory";
import { AchievementsSection } from "./AchievementsSection";
import { ScannedProducts } from "./ScannedProducts";
import { Heart, History, Trophy, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "./RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import miCocinaBanner from "@/assets/mi-cocina-banner.jpg";

interface MiCocinaSectionProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onHistoryDeleted: () => void;
  onSelectSuggestion: (suggestion: { name: string; reason: string }) => void;
  onSubTabChange?: (subTab: string) => void;
}

type SubTab = "favoritos" | "historial" | "logros" | "escaneo";

export const MiCocinaSection = ({
  onSelectRecipe,
  onHistoryDeleted,
  onSelectSuggestion,
  onSubTabChange,
}: MiCocinaSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("favoritos");
  const { t } = useLanguage();

  const subTabs = [
    { id: "favoritos" as SubTab, label: t("subTabFavorites"), icon: Heart, descKey: "favoritesBannerDesc" as const },
    { id: "historial" as SubTab, label: t("subTabHistory"), icon: History, descKey: "historyBannerDesc" as const },
    { id: "logros" as SubTab, label: t("subTabAchievements"), icon: Trophy, descKey: "achievementsBannerDesc" as const },
    { id: "escaneo" as SubTab, label: t("subTabScan"), icon: ScanLine, descKey: "scanBannerDesc" as const },
  ];

  const activeTabData = subTabs.find(tab => tab.id === activeSubTab);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-4 gap-1.5">
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
                <Icon className={cn("w-4 h-4", activeSubTab === tab.id && "animate-pulse")} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Banner Image */}
      <div className="relative w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={miCocinaBanner} 
          alt="Mi Cocina" 
          className="w-full h-full object-cover transition-all duration-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="px-5">
            <h3 className="text-white font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {activeTabData?.label}
            </h3>
            <p className="text-white text-sm drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              {activeTabData ? t(activeTabData.descKey) : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeSubTab === "favoritos" && (
          <div className="max-w-xl mx-auto">
            <FavoriteRecipes onSelectRecipe={onSelectRecipe} />
          </div>
        )}

        {activeSubTab === "historial" && (
          <SmartHistory 
            onHistoryDeleted={onHistoryDeleted}
            onSelectRecipe={onSelectRecipe}
            onSelectSuggestion={onSelectSuggestion}
          />
        )}

        {activeSubTab === "logros" && (
          <div className="max-w-xl mx-auto">
            <AchievementsSection />
          </div>
        )}

        {activeSubTab === "escaneo" && (
          <div className="max-w-xl mx-auto">
            <ScannedProducts />
          </div>
        )}
      </div>
    </div>
  );
};
