import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Users, ChefHat, Lightbulb, ShoppingBag, RefreshCw, Flame, Dumbbell, Wheat, Droplet, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import { validateRecipe } from "@/lib/recipeSchema";

export default function SharedRecipe() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [sharedBy, setSharedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSharedRecipe = async () => {
      if (!shareCode) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // Use secure RPC function that only allows access by share_code
        const { data, error: fetchError } = await supabase
          .rpc('get_shared_recipe_by_code', { p_share_code: shareCode });

        if (fetchError || !data || data.length === 0) {
          setError(true);
        } else {
          const recipeRow = data[0];
          // Validate recipe data after fetching
          const validatedRecipe = validateRecipe(recipeRow.recipe_data);
          
          if (!validatedRecipe) {
            console.error('Invalid recipe data structure');
            setError(true);
            return;
          }
          
          setRecipe(validatedRecipe);
          // shared_by_name is always null now (anonymous sharing)
          setSharedBy(null);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedRecipe();
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">🍳</span>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {t("recipeNotFound")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("recipeNotFoundDesc")}
          </p>
          <Link to="/">
            <Button size="lg">{t("goToMiChef")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero CTA Banner */}
      <div className="gradient-warm py-4 px-4 text-center text-primary-foreground">
        <p className="text-sm md:text-base font-medium">
          {sharedBy ? (
            <>
              👨‍🍳 <span className="font-semibold">{sharedBy}</span> {t("sharedThisRecipe")}
            </>
          ) : (
            <>👨‍🍳 {t("someoneSharedRecipe")}</>
          )}
        </p>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Recipe Card */}
        <div className={cn(
          "bg-card rounded-2xl overflow-hidden mb-6",
          "shadow-elevated border border-border/50"
        )}>
          {/* Header */}
          <div className="gradient-warm p-6 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <span className="text-2xl">🍽️</span>
              <span className="text-sm font-medium uppercase tracking-wide">
                {t("sharedRecipe")}
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {recipe.name}
            </h1>
            <div className="flex items-center gap-4 mt-3 opacity-90 flex-wrap">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {recipe.time} {t("minutes")}
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                {recipe.servings} {t("servings")}
              </span>
              <span className="text-sm font-medium px-2 py-0.5 bg-white/20 rounded-full">
                {recipe.difficulty}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Nutrition */}
            <section className={cn(
              "p-4 rounded-xl",
              "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50"
            )}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                {t("nutritionInfo")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.calories}</p>
                  <p className="text-xs text-muted-foreground">{t("calories")}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Dumbbell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.protein}g</p>
                  <p className="text-xs text-muted-foreground">{t("protein")}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.carbs}g</p>
                  <p className="text-xs text-muted-foreground">{t("carbs")}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Droplet className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.fat}g</p>
                  <p className="text-xs text-muted-foreground">{t("fat")}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Leaf className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.fiber}g</p>
                  <p className="text-xs text-muted-foreground">{t("fiber")}</p>
                </div>
              </div>
            </section>

            {/* Ingredients */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {t("ingredients")}
                </h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-2 text-foreground/90 p-2">
                    <span className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Steps */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {t("preparation")}
                </h3>
              </div>
              <ol className="space-y-3">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full",
                      "bg-primary/10 text-primary",
                      "flex items-center justify-center",
                      "text-sm font-bold font-display"
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-foreground/90 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Tip */}
            <section className={cn(
              "p-4 rounded-xl",
              "bg-amber-50 border border-amber-200/50"
            )}>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-1">
                    {t("marcelaTip")}
                  </h4>
                  <p className="text-foreground/80 text-sm">{recipe.tip}</p>
                </div>
              </div>
            </section>

            {/* Variation */}
            {recipe.variation && (
              <section className={cn(
                "p-4 rounded-xl",
                "bg-secondary border border-border/50"
              )}>
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">
                      {t("optionalVariation")}
                    </h4>
                    <p className="text-foreground/80 text-sm">{recipe.variation}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* CTA Card */}
        <div className={cn(
          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
          "rounded-2xl p-6 text-center border border-primary/20"
        )}>
          <span className="text-4xl mb-3 block">👩‍🍳</span>
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
            {t("wantMoreRecipes")}
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {t("joinMiChefDesc")}
          </p>
          <Link to="/">
            <Button size="lg" className="min-w-[200px]">
              {t("joinMiChef")}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-muted-foreground text-sm">
            {t("madeWith")} ❤️ {t("by")}{" "}
            <span className="text-primary font-semibold">MARCELACOCINA</span>
          </p>
        </div>
      </div>
    </div>
  );
}
