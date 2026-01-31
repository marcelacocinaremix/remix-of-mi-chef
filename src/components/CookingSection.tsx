import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  Sparkles, 
  Dices, 
  Zap, 
  Target, 
  RotateCcw, 
  Shuffle,
  Utensils,
  Lightbulb
} from "lucide-react";
import { IngredientInput } from "@/components/IngredientInput";
import { IngredientCategorySelector } from "@/components/IngredientCategorySelector";
import { IngredientWheel } from "@/components/IngredientWheel";
import { DailyChallenge } from "@/components/DailyChallenge";
import { QuickCombos } from "@/components/QuickCombos";
import { MarcelaReactiveTips } from "@/components/MarcelaReactiveTips";
import { RecipePrediction } from "@/components/RecipePrediction";
import { QuickFilters } from "@/components/QuickFilters";
import { TimeSelector } from "@/components/TimeSelector";
import { MealTypeSelector } from "@/components/MealTypeSelector";
import { AdvancedFilters, FiltersState } from "@/components/AdvancedFilters";
import { RecipeList, Recipe } from "@/components/RecipeList";
import { LoadingRecipe } from "@/components/LoadingRecipe";
import { CookingSectionHeader } from "@/components/CookingSectionHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

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
  playSound,
  showToast,
  pendingSuggestion,
  onClearSuggestion,
}: CookingSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("armar");
  const [showIngredientWheel, setShowIngredientWheel] = useState(false);
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

      {/* Sub-navigation Tabs */}

      {/* Sub-navigation Tabs */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveSubTab("armar")}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300",
              activeSubTab === "armar"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "bg-background/60 hover:bg-background text-foreground"
            )}
          >
            <ChefHat className={cn("w-5 h-5", activeSubTab === "armar" && "animate-bounce")} />
            <span>{t("buildRecipe")}</span>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5">
              {t("main")}
            </Badge>
          </button>
          <button
            onClick={() => setActiveSubTab("extras")}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300",
              activeSubTab === "extras"
                ? "bg-accent text-accent-foreground shadow-lg scale-[1.02]"
                : "bg-background/60 hover:bg-background text-foreground"
            )}
          >
            <Zap className={cn("w-5 h-5", activeSubTab === "extras" && "animate-pulse")} />
            <span>{t("inspiration")}</span>
          </button>
        </div>
      </div>

      {/* Armar Receta Tab */}
      {activeSubTab === "armar" && (
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
              <span className="text-xl animate-swing">⏱️</span>
              <span>{t("howMuchTime")}</span>
            </label>
            <TimeSelector value={time} onChange={setTime} />
          </section>

          {/* Meal Type Section */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <span className="text-xl animate-heartbeat">🍴</span>
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
        </div>
      )}

      {/* Extras Tab - Inspiration Tools */}
      {activeSubTab === "extras" && (
        <div className="space-y-6 animate-fade-in">
          {/* Info Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t("inspirationTools")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("inspirationToolsDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Challenge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="w-4 h-4 text-primary" />
              <span>{t("dailyChallenge")}</span>
            </div>
            <DailyChallenge 
              currentIngredients={ingredients}
              onAcceptChallenge={(challengeIngredients) => {
                setIngredients([...new Set([...ingredients, ...challengeIngredients])]);
                setActiveSubTab("armar");
                showToast({
                  title: t("challengeAccepted"),
                  description: t("ingredientsAdded"),
                });
              }}
            />
          </div>

          {/* Quick Combos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Utensils className="w-4 h-4 text-primary" />
              <span>{t("quickCombos")}</span>
            </div>
            <QuickCombos 
              currentIngredients={ingredients}
              onSelectCombo={(comboIngredients) => {
                setIngredients([...new Set([...ingredients, ...comboIngredients])]);
                setActiveSubTab("armar");
                playSound('pop');
                showToast({
                  title: t("comboAdded"),
                  description: t("ingredientsReady"),
                });
              }}
            />
          </div>

          {/* Ingredient Wheel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Dices className="w-4 h-4 text-primary" />
              <span>{t("ingredientWheel")}</span>
            </div>
            <Card className="overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  onClick={() => setShowIngredientWheel(true)}
                  className="w-full h-auto py-6 flex flex-col items-center gap-3 rounded-none hover:bg-primary/5"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
                    <Dices className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{t("spinWheel")}</p>
                    <p className="text-sm text-muted-foreground">{t("letChanceChoose")}</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <IngredientWheel 
              open={showIngredientWheel}
              onClose={() => setShowIngredientWheel(false)}
              currentIngredients={ingredients}
              onIngredientSelected={(ingredient) => {
                if (!ingredients.includes(ingredient)) {
                  setIngredients([...ingredients, ingredient]);
                  playSound('magic');
                  showToast({
                    title: t("wheelDecided"),
                    description: `${t("added")} ${ingredient}`,
                  });
                }
                setShowIngredientWheel(false);
                setActiveSubTab("armar");
              }}
            />
          </div>

          {/* Go to main */}
          {ingredients.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {ingredients.length} {t("ingredients")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{t("ingredientsReadyToUse")}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setActiveSubTab("armar")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ChefHat className="w-4 h-4 mr-1" />
                    {t("buildRecipe")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}