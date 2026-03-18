import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Clock, 
  Flame, 
  Utensils,
  Sparkles,
  ChefHat,
  RefreshCw,
  BarChart3,
  Calendar,
  Leaf,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useCookedRecipes, CookedRecipe } from "@/hooks/useCookedRecipes";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryInsights {
  topIngredients: { name: string; count: number }[];
  recipeStyles: { style: string; count: number }[];
  cookingFrequency: string;
  totalRecipesCooked: number;
  favoriteDay: string;
  averageCookingTime: string;
}

interface RecipeSuggestion {
  name: string;
  reason: string;
  estimatedTime: string;
}

interface SmartHistoryProps {
  onHistoryDeleted?: () => void;
  onSelectRecipe?: (recipe: any) => void;
  onSelectSuggestion?: (suggestion: { name: string; reason: string }) => void;
}

const SmartHistory = ({ onHistoryDeleted, onSelectRecipe, onSelectSuggestion }: SmartHistoryProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { cookedRecipes, isLoading: loadingRecipes, refetch: refetchRecipes } = useCookedRecipes();
  const [insights, setInsights] = useState<HistoryInsights | null>(null);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllRecipes, setShowAllRecipes] = useState(false);

  // Force fresh fetch from DB whenever this component mounts or user changes
  useEffect(() => {
    if (user) {
      refetchRecipes();
    }
  }, [user]);

  // Run insights computation once cookedRecipes is loaded (not loading anymore)
  useEffect(() => {
    if (user && !loadingRecipes) {
      fetchInsights();
    }
  }, [loadingRecipes, user]);

  const fetchInsights = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch fresh data directly from DB to avoid stale closure issues
      const { data: freshCookedRecipes } = await supabase
        .from("cooked_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false });

      // Fetch favorite recipes
      const { data: favoriteRecipes } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", user.id);

      const allRecipes = [...(freshCookedRecipes || []), ...(favoriteRecipes || [])];

      if (allRecipes.length === 0) {
        setInsights(null);
        setLoading(false);
        return;
      }

      // Extract ingredients from all recipes
      const ingredientCounts: Record<string, number> = {};
      const styleCounts: Record<string, number> = {};
      const dayCounts: Record<string, number> = {};
      let totalTime = 0;
      let timeCount = 0;

      allRecipes.forEach((recipe) => {
        const data = recipe.recipe_data as any;
        
        // Count ingredients
        if (data?.ingredients && Array.isArray(data.ingredients)) {
          data.ingredients.forEach((ing: unknown) => {
            if (typeof ing !== "string") return;
            const cleanIng = ing.toLowerCase().split(" ").slice(-1)[0];
            ingredientCounts[cleanIng] = (ingredientCounts[cleanIng] || 0) + 1;
          });
        }

        // Analyze recipe style from name/description
        const recipeName = (recipe.recipe_name || "").toLowerCase();
        if (recipeName.includes("rápid") || recipeName.includes("express") || recipeName.includes("fácil")) {
          styleCounts["Rápidas"] = (styleCounts["Rápidas"] || 0) + 1;
        }
        if (recipeName.includes("casero") || recipeName.includes("tradicional") || recipeName.includes("abuela")) {
          styleCounts["Caseras"] = (styleCounts["Caseras"] || 0) + 1;
        }
        if (recipeName.includes("light") || recipeName.includes("saludable") || recipeName.includes("ensalada")) {
          styleCounts["Saludables"] = (styleCounts["Saludables"] || 0) + 1;
        }
        if (recipeName.includes("económic") || recipeName.includes("barato")) {
          styleCounts["Económicas"] = (styleCounts["Económicas"] || 0) + 1;
        }

        // Count cooking days (only for cooked_recipes which have cooked_at)
        const cookedAtDate = 'cooked_at' in recipe ? recipe.cooked_at : null;
        if (cookedAtDate) {
          const day = new Date(cookedAtDate).toLocaleDateString("es-AR", { weekday: "long" });
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }

        // Track cooking time
        if (data?.time) {
          const timeMatch = String(data.time).match(/\d+/);
          if (timeMatch) {
            totalTime += parseInt(timeMatch[0]);
            timeCount++;
          }
        }
      });

      // Sort and get top ingredients
      const topIngredients = Object.entries(ingredientCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Get recipe styles
      const recipeStyles = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([style, count]) => ({ style, count }));

      // Add default style if empty
      if (recipeStyles.length === 0) {
        recipeStyles.push({ style: "Variadas", count: allRecipes.length });
      }

      // Determine cooking frequency — use freshCookedRecipes to avoid stale closure
      const totalCooked = (freshCookedRecipes || []).length;
      let cookingFrequency = t("historyFreqOccasional");
      if (totalCooked >= 20) cookingFrequency = t("historyFreqVeryOften");
      else if (totalCooked >= 10) cookingFrequency = t("historyFreqOften");
      else if (totalCooked >= 5) cookingFrequency = t("historyFreqRegular");

      // Get favorite day
      const favoriteDay = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Variable";

      // Calculate average time
      const avgTime = timeCount > 0 ? Math.round(totalTime / timeCount) : 30;

      setInsights({
        topIngredients,
        recipeStyles,
        cookingFrequency,
        totalRecipesCooked: totalCooked,
        favoriteDay: favoriteDay.charAt(0).toUpperCase() + favoriteDay.slice(1),
        averageCookingTime: `${avgTime} min`
      });

      // Generate AI suggestions
      await generateSuggestions(topIngredients, recipeStyles);

    } catch (error) {
      console.error("Error computing insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildRecipeStyles = (recipeName: string) => {
    const styleCounts: Record<string, number> = {};
    if (recipeName.includes("rápid") || recipeName.includes("express") || recipeName.includes("fácil") || recipeName.includes("quick") || recipeName.includes("rapide") || recipeName.includes("schnell")) {
      styleCounts[t("historyStyleQuick")] = (styleCounts[t("historyStyleQuick")] || 0) + 1;
    }
    if (recipeName.includes("casero") || recipeName.includes("tradicional") || recipeName.includes("abuela") || recipeName.includes("homemade") || recipeName.includes("maison")) {
      styleCounts[t("historyStyleHomemade")] = (styleCounts[t("historyStyleHomemade")] || 0) + 1;
    }
    if (recipeName.includes("light") || recipeName.includes("saludable") || recipeName.includes("ensalada") || recipeName.includes("healthy") || recipeName.includes("sain")) {
      styleCounts[t("historyStyleHealthy")] = (styleCounts[t("historyStyleHealthy")] || 0) + 1;
    }
    if (recipeName.includes("económic") || recipeName.includes("barato") || recipeName.includes("budget") || recipeName.includes("günstig")) {
      styleCounts[t("historyStyleBudget")] = (styleCounts[t("historyStyleBudget")] || 0) + 1;
    }
    return styleCounts;
  };

  const generateSuggestions = async (
    topIngredients: { name: string; count: number }[],
    recipeStyles: { style: string; count: number }[]
  ) => {
    setLoadingSuggestions(true);
    try {
      const response = await supabase.functions.invoke("analyze-history", {
        body: {
          topIngredients: topIngredients.map(i => i.name).join(", "),
          preferredStyles: recipeStyles.map(s => s.style).join(", ")
        }
      });

      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Fallback suggestions
      setSuggestions([
        { name: "Receta del día", reason: "Basada en tus ingredientes favoritos", estimatedTime: "30 min" }
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!user) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from("cooked_recipes")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setInsights(null);
      setSuggestions([]);
      
      // Notify parent about deletion
      onHistoryDeleted?.();
      
      toast({
        title: t("historyDeleted"),
        description: t("historyDeletedDesc"),
      });
    } catch (error) {
      console.error("Error deleting history:", error);
      toast({
        title: t("error"),
        description: t("historyDeleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFrequencyColor = (frequency: string) => {
    if (frequency === t("historyFreqVeryOften")) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (frequency === t("historyFreqOften")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (frequency === t("historyFreqRegular")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  if (!user) return null;

  if (loading) {
    return (
      <Card className="border-muted">
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span>{t("historyAnalyzing")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.totalRecipesCooked === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <ChefHat className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {t("historyEmpty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedRecipes = showAllRecipes ? cookedRecipes : cookedRecipes.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Generated Recipes Section */}
      {cookedRecipes.length > 0 && (
        <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              {t("historyGeneratedRecipes")}
              <Badge variant="secondary" className="text-xs ml-auto">
                {cookedRecipes.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("historyGeneratedDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe?.(recipe.recipe_data)}
                className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-green-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{recipe.recipe_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(recipe.cooked_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  {(recipe.recipe_data as any)?.time && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {(recipe.recipe_data as any).time}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {cookedRecipes.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllRecipes(!showAllRecipes)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                {showAllRecipes ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    {t("historyShowLess")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    {t("historyShowMore").replace("{count}", String(cookedRecipes.length - 5))}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      {/* Insights Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {t("historySmartTitle")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { refetchRecipes(); fetchInsights(); }}
                disabled={loading}
                className="h-8 px-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("historyDeleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("historyDeleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteHistory}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? t("historyDeleting") : t("historyDeleteConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{insights.totalRecipesCooked}</p>
              <p className="text-xs text-muted-foreground">{t("historyRecipesCooked")}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{insights.averageCookingTime}</p>
              <p className="text-xs text-muted-foreground">{t("historyAvgTime")}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold text-foreground">{insights.favoriteDay}</p>
              <p className="text-xs text-muted-foreground">{t("historyFavoriteDay")}</p>
            </div>
          </div>

          {/* Cooking Frequency Badge */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("historyCookingFreq")}</span>
            <Badge className={getFrequencyColor(insights.cookingFrequency)}>
              {insights.cookingFrequency}
            </Badge>
          </div>

          {/* Top Ingredients */}
          {insights.topIngredients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-foreground">{t("historyTopIngredients")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.topIngredients.map((ing, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="text-xs"
                  >
                    {ing.name} ({ing.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Styles */}
          {insights.recipeStyles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t("historyRecipeStyle")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.recipeStyles.map((style, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className="text-xs border-primary/30"
                  >
                    {style.style}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t("historyAISuggestions")}
            <Badge variant="secondary" className="text-xs ml-auto">
              IA
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("historyAISuggestionsDesc")}
          </p>
        </CardHeader>
        <CardContent>
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
              <span className="text-sm">{t("historyLoadingSuggestions")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    if (onSelectSuggestion) {
                      onSelectSuggestion({ name: suggestion.name, reason: suggestion.reason });
                    }
                  }}
                  className="w-full text-left p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-secondary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{suggestion.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {suggestion.estimatedTime}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartHistory;
