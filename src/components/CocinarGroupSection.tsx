import { useState } from "react";
import { CookingSection } from "./CookingSection";
import { KitchenTimer } from "./KitchenTimer";
import { ChefHat, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FiltersState } from "./AdvancedFilters";
import { Recipe } from "./RecipeList";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import timerBanner from "@/assets/timer-banner.jpg";
import cookingBanner from "@/assets/cooking-banner.jpg";

interface CocinarSectionProps {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
  time: number;
  setTime: (time: number) => void;
  mealType: string | null;
  setMealType: (mealType: string | null) => void;
  filters: FiltersState;
  setFilters: (filters: FiltersState) => void;
  quickFilters: string[];
  setQuickFilters: (filters: string[]) => void;
  recipes: Recipe[];
  isLoading: boolean;
  onGenerateRecipe: () => void;
  onDecideForMe: () => void;
  onReset: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  playSound: (type?: string) => void;
  pendingSuggestion: { name: string; reason: string } | null;
  onClearSuggestion: () => void;
}

type SubTab = "recetas" | "timer";

export const CocinarGroupSection = ({
  ingredients,
  setIngredients,
  time,
  setTime,
  mealType,
  setMealType,
  filters,
  setFilters,
  quickFilters,
  setQuickFilters,
  recipes,
  isLoading,
  onGenerateRecipe,
  onDecideForMe,
  onReset,
  onSelectRecipe,
  playSound,
  pendingSuggestion,
  onClearSuggestion,
}: CocinarSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("recetas");
  const { toast } = useToast();
  const { t } = useLanguage();

  const subTabs = [
    { id: "recetas" as SubTab, label: t("subTabRecipes"), icon: ChefHat },
    { id: "timer" as SubTab, label: t("subTabTimer"), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-2 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-300",
                  activeSubTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "bg-background/60 hover:bg-background text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", activeSubTab === tab.id && "animate-bounce")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Banner Image */}
      <div className="relative w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={activeSubTab === "timer" ? timerBanner : cookingBanner} 
          alt={activeSubTab === "timer" ? "Reloj de cocina" : "Recetas"} 
          className="w-full h-full object-cover transition-all duration-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="px-5">
            <h3 className="text-white font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {activeSubTab === "timer" ? t("subTabTimer") : t("subTabRecipes")}
            </h3>
            <p className="text-white text-sm drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
              {activeSubTab === "timer" ? t("timerBannerDesc") : t("recipesBannerDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeSubTab === "recetas" && (
          <CookingSection
            ingredients={ingredients}
            setIngredients={setIngredients}
            time={time}
            setTime={setTime}
            mealType={mealType}
            setMealType={setMealType}
            filters={filters}
            setFilters={setFilters}
            quickFilters={quickFilters}
            setQuickFilters={setQuickFilters}
            recipes={recipes}
            isLoading={isLoading}
            isPremium={true}
            onGenerateRecipe={onGenerateRecipe}
            onDecideForMe={onDecideForMe}
            onReset={onReset}
            onSelectRecipe={onSelectRecipe}
            onShowPaywall={() => {}}
            playSound={playSound}
            showToast={toast}
            pendingSuggestion={pendingSuggestion}
            onClearSuggestion={onClearSuggestion}
          />
        )}

        {activeSubTab === "timer" && <KitchenTimer />}
      </div>
    </div>
  );
};
