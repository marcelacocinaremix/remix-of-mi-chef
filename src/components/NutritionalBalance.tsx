import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useMealLogs } from "@/hooks/useMealLogs";
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
import { DailyMealLog } from "@/components/nutrition/DailyMealLog";
import { NutritionRecommendations } from "@/components/nutrition/NutritionRecommendations";

interface NutritionalBalanceProps {
  onRecommendRecipes?: () => void;
  onAddIngredientToCook?: (ingredientName: string) => void;
}

export function NutritionalBalance({ onRecommendRecipes, onAddIngredientToCook }: NutritionalBalanceProps) {
  const { meals, getTotalsForPeriod, getMealsForPeriod } = useMealLogs();
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
  const [balanceSubTab, setBalanceSubTab] = useState<string>("registro");
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>("week");
  const [nutritionPeriod, setNutritionPeriod] = useState<"day" | "week" | "month" | "year">("day");

  const isHealthProfileComplete = !!(goal?.goal && (goal?.weight_kg || goal?.target_weight_kg));

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

  // Period-based totals from meal_logs
  const periodTotals = useMemo(() => getTotalsForPeriod(nutritionPeriod), [getTotalsForPeriod, nutritionPeriod]);
  const periodMeals = useMemo(() => getMealsForPeriod(nutritionPeriod), [getMealsForPeriod, nutritionPeriod]);

  // For SmartBalanceAnalysis compatibility
  const totalsForAnalysis = useMemo(() => ({
    proteinas: periodTotals.protein,
    carbohidratos: periodTotals.carbs,
    grasas: periodTotals.fats,
    calorias: periodTotals.calories,
  }), [periodTotals]);

  // Pie chart data
  const pieData = useMemo(() => [
    { name: 'Proteínas', value: periodTotals.protein, color: 'hsl(var(--chart-1))' },
    { name: 'Carbohidratos', value: periodTotals.carbs, color: 'hsl(var(--chart-2))' },
    { name: 'Grasas', value: periodTotals.fats, color: 'hsl(var(--chart-3))' },
  ], [periodTotals]);

  // Daily breakdown for bar chart (last 7 days)
  const dailyData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayIndex = date.getDay();

      const dayMeals = meals.filter((m) => m.meal_date === dateStr);
      const dayTotals = dayMeals.reduce(
        (acc, m) => ({
          proteinas: acc.proteinas + Number(m.protein),
          carbohidratos: acc.carbohidratos + Number(m.carbs),
          grasas: acc.grasas + Number(m.fats),
        }),
        { proteinas: 0, carbohidratos: 0, grasas: 0 }
      );

      result.push({ day: days[dayIndex], ...dayTotals });
    }
    return result;
  }, [meals]);

  const chartConfig = {
    proteinas: { label: 'Proteínas', color: 'hsl(var(--chart-1))' },
    carbohidratos: { label: 'Carbohidratos', color: 'hsl(var(--chart-2))' },
    grasas: { label: 'Grasas', color: 'hsl(var(--chart-3))' },
  };

  // Map nutritionPeriod to BalancePeriod for SmartBalanceAnalysis
  const analysisBalancePeriod: BalancePeriod =
    nutritionPeriod === "day" || nutritionPeriod === "week" ? "week"
    : nutritionPeriod === "month" ? "month" : "year";

  return (
    <div className="space-y-6">
      {/* How it works */}
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
              <span className="text-[10px] text-muted-foreground leading-tight">Registrá tus comidas</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mb-1">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Seguí tu nutrición</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-1">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Registrá entrenamientos</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mb-1">
                <LayoutDashboard className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">Obtené tu resumen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Profile Setup */}
      <HealthProfileSetup
        currentProfile={currentHealthProfile}
        onSave={handleSaveHealthProfile}
        isSaving={isSaving}
        isComplete={isHealthProfileComplete}
      />

      {/* Sub-navigation */}
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
            weeklyRecipesCount={getMealsForPeriod("week").length}
            totalCaloriesConsumed={getTotalsForPeriod("week").calories}
            proteinPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.protein / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            carbsPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.carbs / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            fatsPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.fats / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            totalWorkouts={workouts.length}
          />
        )}

        {activeTab === "balance" && (
          <div className="space-y-4">
            {/* Banner */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <img
                src={balanceSubTab === "guia" ? nutrientsBanner : balanceBanner}
                alt={balanceSubTab === "guia" ? "Guía de Alimentos" : "Mi Nutrición"}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="px-4">
                  <h3 className="text-white font-bold text-lg">
                    {balanceSubTab === "guia" ? "Guía de Alimentos" : balanceSubTab === "graficos" ? "Gráficos" : "Mi Nutrición"}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {balanceSubTab === "guia" ? "Información nutricional" : balanceSubTab === "graficos" ? "Visualizá tu balance" : "Registrá lo que comés"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
              <button
                onClick={() => setBalanceSubTab("registro")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  balanceSubTab === "registro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Registro
              </button>
              <button
                onClick={() => setBalanceSubTab("graficos")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  balanceSubTab === "graficos"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Gráficos
              </button>
              <button
                onClick={() => setBalanceSubTab("guia")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  balanceSubTab === "guia"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Guía
              </button>
            </div>

            {/* Registro - Daily meal log (main view) */}
            {balanceSubTab === "registro" && (
              <div className="space-y-6">
                <DailyMealLog />

                {/* Recommendations based on today's meals */}
                <NutritionRecommendations
                  totals={getTotalsForPeriod("day")}
                  mealsCount={getMealsForPeriod("day").length}
                  period="day"
                  onNavigateToCooking={() => onRecommendRecipes?.()}
                />

                {/* Disclaimer */}
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Los valores son estimaciones orientativas, no información nutricional exacta.
                </p>
              </div>
            )}

            {/* Gráficos */}
            {balanceSubTab === "graficos" && (
              <div className="space-y-6">
                {/* Period selector */}
                <div className="flex p-1 bg-muted/50 rounded-lg">
                  {(["day", "week", "month", "year"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNutritionPeriod(p)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                        nutritionPeriod === p
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p === "day" ? "Día" : p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
                    </button>
                  ))}
                </div>

                {/* Smart analysis */}
                <SmartBalanceAnalysis
                  goal={goal}
                  totals={totalsForAnalysis}
                  recipesCount={periodMeals.length}
                  period={analysisBalancePeriod}
                  activityStats={activityStats}
                  onNavigateToActivity={() => setActiveTab("actividad")}
                  onRecommendRecipes={onRecommendRecipes}
                />

                {/* Totals summary */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">
                        Resumen {nutritionPeriod === "day" ? "del día" : nutritionPeriod === "week" ? "semanal" : nutritionPeriod === "month" ? "mensual" : "anual"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {periodMeals.length} comidas
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-lg font-bold">{Math.round(periodTotals.calories)}</p>
                        <p className="text-[10px] text-muted-foreground">Calorías</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-1/20 flex items-center justify-center">
                          <Beef className="w-4 h-4 text-chart-1" />
                        </div>
                        <p className="text-lg font-bold text-chart-1">{Math.round(periodTotals.protein)}g</p>
                        <p className="text-[10px] text-muted-foreground">Proteínas</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-2/20 flex items-center justify-center">
                          <Wheat className="w-4 h-4 text-chart-2" />
                        </div>
                        <p className="text-lg font-bold text-chart-2">{Math.round(periodTotals.carbs)}g</p>
                        <p className="text-[10px] text-muted-foreground">Carbos</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-3/20 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-chart-3" />
                        </div>
                        <p className="text-lg font-bold text-chart-3">{Math.round(periodTotals.fats)}g</p>
                        <p className="text-[10px] text-muted-foreground">Grasas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts */}
                {periodMeals.length > 0 ? (
                  <div className="space-y-4">
                    {/* Pie Chart - Macro Distribution */}
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          Distribución de Macros
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4 pt-3">
                        <div className="flex items-center gap-4">
                          <div className="h-[140px] w-[140px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
                                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex-1 space-y-3">
                            {pieData.map((item, index) => {
                              const total = pieData.reduce((s, i) => s + i.value, 0);
                              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                              return (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                      <span className="font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-muted-foreground">{Math.round(item.value)}g ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bar Chart - Weekly */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Evolución Semanal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} barGap={1} barSize={20}>
                              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                              <YAxis hide domain={[0, 'dataMax + 10']} />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number, name: string) => {
                                  const labels: { [key: string]: string } = { proteinas: 'Proteínas', carbohidratos: 'Carbos', grasas: 'Grasas' };
                                  return [`${Math.round(value)}g`, labels[name] || name];
                                }}
                              />
                              <Bar dataKey="proteinas" stackId="a" fill={chartConfig.proteinas.color} radius={[0, 0, 0, 0]} />
                              <Bar dataKey="carbohidratos" stackId="a" fill={chartConfig.carbohidratos.color} radius={[0, 0, 0, 0]} />
                              <Bar dataKey="grasas" stackId="a" fill={chartConfig.grasas.color} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-3">
                          {Object.entries(chartConfig).map(([key, config]) => (
                            <div key={key} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                              <span className="text-[11px] text-muted-foreground">{config.label}</span>
                            </div>
                          ))}
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
                        Registrá comidas para ver tus gráficos nutricionales
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations for the period */}
                <NutritionRecommendations
                  totals={periodTotals}
                  mealsCount={periodMeals.length}
                  period={nutritionPeriod}
                  onNavigateToCooking={() => onRecommendRecipes?.()}
                />

                {/* Meals list for period */}
                {periodMeals.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Comidas registradas
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {periodMeals.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {periodMeals.slice(0, 8).map((meal) => (
                          <div key={meal.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{meal.food_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(meal.meal_date + "T12:00:00").toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {" • "}{meal.meal_type.replace("_", " ")}
                              </p>
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span className="text-chart-1">{Math.round(Number(meal.protein))}g P</span>
                              <span className="text-chart-2">{Math.round(Number(meal.carbs))}g C</span>
                              <span className="text-chart-3">{Math.round(Number(meal.fats))}g G</span>
                            </div>
                          </div>
                        ))}
                        {periodMeals.length > 8 && (
                          <p className="text-xs text-center text-muted-foreground pt-2">
                            +{periodMeals.length - 8} comidas más
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Los valores son estimaciones orientativas, no información nutricional exacta.
                </p>
              </div>
            )}

            {/* Guía de Alimentos */}
            {balanceSubTab === "guia" && (
              <FoodNutritionGuide onAddToCook={handleAddToCook} />
            )}
          </div>
        )}

        {activeTab === "actividad" && (
          <div className="space-y-6">
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <img src={actividadBanner} alt="Actividad física" className="w-full h-full object-cover" />
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
