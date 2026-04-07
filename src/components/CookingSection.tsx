import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChefHat,
  Sparkles,
  RotateCcw,
  Shuffle,
  Candy,
  Utensils,
  ChevronDown,
  Check,
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

const TOTAL_STEPS = 5;

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
  const [activeStep, setActiveStep] = useState(1);

  const activeFlavor = quickFilters.find(f => f === "dulce" || f === "salado") ?? null;
  const dietAndPrefFilters = quickFilters.filter(f => f !== "dulce" && f !== "salado");

  const toggleFlavor = (id: string) => {
    const isActive = quickFilters.includes(id);
    const withoutFlavors = quickFilters.filter(f => f !== "dulce" && f !== "salado");
    setQuickFilters(isActive ? withoutFlavors : [...withoutFlavors, id]);
  };

  // Step summaries
  const stepSummary = useCallback((step: number): string | null => {
    switch (step) {
      case 1:
        return ingredients.length > 0 ? `${ingredients.length} ${t("ingredientsLabel") || "ingredientes"}` : null;
      case 2:
        return activeFlavor ? (activeFlavor === "dulce" ? t("flavorSweet") : t("flavorSavory")) : null;
      case 3:
        return dietAndPrefFilters.length > 0 ? `${dietAndPrefFilters.length} ${t("filtersLabel") || "filtros"}` : null;
      case 4:
        return `${time} min`;
      case 5:
        return mealType ? t(mealType === "desayuno" ? "breakfast" : mealType === "almuerzo" ? "lunch" : mealType === "merienda" ? "snack" : mealType === "cena" ? "dinner" : "forFreezing") : null;
      default:
        return null;
    }
  }, [ingredients, activeFlavor, dietAndPrefFilters, time, mealType, t]);

  const isStepCompleted = (step: number) => !!stepSummary(step);
  const progressValue = (() => {
    let completed = 0;
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (isStepCompleted(i)) completed++;
    }
    return (completed / TOTAL_STEPS) * 100;
  })();

  const handleGenerate = () => {
    if (ingredients.length === 0) {
      toast.warning(t("ingredientsRequired"), { description: t("ingredientsRequiredDesc"), duration: 3500 });
      setActiveStep(1);
      return;
    }
    if (!activeFlavor) {
      toast.warning(t("flavorRequired"), { description: t("flavorRequiredDesc"), duration: 3500 });
      setActiveStep(2);
      return;
    }
    onGenerateRecipe();
  };

  const goToNextStep = (current: number) => {
    if (current < TOTAL_STEPS) {
      setTimeout(() => setActiveStep(current + 1), 200);
    }
  };

  const steps = [
    { id: 1, title: t("whatIngredients") },
    { id: 2, title: t("flavorTitle") },
    { id: 3, title: t("dietaryPreferences") },
    { id: 4, title: t("howMuchTime") },
    { id: 5, title: t("mealTypeLabel") },
  ];

  return (
    <div className="space-y-3 px-1">
      {/* Usage indicator */}
      <div className="flex items-center justify-end">
        <DailyUsageIndicator />
      </div>

      {/* Suggestion Card */}
      {pendingSuggestion && (
        <div className="rounded-[20px] border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <p className="font-semibold text-foreground text-sm">{t("suggestedRecipe")}</p>
              </div>
              <p className="text-base font-bold text-primary mb-1">{pendingSuggestion.name}</p>
              <p className="text-xs text-muted-foreground">{pendingSuggestion.reason}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setIngredients([pendingSuggestion.name]);
                  onGenerateRecipe();
                  onClearSuggestion?.();
                }}
                className="gap-1.5 rounded-2xl"
              >
                <ChefHat className="w-4 h-4" />
                {t("giveRecipe")}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClearSuggestion} className="text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <Progress value={progressValue} className="h-1 bg-muted/50 rounded-full" />
        <div className="flex justify-between">
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={cn(
                "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all duration-300",
                activeStep === s.id
                  ? "bg-primary text-primary-foreground scale-110"
                  : isStepCompleted(s.id)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isStepCompleted(s.id) && activeStep !== s.id ? <Check className="w-3 h-3" /> : s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(quickFilters.length > 0 || mealType || time !== 30) && (
        <button
          onClick={() => {
            setQuickFilters([]);
            setFilters({ diet: [], difficulty: null, excludeIngredients: [], servings: null, cookingMethod: null, budget: null, maxTime: null });
            setMealType(null);
            setTime(30);
            setActiveStep(1);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <RotateCcw className="w-3 h-3" />
          {t("cookingClearFilters")}
        </button>
      )}

      {/* Accordion Steps */}
      <div className="space-y-2">
        {/* Step 1: Ingredients */}
        <AccordionStep
          step={1}
          title={steps[0].title}
          summary={stepSummary(1)}
          isActive={activeStep === 1}
          isCompleted={isStepCompleted(1)}
          onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
        >
          <div className="space-y-3">
            <IngredientInput ingredients={ingredients} onIngredientsChange={(v) => { setIngredients(v); if (v.length > 0 && activeStep === 1) goToNextStep(1); }} />
            <IngredientCategorySelector selectedIngredients={ingredients} onIngredientsChange={setIngredients} />
          </div>
        </AccordionStep>

        {/* Step 2: Flavor */}
        <AccordionStep
          step={2}
          title={steps[1].title}
          summary={stepSummary(2)}
          isActive={activeStep === 2}
          isCompleted={isStepCompleted(2)}
          onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "salado", label: t("flavorSavory"), icon: Utensils, desc: t("flavorSavoryDesc") },
              { id: "dulce", label: t("flavorSweet"), icon: Candy, desc: t("flavorSweetDesc") },
            ].map((opt) => {
              const Icon = opt.icon;
              const isActive = activeFlavor === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    toggleFlavor(opt.id);
                    if (!isActive) goToNextStep(2);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-4 rounded-[20px] border-2 transition-all duration-300",
                    isActive
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-transparent bg-muted/30 hover:bg-muted/50",
                    "active:scale-[0.97]"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.2} />
                  <span className="font-semibold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-center text-muted-foreground leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </AccordionStep>

        {/* Step 3: Diet */}
        <AccordionStep
          step={3}
          title={steps[2].title}
          summary={stepSummary(3)}
          isActive={activeStep === 3}
          isCompleted={isStepCompleted(3)}
          onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)}
        >
          <QuickFilters
            activeFilters={dietAndPrefFilters}
            onFiltersChange={(newFilters) => {
              const flavorFilters = quickFilters.filter(f => f === "dulce" || f === "salado");
              setQuickFilters([...flavorFilters, ...newFilters]);
              const newDiet = newFilters.filter(f =>
                ['vegetariano', 'vegano', 'sin-gluten', 'sin-lactosa', 'alto-proteina'].includes(f)
              );
              setFilters({ ...filters, diet: newDiet });
            }}
          />
        </AccordionStep>

        {/* Step 4: Time */}
        <AccordionStep
          step={4}
          title={steps[3].title}
          summary={stepSummary(4)}
          isActive={activeStep === 4}
          isCompleted={isStepCompleted(4)}
          onToggle={() => setActiveStep(activeStep === 4 ? 0 : 4)}
        >
          <TimeSelector value={time} onChange={(v) => { setTime(v); goToNextStep(4); }} />
        </AccordionStep>

        {/* Step 5: Meal Type */}
        <AccordionStep
          step={5}
          title={steps[4].title}
          summary={stepSummary(5)}
          isActive={activeStep === 5}
          isCompleted={isStepCompleted(5)}
          onToggle={() => setActiveStep(activeStep === 5 ? 0 : 5)}
        >
          <MealTypeSelector value={mealType} onChange={(v) => { setMealType(v); }} />
        </AccordionStep>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        disabled={!isPremium}
        onUpgradeClick={onShowPaywall}
      />

      {/* CTA Section */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          className={cn(
            "w-full py-6 text-base font-bold rounded-[20px] transition-all duration-300",
            "bg-primary hover:bg-primary/90 shadow-[0_4px_20px_hsl(var(--primary)/0.3)]",
            "active:scale-[0.96]",
            "disabled:opacity-60"
          )}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isLoading ? t("thinking") : t("giveRecipes")}
        </Button>

        <div className="flex gap-2">
          {ingredients.length > 0 && (
            <Button
              variant="secondary"
              onClick={onDecideForMe}
              disabled={isLoading}
              className="flex-1 rounded-[20px] active:scale-[0.96] transition-all duration-300"
            >
              <Shuffle className="w-4 h-4 mr-1.5" />
              {t("decideForMe")}
            </Button>
          )}

          {(recipes.length > 0 || ingredients.length > 0) && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="rounded-[20px] active:scale-[0.96] transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
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

      <RecentRecipesHistory onSelectRecipe={onSelectRecipe} />
    </div>
  );
}

/* ─── Accordion Step Component ─── */

function AccordionStep({
  step,
  title,
  summary,
  isActive,
  isCompleted,
  onToggle,
  children,
}: {
  step: number;
  title: string;
  summary: string | null;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border transition-all duration-300 overflow-hidden",
        isActive
          ? "border-primary/20 bg-card shadow-sm"
          : "border-border/40 bg-muted/20"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 active:bg-muted/30"
      >
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300",
            isActive
              ? "bg-primary text-primary-foreground"
              : isCompleted
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
          )}
        >
          {isCompleted && !isActive ? <Check className="w-3.5 h-3.5" /> : step}
        </div>

        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-semibold transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {title}
          </span>
          {!isActive && summary && (
            <p className="text-xs text-primary/80 font-medium truncate mt-0.5">{summary}</p>
          )}
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300",
            isActive && "rotate-180"
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isActive
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0"
        )}
        style={{ overflow: isActive ? "visible" : "hidden" }}
      >
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
