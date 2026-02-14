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
    <div className="space-y-6">

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

      {/* Recipe Generation Content - Step by Step */}
      <div className="space-y-6 animate-fade-in">
        {/* Marcela Reactive Tips */}
        <MarcelaReactiveTips 
          ingredients={ingredients}
          lastAddedIngredient={ingredients[ingredients.length - 1]}
        />

        {/* STEP 1: Ingredients */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("whatIngredients")}</h3>
                <p className="text-xs text-muted-foreground">{t("ingredientsStepDesc")}</p>
              </div>
            </div>
            
            <IngredientInput
              ingredients={ingredients}
              onIngredientsChange={setIngredients}
            />
            
            <IngredientCategorySelector
              selectedIngredients={ingredients}
              onIngredientsChange={setIngredients}
            />
          </CardContent>
        </Card>


        {/* STEP 2: Quick Filters */}
        <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("dietaryPreferences")}</h3>
                <p className="text-xs text-muted-foreground">{t("dietaryPreferencesDesc")}</p>
              </div>
            </div>
            
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
          </CardContent>
        </Card>

        {/* STEP 3: Time */}
        <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("howMuchTime")}</h3>
                <p className="text-xs text-muted-foreground">{t("timeStepDesc")}</p>
              </div>
            </div>
            
            <TimeSelector value={time} onChange={setTime} />
          </CardContent>
        </Card>

        {/* STEP 4: Meal Type */}
        <Card className="border-2 border-muted/50 bg-gradient-to-br from-muted/10 to-transparent">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("mealTypeLabel")}</h3>
                <p className="text-xs text-muted-foreground">{t("mealTypeStepDesc")}</p>
              </div>
            </div>
            
            <MealTypeSelector value={mealType} onChange={setMealType} />
          </CardContent>
        </Card>

        {/* Advanced Filters Section (collapsible) */}
        <AdvancedFilters 
          filters={filters} 
          onChange={setFilters} 
          disabled={!isPremium}
          onUpgradeClick={onShowPaywall}
        />

        {/* STEP 5: Generate */}
        <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                5
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("cookingReadyStep")}</h3>
                <p className="text-xs text-muted-foreground">{t("generateStepDesc")}</p>
              </div>
            </div>

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
          </CardContent>
        </Card>

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