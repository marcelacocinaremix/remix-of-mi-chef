import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChefHat, 
  Sparkles, 
  RotateCcw, 
  Shuffle,
  Candy,
  Utensils,
  Info,
  X,
  Heart,
  Clock,
  Sliders,
} from "lucide-react";

const COOKING_HELP_KEY = "miChef_cooking_help_dismissed";

function CookingHelpBanner({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    {
      num: 1,
      emoji: "✨",
      title: "Genera una receta",
      desc: 'Completa los pasos de abajo y toca "Dame recetas" para que la IA cree tu receta personalizada.',
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      num: 2,
      emoji: "❤️",
      title: "Guardala en favoritos",
      desc: 'Toca el corazon en la receta generada para guardarla en "Mi Cocina" y organizarla en carpetas.',
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    {
      num: 3,
      emoji: "👨‍🍳",
      title: "Usa el Modo Cocina",
      desc: 'Abre la receta y toca "Modo Cocina" para seguir el paso a paso mientras cocinas.',
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      num: 4,
      emoji: "🏆",
      title: 'Apreta "Ya la cocine"',
      desc: "Una vez lista, toca el boton para registrar la coccion y desbloquear logros.",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">¿Cómo funciona?</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {steps.map((s) => (
          <div key={s.num} className={cn("flex items-start gap-3 p-3 rounded-xl border bg-background/70", s.color.split(" ")[2])}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border", s.color)}>
              {s.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>{s.emoji}</span> {s.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { IngredientInput } from "@/components/IngredientInput";
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

const FLAVOR_OPTIONS = [
  {
    id: "salado",
    label: "Salado",
    emoji: "🧂",
    icon: Utensils,
    desc: "Platos principales, entradas…",
  },
  {
    id: "dulce",
    label: "Dulce / Postre",
    emoji: "🍬",
    icon: Candy,
    desc: "Postres, budines, tortas…",
  },
];

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

  const [showHelp, setShowHelp] = useState(() => {
    try { return !localStorage.getItem(COOKING_HELP_KEY); } catch { return true; }
  });

  const dismissHelp = () => {
    localStorage.setItem(COOKING_HELP_KEY, "1");
    setShowHelp(false);
  };

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
      toast.warning("Agregá ingredientes", {
        description: "Escribí al menos un ingrediente para generar tu receta.",
        duration: 3500,
      });
      return;
    }
    if (!activeFlavor) {
      toast.warning("¿Salado o dulce?", {
        description: "Seleccioná si querés una receta salada o dulce antes de continuar.",
        duration: 3500,
      });
      return;
    }
    onGenerateRecipe();
  };

  return (
    <div className="space-y-4 overflow-hidden">

      {/* Help Banner */}
      {showHelp && <CookingHelpBanner onDismiss={dismissHelp} />}
      {!showHelp && (
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Ver cómo funciona
        </button>
      )}

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
              Borrar filtros
            </button>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: Flavor — Salado o Dulce */}
      <Card className="border-2 border-rose-200/60 bg-gradient-to-br from-rose-50/40 to-transparent dark:border-rose-800/30 dark:from-rose-950/20">
        <CardContent className="p-4 space-y-4">
          <StepHeader
            number={2}
            title="¿Salado o dulce?"
            subtitle="Opcional — filtrá por perfil de sabor"
          />
          <div className="grid grid-cols-2 gap-3">
            {FLAVOR_OPTIONS.map((opt) => {
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
        disabled={!isPremium}
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
