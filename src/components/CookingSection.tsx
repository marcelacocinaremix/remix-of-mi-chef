import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChefHat, 
  Sparkles, 
  RotateCcw, 
  Shuffle,
  Candy,
  Utensils,
  Heart,
  Clock,
  Sliders,
} from "lucide-react";

import { IngredientInput } from "@/components/IngredientInput";
import { DailyUsageIndicator } from "@/components/DailyUsageIndicator";
import { IngredientCategorySelector } from "@/components/IngredientCategorySelector";
import { QuickFilters } from "@/components/QuickFilters";
import { TimeSelector } from "@/components/TimeSelector";
import { MealTypeSelector } from "@/components/MealTypeSelector";
import { AdvancedFilters, FiltersState } from "@/components/AdvancedFilters";
import { RecipeList, Recipe } from "@/components/RecipeList";
import { LoadingRecipe } from "@/components/LoadingRecipe";
import { RecentRecipesHistory } from "@/components/RecentRecipesHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";
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



function StepHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
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
  const { hasAnyAccess } = usePremium();

  const activeFlavor = quickFilters.find(f => f === "dulce" || f === "salado") ?? null;

  const toggleFlavor = (id: string) => {
    const isActive = quickFilters.includes(id);
    const withoutFlavors = quickFilters.filter(f => f !== "dulce" && f !== "salado");
    setQuickFilters(isActive ? withoutFlavors : [...withoutFlavors, id]);
  };

  // Diet/preference filters only (no flavor filters)
  const dietAndPrefFilters = quickFilters.filter(f => f !== "dulce" && f !== "salado");

  const handleGenerate = () => {
    if (ingredients.length === 0) {
      toast.warning(t("ingredientsRequired"), {
        description: t("ingredientsRequiredDesc"),
        duration: 3500,
      });
      return;
    }
    if (!activeFlavor) {
      toast.warning(t("flavorRequired"), {
        description: t("flavorRequiredDesc"),
        duration: 3500,
      });
      return;
    }
    onGenerateRecipe();
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-end gap-3">
        <DailyUsageIndicator />
      </div>

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
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: Ingredients */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={1}
            title={t("whatIngredients")}
            subtitle={t("ingredientsStepDesc")}
          />
          <IngredientInput
            ingredients={ingredients}
            onIngredientsChange={setIngredients}
          />
          <IngredientCategorySelector
            selectedIngredients={ingredients}
            onIngredientsChange={setIngredients}
          />
          {(quickFilters.length > 0 || mealType || time !== 30) && (
            <button
              onClick={() => {
                setQuickFilters([]);
                setFilters({ diet: [], difficulty: null, excludeIngredients: [], servings: null, cookingMethod: null, budget: null, maxTime: null });
                setMealType(null);
                setTime(30);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("cookingClearFilters")}
            </button>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: Flavor — Savory or Sweet */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent dark:border-primary/20 dark:from-primary/10">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={2}
            title={t("flavorTitle")}
            subtitle={t("flavorSubtitle")}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "salado", label: t("flavorSavory"), emoji: "🧂", icon: Utensils, desc: t("flavorSavoryDesc") },
              { id: "dulce", label: t("flavorSweet"), emoji: "🍬", icon: Candy, desc: t("flavorSweetDesc") },
            ].map((opt) => {
              const Icon = opt.icon;
              const isActive = activeFlavor === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleFlavor(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                    isActive
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    "hover:scale-[1.03] active:scale-[0.97]"
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                  <span className="font-semibold text-sm leading-tight text-center">{opt.label}</span>
                  <span className="text-[11px] text-center opacity-70 leading-tight">{opt.desc}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-current mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 3: Diet & Preferences */}
      <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={3}
            title={t("dietaryPreferences")}
            subtitle={t("dietaryPreferencesDesc")}
          />
          {/* Pass only non-flavor filters to QuickFilters and merge back */}
          <QuickFilters
            activeFilters={dietAndPrefFilters}
            onFiltersChange={(newFilters) => {
              // Keep flavor filters + replace diet/pref filters
              const flavorFilters = quickFilters.filter(f => f === "dulce" || f === "salado");
              const merged = [...flavorFilters, ...newFilters];
              setQuickFilters(merged);
              const newDiet = newFilters.filter(f =>
                ['vegetariano', 'vegano', 'sin-gluten', 'sin-lactosa', 'alto-proteina'].includes(f)
              );
              setFilters({ ...filters, diet: newDiet });
            }}
          />
        </CardContent>
      </Card>

      {/* STEP 4: Time */}
      <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={4}
            title={t("howMuchTime")}
            subtitle={t("timeStepDesc")}
          />
          <TimeSelector value={time} onChange={setTime} />
        </CardContent>
      </Card>

      {/* STEP 5: Meal Type */}
      <Card className="border-2 border-muted/50 bg-gradient-to-br from-muted/10 to-transparent">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={5}
            title={t("mealTypeLabel")}
            subtitle={t("mealTypeStepDesc")}
          />
          <MealTypeSelector value={mealType} onChange={setMealType} />
        </CardContent>
      </Card>

      {/* Advanced Filters (collapsible, outside numbered steps) */}
      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        disabled={!hasAnyAccess}
        onUpgradeClick={onShowPaywall}
      />

      {/* STEP 6: Generate */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={6}
            title={t("cookingReadyStep")}
            subtitle={t("generateStepDesc")}
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <Button
              variant="default"
              size="xl"
              onClick={handleGenerate}
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
  );
}
