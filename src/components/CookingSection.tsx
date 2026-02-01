import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChefHat, 
  Sparkles, 
  RotateCcw, 
  Shuffle,
} from "lucide-react";
import { IngredientInput } from "@/components/IngredientInput";
import { IngredientCategorySelector } from "@/components/IngredientCategorySelector";
import { MarcelaReactiveTips } from "@/components/MarcelaReactiveTips";
import { RecipePrediction } from "@/components/RecipePrediction";
import { QuickFilters } from "@/components/QuickFilters";
import { TimeSelector } from "@/components/TimeSelector";
import { MealTypeSelector } from "@/components/MealTypeSelector";
import { AdvancedFilters, FiltersState } from "@/components/AdvancedFilters";
import { RecipeList, Recipe } from "@/components/RecipeList";
import { LoadingRecipe } from "@/components/LoadingRecipe";
import { RecentRecipesHistory } from "@/components/RecentRecipesHistory";
import { useLanguage } from "@/contexts/LanguageContext";

interface CookingSectionProps {
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
  isPremium: boolean;
  onGenerateRecipe: () => void;
  onDecideForMe: () => void;
  onReset: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onShowPaywall: () => void;
  playSound: (sound: string) => void;
  showToast: (options: { title: string; description: string }) => void;
  pendingSuggestion?: { name: string; reason: string } | null;
  onClearSuggestion?: () => void;
}

export function CookingSection({
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
  isPremium,
  onGenerateRecipe,
  onDecideForMe,
  onReset,
  onSelectRecipe,
  onShowPaywall,
  showToast,
  pendingSuggestion,
  onClearSuggestion,
}: CookingSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">

      {/* Pending Suggestion Banner */}
      {pendingSuggestion && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <p className="font-semibold text-foreground">{t("suggestedRecipe")}</p>
                </div>
                <p className="text-lg font-bold text-primary mb-1">{pendingSuggestion.name}</p>
                <p className="text-sm text-muted-foreground">{pendingSuggestion.reason}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => {
                    setIngredients([pendingSuggestion.name]);
                    onGenerateRecipe();
                    onClearSuggestion?.();
                  }}
                  className="gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  {t("giveRecipe")}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClearSuggestion}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Generation Content */}
      <div className="space-y-6 animate-fade-in">
        {/* Marcela Reactive Tips */}
        <MarcelaReactiveTips 
          ingredients={ingredients}
          lastAddedIngredient={ingredients[ingredients.length - 1]}
        />

        {/* Ingredients Section */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">{t("whatIngredients")}</span>
          </label>
          <IngredientInput
            ingredients={ingredients}
            onIngredientsChange={setIngredients}
          />
          
          <IngredientCategorySelector
            selectedIngredients={ingredients}
            onIngredientsChange={setIngredients}
          />
        </section>

        {/* Recipe Prediction - Real-time suggestions */}
        {ingredients.length >= 2 && (
          <div className="animate-pop">
            <RecipePrediction 
              ingredients={ingredients}
              onSelectRecipe={onSelectRecipe}
            />
          </div>
        )}

        {/* Quick Filters */}
        <QuickFilters 
          activeFilters={quickFilters}
          onFiltersChange={(newFilters) => {
            setQuickFilters(newFilters);
            const newDiet = newFilters.filter(f => 
              ['vegetariano', 'sin-gluten', 'sin-lactosa', 'alto-proteina'].includes(f)
            );
            setFilters({ ...filters, diet: newDiet });
          }}
        />

        {/* Time Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <span>{t("howMuchTime")}</span>
          </label>
          <TimeSelector value={time} onChange={setTime} />
        </section>

        {/* Meal Type Section */}
        <section>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <span>{t("mealTypeLabel")}</span>
          </label>
          <MealTypeSelector value={mealType} onChange={setMealType} />
        </section>

        {/* Advanced Filters Section */}
        <AdvancedFilters 
          filters={filters} 
          onChange={setFilters} 
          disabled={!isPremium}
          onUpgradeClick={onShowPaywall}
        />

        {/* Generate Button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <Button
              variant="default"
              size="xl"
              onClick={onGenerateRecipe}
              disabled={isLoading}
              className="group flex-1 min-w-[220px] py-6 px-8 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-6 h-6 group-hover:animate-spin" />
              <span>{isLoading ? t("thinking") : t("giveRecipes")}</span>
            </Button>

            {ingredients.length > 0 && (
              <Button 
                variant="secondary" 
                size="xl" 
                onClick={onDecideForMe}
                disabled={isLoading}
                className="hover:scale-105 transition-transform"
              >
                <Shuffle className="w-5 h-5" />
                {t("decideForMe")}
              </Button>
            )}

            {(recipes.length > 0 || ingredients.length > 0) && (
              <Button variant="ghost" size="xl" onClick={onReset} className="hover:scale-105 transition-transform">
                <RotateCcw className="w-5 h-5" />
                {t("startOver")}
              </Button>
            )}
          </div>
        </div>

        {isLoading && <LoadingRecipe />}

        {recipes.length > 0 && !isLoading && (
          <div className="animate-fade-in">
            <RecipeList recipes={recipes} onSelectRecipe={onSelectRecipe} />
          </div>
        )}

        {/* Recent Recipes History */}
        <RecentRecipesHistory onSelectRecipe={onSelectRecipe} />
      </div>
    </div>
  );
}