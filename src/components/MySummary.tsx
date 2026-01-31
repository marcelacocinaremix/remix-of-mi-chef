import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  Clock, 
  Heart, 
  ShoppingCart, 
  Sparkles, 
  UtensilsCrossed,
  Calendar,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { startOfWeek, format } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";

interface MySummaryProps {
  onOpenRecipe: (recipe: any) => void;
}

interface NextMeal {
  meal_type: string;
  recipe_name: string;
  recipe_data: any;
  day_of_week: number;
}

interface LastRecipe {
  recipe_name: string;
  recipe_data: any;
  cooked_at: string;
}

const MySummary = ({ 
  onOpenRecipe 
}: MySummaryProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [displayName, setDisplayName] = useState<string>("");
  const [nextMeal, setNextMeal] = useState<NextMeal | null>(null);
  const [lastRecipe, setLastRecipe] = useState<LastRecipe | null>(null);
  const [aiTip, setAiTip] = useState<string>("");
  const [loadingTip, setLoadingTip] = useState(false);

  const getLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'pt': return ptBR;
      default: return es;
    }
  };

  const getMealLabel = (type: string) => {
    return type === "almuerzo" ? t("lunch") : t("dinnerMeal");
  };

  const getDayName = (dayIndex: number) => {
    const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    return t(dayKeys[dayIndex]);
  };

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      
      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      } else {
        setDisplayName(user.email?.split("@")[0] || "");
      }

      // Fetch next planned meal
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const currentDay = (new Date().getDay() + 6) % 7; // Monday = 0
      const currentHour = new Date().getHours();
      
      // Determine current meal type
      const currentMealType = currentHour < 15 ? "almuerzo" : "cena";

      const { data: mealPlans } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStartStr)
        .order("day_of_week", { ascending: true });

      if (mealPlans && mealPlans.length > 0) {
        // Find next upcoming meal
        const upcomingMeal = mealPlans.find((meal) => {
          if (meal.day_of_week > currentDay) return true;
          if (meal.day_of_week === currentDay) {
            if (currentMealType === "almuerzo") return true;
            if (meal.meal_type === "cena") return true;
          }
          return false;
        });

        if (upcomingMeal) {
          setNextMeal({
            meal_type: upcomingMeal.meal_type,
            recipe_name: upcomingMeal.recipe_name,
            recipe_data: upcomingMeal.recipe_data,
            day_of_week: upcomingMeal.day_of_week
          });
        }
      }

      // Fetch last cooked recipe
      const { data: cookedRecipes } = await supabase
        .from("cooked_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false })
        .limit(1);

      if (cookedRecipes && cookedRecipes.length > 0) {
        setLastRecipe({
          recipe_name: cookedRecipes[0].recipe_name,
          recipe_data: cookedRecipes[0].recipe_data,
          cooked_at: cookedRecipes[0].cooked_at
        });
      }

      // Generate AI tip
      await generateAiTip(user.id);
    };

    fetchUserData();
  }, [user]);

  const generateAiTip = async (userId: string) => {
    setLoadingTip(true);
    try {
      // Fetch pantry items for context
      const { data: pantryItems } = await supabase
        .from("pantry_items")
        .select("ingredient_name")
        .eq("user_id", userId)
        .limit(10);

      // Fetch recent recipes for context
      const { data: recentRecipes } = await supabase
        .from("cooked_recipes")
        .select("recipe_name")
        .eq("user_id", userId)
        .order("cooked_at", { ascending: false })
        .limit(5);

      const pantryList = pantryItems?.map(i => i.ingredient_name).join(", ") || "";
      const recentList = recentRecipes?.map(r => r.recipe_name).join(", ") || "";

      const response = await supabase.functions.invoke("generate-smart-tip", {
        body: {
          pantryIngredients: pantryList,
          recentRecipes: recentList,
          language: language
        }
      });

      // Handle auth errors gracefully
      if (response.error) {
        console.error("Error generating tip:", response.error);
        setAiTip(t("defaultTip"));
        return;
      }

      if (response.data?.tip) {
        setAiTip(response.data.tip);
      } else {
        setAiTip(t("defaultTip"));
      }
    } catch (error) {
      console.error("Error generating tip:", error);
      setAiTip(t("defaultTip"));
    } finally {
      setLoadingTip(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo").replace("{days}", String(diffDays));
    return format(date, "d MMMM", { locale: getLocale() });
  };

  if (!user) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t("welcomeToMiChef")}{displayName ? `, ${displayName}` : ""} 👋
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t("summaryDescription")}
              </p>
              <p className="text-primary text-sm font-medium mt-2">
                {t("summaryStartHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Meal Card */}
      {nextMeal && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {t("nextPlannedMeal")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{nextMeal.recipe_name}</p>
                <p className="text-sm text-muted-foreground">
                  {getDayName(nextMeal.day_of_week)} - {getMealLabel(nextMeal.meal_type)}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-primary"
                onClick={() => onOpenRecipe(nextMeal.recipe_data)}
              >
                {t("view")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Recipe Card */}
      {lastRecipe && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {t("lastCookedRecipe")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{lastRecipe.recipe_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeAgo(lastRecipe.cooked_at)}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-primary"
                onClick={() => onOpenRecipe(lastRecipe.recipe_data)}
              >
                {t("repeat")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Tip Card */}
      <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-4 h-4" />
            {t("marcelaTipSummary")}
            <Sparkles className="w-3 h-3" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTip ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm">{t("thinkingTip")}</span>
            </div>
          ) : (
            <p className="text-sm text-foreground">{aiTip}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySummary;