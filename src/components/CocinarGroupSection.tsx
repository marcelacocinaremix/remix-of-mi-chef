import { CookingSection } from "./CookingSection";
import { FiltersState } from "./AdvancedFilters";
import { Recipe } from "./RecipeList";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { toast } = useToast();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">

      {/* Slim Banner */}
      <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-md">
        <img
          src={cookingBanner}
          alt="Recetas"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">
              {t("subTabRecipes")}
            </h3>
            <p className="text-white/80 text-xs font-light drop-shadow-md">
              {t("recipesBannerDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
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
      </div>
    </div>
  );
};
