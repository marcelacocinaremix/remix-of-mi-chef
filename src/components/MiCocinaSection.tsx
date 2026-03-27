import { useState } from "react";
import { FavoriteRecipes } from "./FavoriteRecipes";
import SmartHistory from "./SmartHistory";
import { Heart, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recipe } from "./RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import miCocinaBanner from "@/assets/mi-cocina-banner.jpg";

interface MiCocinaSectionProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onHistoryDeleted: () => void;
  onSelectSuggestion: (suggestion: { name: string; reason: string }) => void;
  onSubTabChange?: (subTab: string) => void;
}

type SubTab = "favoritos" | "historial";

export const MiCocinaSection = ({
  onSelectRecipe,
  onHistoryDeleted,
  onSelectSuggestion,
  onSubTabChange,
}: MiCocinaSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("favoritos");
  const { t } = useLanguage();

  const subTabs = [
    { id: "favoritos" as SubTab, label: t("subTabFavorites"), icon: Heart },
    { id: "historial" as SubTab, label: t("subTabHistory"),   icon: History },
    { id: "logros"    as SubTab, label: t("subTabAchievements"), icon: Trophy },
  ];

  const handleTabChange = (id: SubTab) => {
    setActiveSubTab(id);
    onSubTabChange?.(id);
  };

  return (
    <div className="space-y-4">
      {/* Slim Banner */}
      <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-md">
        <img src={miCocinaBanner} alt="Mi Cocina" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">Mi Cocina</h3>
            <p className="text-white/80 text-xs font-light">Tus recetas guardadas</p>
          </div>
        </div>
      </div>

      {/* Segmented Control — underline style */}
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
              {/* Active underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4/5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
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
      </div>
    </div>
  );
};
