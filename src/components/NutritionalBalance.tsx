import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useCookedRecipes, CookedRecipe } from "@/hooks/useCookedRecipes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityTracking, ActivityProfile } from "@/hooks/useActivityTracking";
import { 
  Beef, 
  Wheat, 
  Droplets, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  ChefHat,
  Flame,
  Target,
  BookOpen,
  BarChart3,
  Dumbbell,
  LayoutDashboard,
} from "lucide-react";
import actividadBanner from "@/assets/actividad-banner.jpg";
import balanceBanner from "@/assets/balance-banner.jpg";
import nutrientsBanner from "@/assets/nutrients-banner.jpg";
import { FoodNutritionGuide } from "@/components/FoodNutritionGuide";
import { BalanceSmartHistory } from "@/components/BalanceSmartHistory";
import { ActivitySection } from "@/components/ActivitySection";
import { HealthProfileSetup, HealthProfile } from "@/components/health/HealthProfileSetup";
import { HealthSummary } from "@/components/health/HealthSummary";
import { toast } from "sonner";
import { PeriodSelector, BalancePeriod } from "@/components/balance/PeriodSelector";
import { SmartBalanceAnalysis } from "@/components/balance/SmartBalanceAnalysis";
import { BalanceEvolutionChart } from "@/components/balance/BalanceEvolutionChart";

interface NutritionalData {
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  calorias: number;
}

interface RecipeWithNutrition extends CookedRecipe {
  estimatedNutrition: NutritionalData;
}

// Estimate nutrition from recipe data (simplified estimation based on ingredients/type)
const estimateNutrition = (recipe: CookedRecipe): NutritionalData => {
  const recipeData = recipe.recipe_data as any;
  const name = recipe.recipe_name.toLowerCase();
  const ingredients = recipeData?.ingredients || [];
  
  // Base estimates based on common recipe patterns
  let proteinas = 15;
  let carbohidratos = 30;
  let grasas = 10;
  let calorias = 300;
  
  // Adjust based on recipe name keywords
  if (name.includes('pollo') || name.includes('carne') || name.includes('pescado') || name.includes('cerdo')) {
    proteinas += 20;
    calorias += 100;
  }
  if (name.includes('ensalada') || name.includes('verdura')) {
    carbohidratos -= 10;
    grasas -= 5;
    calorias -= 100;
  }
  if (name.includes('pasta') || name.includes('arroz') || name.includes('fideos')) {
    carbohidratos += 30;
    calorias += 150;
  }
  if (name.includes('frito') || name.includes('milanesa')) {
    grasas += 15;
    calorias += 200;
  }
  if (name.includes('sopa') || name.includes('caldo')) {
    calorias -= 100;
    proteinas += 5;
  }
  if (name.includes('torta') || name.includes('postre') || name.includes('dulce')) {
    carbohidratos += 40;
    grasas += 10;
    calorias += 250;
  }
  
  // Adjust based on ingredients
  ingredients.forEach((ing: string) => {
    const ingLower = ing.toLowerCase();
    if (ingLower.includes('huevo')) { proteinas += 5; grasas += 3; }
    if (ingLower.includes('queso')) { proteinas += 5; grasas += 8; }
    if (ingLower.includes('aceite')) { grasas += 10; }
    if (ingLower.includes('papa') || ingLower.includes('batata')) { carbohidratos += 15; }
    if (ingLower.includes('legumbre') || ingLower.includes('lentejas') || ingLower.includes('porotos')) {
      proteinas += 10;
      carbohidratos += 20;
    }
  });
  
  return {
    proteinas: Math.max(5, Math.min(60, proteinas)),
    carbohidratos: Math.max(10, Math.min(80, carbohidratos)),
    grasas: Math.max(5, Math.min(40, grasas)),
    calorias: Math.max(150, Math.min(800, calorias)),
  };
};

interface NutritionalBalanceProps {
  onRecommendRecipes?: () => void;
  onAddIngredientToCook?: (ingredientName: string) => void;
}

export function NutritionalBalance({ onRecommendRecipes, onAddIngredientToCook }: NutritionalBalanceProps) {
  const { cookedRecipes, isLoading } = useCookedRecipes();
  const {
    goal,
    stats: activityStats,
    workouts,
    updateActivityProfile,
    isSaving,
    isLoading: isActivityLoading,
  } = useActivityTracking();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("balance");
  const [balanceSubTab, setBalanceSubTab] = useState<string>("nutricion");
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>("week");
  // Check if health profile is complete
  const isHealthProfileComplete = !!(goal?.goal && (goal?.weight_kg || goal?.target_weight_kg));

  // Convert goal to HealthProfile format
  const currentHealthProfile: HealthProfile | null = goal ? {
    weight_kg: goal.weight_kg ? Number(goal.weight_kg) : null,
    target_weight_kg: goal.target_weight_kg ? Number(goal.target_weight_kg) : null,
    height_cm: goal.height_cm ? Number(goal.height_cm) : null,
    goal: goal.goal,
    target_weeks: goal.target_weeks || 12,
    weekly_workout_target: goal.weekly_workout_target || 3,
  } : null;

  const handleSaveHealthProfile = async (profile: HealthProfile): Promise<boolean> => {
    const activityProfile: ActivityProfile = {
      ...profile,
      target_date: null,
    };
    return await updateActivityProfile(activityProfile);
  };

  const handleAddToCook = (food: { name: string; protein: number; carbs: number; fats: number; calories: number; portion: string }, category: string) => {
    if (onAddIngredientToCook) {
      onAddIngredientToCook(food.name);
    } else {
      toast.success(`${food.name} agregado`, {
        description: `${food.protein}g proteína • ${food.carbs}g carbos • ${food.fats}g grasas`,
      });
    }
  };
  
  // Get recipes based on selected period
  const periodRecipes = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;
    
    if (balancePeriod === "week") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (balancePeriod === "month") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else {
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }
    
    return cookedRecipes
      .filter(recipe => new Date(recipe.cooked_at) >= cutoffDate)
      .map(recipe => ({
        ...recipe,
        estimatedNutrition: estimateNutrition(recipe),
      }));
  }, [cookedRecipes, balancePeriod]);

  // Get recipes from the last 7 days (for weekly chart)
  const weeklyRecipes = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    return cookedRecipes
      .filter(recipe => new Date(recipe.cooked_at) >= cutoffDate)
      .map(recipe => ({
        ...recipe,
        estimatedNutrition: estimateNutrition(recipe),
      }));
  }, [cookedRecipes]);

  // All cooked recipes with nutrition for history
  const allCookedWithNutrition = useMemo(() => {
    return cookedRecipes.map(recipe => ({
      ...recipe,
      estimatedNutrition: estimateNutrition(recipe),
    }));
  }, [cookedRecipes]);
  
  // Calculate totals for selected period
  const totals = useMemo(() => {
    return periodRecipes.reduce(
      (acc, recipe) => ({
        proteinas: acc.proteinas + recipe.estimatedNutrition.proteinas,
        carbohidratos: acc.carbohidratos + recipe.estimatedNutrition.carbohidratos,
        grasas: acc.grasas + recipe.estimatedNutrition.grasas,
        calorias: acc.calorias + recipe.estimatedNutrition.calorias,
      }),
      { proteinas: 0, carbohidratos: 0, grasas: 0, calorias: 0 }
    );
  }, [periodRecipes]);
  
  // Calculate percentages for pie chart
  const macroTotal = totals.proteinas + totals.carbohidratos + totals.grasas;
  const pieData = useMemo(() => [
    { name: 'Proteínas', value: totals.proteinas, color: 'hsl(var(--chart-1))' },
    { name: 'Carbohidratos', value: totals.carbohidratos, color: 'hsl(var(--chart-2))' },
    { name: 'Grasas', value: totals.grasas, color: 'hsl(var(--chart-3))' },
  ], [totals]);
  
  // Daily breakdown for bar chart
  const dailyData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayIndex = date.getDay();
      
      const dayRecipes = weeklyRecipes.filter(r => {
        const recipeDate = new Date(r.cooked_at);
        return recipeDate.toDateString() === date.toDateString();
      });
      
      const dayTotals = dayRecipes.reduce(
        (acc, r) => ({
          proteinas: acc.proteinas + r.estimatedNutrition.proteinas,
          carbohidratos: acc.carbohidratos + r.estimatedNutrition.carbohidratos,
          grasas: acc.grasas + r.estimatedNutrition.grasas,
        }),
        { proteinas: 0, carbohidratos: 0, grasas: 0 }
      );
      
      result.push({
        day: days[dayIndex],
        ...dayTotals,
      });
    }
    
    return result;
  }, [weeklyRecipes]);
  
  
  const chartConfig = {
    proteinas: { label: 'Proteínas', color: 'hsl(var(--chart-1))' },
    carbohidratos: { label: 'Carbohidratos', color: 'hsl(var(--chart-2))' },
    grasas: { label: 'Grasas', color: 'hsl(var(--chart-3))' },
  };
  
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* How it works - Intro Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">¿Cómo funciona?</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-1">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Agregá tu objetivo</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mb-1">
                <ChefHat className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Cocinás y se sincroniza</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-1">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Registrá entrenamientos</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mb-1">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Obtené tu resumen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Profile Setup - Above navigation */}
      <HealthProfileSetup
        currentProfile={currentHealthProfile}
        onSave={handleSaveHealthProfile}
        isSaving={isSaving}
        isComplete={isHealthProfileComplete}
      />

      {/* Sub-navigation - Compact style */}
      <div className="bg-card/50 rounded-xl p-1.5 border border-border/30">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveTab("balance")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-medium transition-all duration-300",
              activeTab === "balance"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background hover:bg-background/80 text-foreground"
            )}
          >
            <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-xs">{t("healthTabBalance")}</span>
          </button>
          <button
            onClick={() => setActiveTab("actividad")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-medium transition-all duration-300",
              activeTab === "actividad"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background hover:bg-background/80 text-foreground"
            )}
          >
            <Dumbbell className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-xs">{t("healthTabActivity")}</span>
          </button>
          <button
            onClick={() => setActiveTab("resumen")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg font-medium transition-all duration-300",
              activeTab === "resumen"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background hover:bg-background/80 text-foreground"
            )}
          >
            <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-xs">{t("healthTabSummary")}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === "resumen" && (
          <HealthSummary
            goal={goal}
            stats={activityStats}
            weeklyRecipesCount={weeklyRecipes.length}
            totalCaloriesConsumed={totals.calorias}
            proteinPercent={macroTotal > 0 ? (totals.proteinas / macroTotal) * 100 : 0}
            carbsPercent={macroTotal > 0 ? (totals.carbohidratos / macroTotal) * 100 : 0}
            fatsPercent={macroTotal > 0 ? (totals.grasas / macroTotal) * 100 : 0}
            totalWorkouts={workouts.length}
          />
        )}

        {activeTab === "balance" && (
          <div className="space-y-4">
            {/* Banner dinámico según sub-tab */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <img 
                src={balanceSubTab === "guia" ? nutrientsBanner : balanceBanner} 
                alt={balanceSubTab === "guia" ? "Guía de Alimentos" : "Mi Balance Nutricional"} 
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="px-4">
                  <h3 className="text-white font-bold text-lg">
                    {balanceSubTab === "guia" ? "Guía de Alimentos" : "Mi Balance"}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {balanceSubTab === "guia" ? "Información nutricional" : "Tu nutrición semanal"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-tabs dentro de Balance */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setBalanceSubTab("nutricion")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  balanceSubTab === "nutricion"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Nutrición
              </button>
              <button
                onClick={() => setBalanceSubTab("guia")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  balanceSubTab === "guia"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Guía de Alimentos
              </button>
            </div>

            {/* Contenido según sub-tab */}
            {balanceSubTab === "nutricion" && (
              <div className="space-y-6">
                
                {/* Period Selector */}
                <PeriodSelector value={balancePeriod} onChange={setBalancePeriod} />
                
                {/* Smart Balance Analysis - Goal connected */}
                <SmartBalanceAnalysis
                  goal={goal}
                  totals={totals}
                  recipesCount={periodRecipes.length}
                  period={balancePeriod}
                  activityStats={activityStats}
                  onNavigateToActivity={() => setActiveTab("actividad")}
                  onRecommendRecipes={onRecommendRecipes}
                />

                {/* Evolution Chart */}
                <BalanceEvolutionChart 
                  recipes={allCookedWithNutrition}
                  period={balancePeriod}
                />
            
            {/* Stats summary */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    Resumen {balancePeriod === "week" ? "semanal" : balancePeriod === "month" ? "mensual" : "anual"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {periodRecipes.length} recetas
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-1/20 flex items-center justify-center">
                      <Beef className="w-4 h-4 text-chart-1" />
                    </div>
                    <p className="text-lg font-bold text-chart-1">{Math.round(totals.proteinas)}g</p>
                    <p className="text-[10px] text-muted-foreground">Proteínas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-2/20 flex items-center justify-center">
                      <Wheat className="w-4 h-4 text-chart-2" />
                    </div>
                    <p className="text-lg font-bold text-chart-2">{Math.round(totals.carbohidratos)}g</p>
                    <p className="text-[10px] text-muted-foreground">Carbos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-3/20 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-chart-3" />
                    </div>
                    <p className="text-lg font-bold text-chart-3">{Math.round(totals.grasas)}g</p>
                    <p className="text-[10px] text-muted-foreground">Grasas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-accent/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-lg font-bold text-accent">{Math.round(totals.calorias)}</p>
                    <p className="text-[10px] text-muted-foreground">Calorías</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Charts */}
            {periodRecipes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Pie Chart - Macro distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Distribución de Macros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[160px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${Math.round(value)}g`,
                              name === 'value' ? '' : name
                            ]}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-2">
                      {pieData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Bar Chart - Daily breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Consumo Semanal por Día
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[160px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} barGap={0}>
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            hide 
                            domain={[0, 'dataMax + 10']}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number, name: string) => {
                              const labels: { [key: string]: string } = {
                                proteinas: 'Proteínas',
                                carbohidratos: 'Carbos',
                                grasas: 'Grasas'
                              };
                              return [`${Math.round(value)}g`, labels[name] || name];
                            }}
                          />
                          <Bar 
                            dataKey="proteinas" 
                            stackId="a"
                            fill={chartConfig.proteinas.color}
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar 
                            dataKey="carbohidratos" 
                            stackId="a"
                            fill={chartConfig.carbohidratos.color}
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar 
                            dataKey="grasas" 
                            stackId="a"
                            fill={chartConfig.grasas.color}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Todavía no hay datos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Marcá recetas como cocinadas para ver tu balance nutricional
                  </p>
                  <Button onClick={onRecommendRecipes} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Empezar a cocinar
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Recent recipes */}
            {periodRecipes.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    Recetas {balancePeriod === "week" ? "de la Semana" : balancePeriod === "month" ? "del Mes" : "del Año"}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {periodRecipes.length} recetas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {periodRecipes.slice(0, 5).map((recipe) => (
                      <div 
                        key={recipe.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{recipe.recipe_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(recipe.cooked_at).toLocaleDateString('es-AR', { 
                              weekday: 'short', 
                              day: 'numeric',
                              month: balancePeriod !== "week" ? 'short' : undefined 
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-chart-1">{recipe.estimatedNutrition.proteinas}g P</span>
                          <span className="text-chart-2">{recipe.estimatedNutrition.carbohidratos}g C</span>
                          <span className="text-chart-3">{recipe.estimatedNutrition.grasas}g G</span>
                        </div>
                      </div>
                    ))}
                    {periodRecipes.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{periodRecipes.length - 5} recetas más
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Smart History */}
            <BalanceSmartHistory 
              weeklyRecipes={weeklyRecipes}
              totals={totals}
              allCookedRecipes={allCookedWithNutrition}
            />

            {/* Disclaimer */}
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Los valores son estimaciones orientativas, no información nutricional exacta.
            </p>
              </div>
            )}

            {/* Guía de Alimentos sub-tab */}
            {balanceSubTab === "guia" && (
              <FoodNutritionGuide onAddToCook={handleAddToCook} />
            )}
          </div>
        )}

        {activeTab === "actividad" && (
          <div className="space-y-6">
            {/* Banner de Actividad */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <img 
                src={actividadBanner} 
                alt="Actividad física" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="px-4">
                  <h3 className="text-white font-bold text-lg">Tu Actividad</h3>
                  <p className="text-white/80 text-sm">Registra y sigue tu progreso</p>
                </div>
              </div>
            </div>
            <ActivitySection onNavigateToBalance={() => setActiveTab("balance")} />
          </div>
        )}

      </div>
    </div>
  );
}
