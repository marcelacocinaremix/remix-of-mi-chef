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

      {/* Section Banner Image */}
      <div className="relative w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={cookingBanner} 
          alt="Recetas" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="px-5">
            <h3 className="text-white font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t("subTabRecipes")}
            </h3>
            <p className="text-white text-sm drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
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
