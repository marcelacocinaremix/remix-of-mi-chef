import { useMemo } from "react";
import { 
  TrendingUp, TrendingDown, Activity, Trophy,
  Star, Sparkles, Target, Zap, Flame, Award,
  Calendar, ChefHat, BarChart3, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface NutritionalData {
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  calorias: number;
}

interface RecipeWithNutrition {
  id: string;
  recipe_name: string;
  cooked_at: string;
  estimatedNutrition: NutritionalData;
}

interface BalanceSmartHistoryProps {
  weeklyRecipes: RecipeWithNutrition[];
  totals: NutritionalData;
  allCookedRecipes: RecipeWithNutrition[];
}

export function BalanceSmartHistory({ weeklyRecipes, totals, allCookedRecipes }: BalanceSmartHistoryProps) {
  // Calculate comprehensive stats
  const stats = useMemo(() => {
    // This week stats
    const thisWeekCount = weeklyRecipes.length;
    
    // Last week comparison
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const lastWeekRecipes = allCookedRecipes.filter(r => {
      const date = new Date(r.cooked_at);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });
    const lastWeekCount = lastWeekRecipes.length;
    
    // Weekly comparison
    const weeklyChange = thisWeekCount - lastWeekCount;
    const weeklyChangePercent = lastWeekCount > 0 
      ? Math.round((weeklyChange / lastWeekCount) * 100) 
      : thisWeekCount > 0 ? 100 : 0;

    // Last week totals for comparison
    const lastWeekTotals = lastWeekRecipes.reduce(
      (acc, r) => ({
        proteinas: acc.proteinas + r.estimatedNutrition.proteinas,
        carbohidratos: acc.carbohidratos + r.estimatedNutrition.carbohidratos,
        grasas: acc.grasas + r.estimatedNutrition.grasas,
        calorias: acc.calorias + r.estimatedNutrition.calorias,
      }),
      { proteinas: 0, carbohidratos: 0, grasas: 0, calorias: 0 }
    );

    // Macro changes
    const proteinChange = totals.proteinas - lastWeekTotals.proteinas;
    const carbsChange = totals.carbohidratos - lastWeekTotals.carbohidratos;
    const fatsChange = totals.grasas - lastWeekTotals.grasas;
    const caloriesChange = totals.calorias - lastWeekTotals.calorias;

    // Calculate balance score
    const macroTotal = totals.proteinas + totals.carbohidratos + totals.grasas;
    const proteinPercent = macroTotal > 0 ? (totals.proteinas / macroTotal) * 100 : 0;
    const carbPercent = macroTotal > 0 ? (totals.carbohidratos / macroTotal) * 100 : 0;
    const fatPercent = macroTotal > 0 ? (totals.grasas / macroTotal) * 100 : 0;

    // Ideal: 25% protein, 50% carbs, 25% fat
    const proteinDiff = Math.abs(proteinPercent - 25);
    const carbDiff = Math.abs(carbPercent - 50);
    const fatDiff = Math.abs(fatPercent - 25);
    
    // Score: 100 - average deviation from ideal
    const avgDeviation = (proteinDiff + carbDiff + fatDiff) / 3;
    const balanceScore = Math.max(0, Math.min(100, Math.round(100 - avgDeviation * 2)));

    // Most cooked recipe type analysis
    const recipeTypes: Record<string, number> = {};
    allCookedRecipes.forEach(r => {
      const name = r.recipe_name.toLowerCase();
      if (name.includes('pollo')) recipeTypes['Pollo'] = (recipeTypes['Pollo'] || 0) + 1;
      else if (name.includes('carne') || name.includes('bife')) recipeTypes['Carne'] = (recipeTypes['Carne'] || 0) + 1;
      else if (name.includes('pescado') || name.includes('salmon')) recipeTypes['Pescado'] = (recipeTypes['Pescado'] || 0) + 1;
      else if (name.includes('ensalada') || name.includes('verdura')) recipeTypes['Vegetales'] = (recipeTypes['Vegetales'] || 0) + 1;
      else if (name.includes('pasta') || name.includes('fideos')) recipeTypes['Pastas'] = (recipeTypes['Pastas'] || 0) + 1;
      else if (name.includes('arroz')) recipeTypes['Arroz'] = (recipeTypes['Arroz'] || 0) + 1;
      else recipeTypes['Otros'] = (recipeTypes['Otros'] || 0) + 1;
    });

    const topRecipeType = Object.entries(recipeTypes)
      .sort((a, b) => b[1] - a[1])[0];

    // Cooking streak (consecutive days)
    const uniqueDays = new Set(
      weeklyRecipes.map(r => new Date(r.cooked_at).toDateString())
    );
    const streak = uniqueDays.size;

    // Best day of the week
    const dayCount: Record<string, number> = {};
    weeklyRecipes.forEach(r => {
      const day = new Date(r.cooked_at).toLocaleDateString('es-AR', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])[0];

    // Average calories per day (cooking days only)
    const avgCaloriesPerDay = streak > 0 ? Math.round(totals.calorias / streak) : 0;

    // High protein meals count
    const highProteinMeals = weeklyRecipes.filter(r => r.estimatedNutrition.proteinas >= 25).length;

    // Balanced meals (close to ideal ratio)
    const balancedMeals = weeklyRecipes.filter(r => {
      const total = r.estimatedNutrition.proteinas + r.estimatedNutrition.carbohidratos + r.estimatedNutrition.grasas;
      if (total === 0) return false;
      const pPct = (r.estimatedNutrition.proteinas / total) * 100;
      const cPct = (r.estimatedNutrition.carbohidratos / total) * 100;
      return pPct >= 15 && pPct <= 35 && cPct >= 35 && cPct <= 60;
    }).length;

    return {
      thisWeekCount,
      lastWeekCount,
      weeklyChange,
      weeklyChangePercent,
      proteinChange,
      carbsChange,
      fatsChange,
      caloriesChange,
      balanceScore,
      topRecipeType: topRecipeType ? { name: topRecipeType[0], count: topRecipeType[1] } : null,
      streak,
      bestDay: bestDay ? { name: bestDay[0], count: bestDay[1] } : null,
      avgCaloriesPerDay,
      highProteinMeals,
      balancedMeals,
      totalRecipesEver: allCookedRecipes.length,
    };
  }, [weeklyRecipes, totals, allCookedRecipes]);

  const ChangeIndicator = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    if (value === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (value > 0) return (
      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs">
        <ArrowUp className="w-3 h-3" />
        +{Math.round(value)}{suffix}
      </span>
    );
    return (
      <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 text-xs">
        <ArrowDown className="w-3 h-3" />
        {Math.round(value)}{suffix}
      </span>
    );
  };

  if (stats.totalRecipesEver === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display">Historial Inteligente</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Análisis de tu balance nutricional
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-yellow-500 ml-auto animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Esta semana</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-primary">{stats.thisWeekCount}</p>
              <ChangeIndicator value={stats.weeklyChange} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-3 border border-orange-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Kcal/día</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.avgCaloriesPerDay}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Alta proteína</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.highProteinMeals}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-3 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Balanceadas</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.balancedMeals}</p>
          </motion.div>
        </div>

        {/* Balance Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl p-4 border border-primary/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Puntuación de Balance</span>
            </div>
            <Badge 
              className={cn(
                "font-bold",
                stats.balanceScore >= 70 ? "bg-emerald-500" :
                stats.balanceScore >= 50 ? "bg-amber-500" : "bg-red-500"
              )}
            >
              {stats.balanceScore}/100
            </Badge>
          </div>
          <Progress value={stats.balanceScore} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.balanceScore >= 70 
              ? "🏆 ¡Excelente balance! Tu alimentación es muy equilibrada" 
              : stats.balanceScore >= 50 
                ? "👍 Buen balance, con pequeños ajustes llegas al ideal" 
                : "💪 Intentá variar más tus comidas para mejor balance"}
          </p>
        </motion.div>

        {/* Week Comparison */}
        {stats.lastWeekCount > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Comparado con la semana anterior
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Proteínas</span>
                <ChangeIndicator value={stats.proteinChange} suffix="g" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Carbohidratos</span>
                <ChangeIndicator value={stats.carbsChange} suffix="g" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Grasas</span>
                <ChangeIndicator value={stats.fatsChange} suffix="g" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Calorías</span>
                <ChangeIndicator value={stats.caloriesChange} />
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Insights
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.streak > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                <Calendar className="w-3 h-3 mr-1" />
                {stats.streak} días cocinando
              </Badge>
            )}
            {stats.topRecipeType && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                <ChefHat className="w-3 h-3 mr-1" />
                Favorito: {stats.topRecipeType.name}
              </Badge>
            )}
            {stats.bestDay && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Mejor día: {stats.bestDay.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Total Achievement */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
          <Award className="w-5 h-5 text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">{stats.totalRecipesEver}</span> recetas cocinadas en total
            </p>
            <p className="text-xs text-muted-foreground">
              ¡Seguí sumando recetas caseras!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
