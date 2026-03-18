import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Crown,
  Lock,
  Trash2,
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
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";
import { Button } from "@/components/ui/button";

interface NutritionalBalanceProps {
  onRecommendRecipes?: () => void;
  onAddIngredientToCook?: (ingredientName: string) => void;
  onSubTabChange?: (subTab: string) => void;
}

export function NutritionalBalance({ onRecommendRecipes, onAddIngredientToCook, onSubTabChange }: NutritionalBalanceProps) {
  const { meals, getTotalsForPeriod, getMealsForPeriod, deleteMeal, refetch: refetchMeals } = useMealLogs();
  const { isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const {
    goal,
    stats: activityStats,
    workouts,
    updateActivityProfile,
    isSaving,
    isLoading: isActivityLoading,
    refetch: refetchActivity,
    getWorkoutsByPeriod,
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
            <span className="text-sm font-semibold text-foreground">{t("balanceHowItWorks")}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-1">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{t("balanceStep1")}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mb-1">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{t("balanceStep2")}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-1">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{t("balanceStep3")}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mb-1">
                <LayoutDashboard className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{t("balanceStep4")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Profile Setup */}
      <div className={cn(balanceBlocked && "opacity-60 pointer-events-none")}>
        <HealthProfileSetup
          currentProfile={currentHealthProfile}
          onSave={handleSaveHealthProfile}
          isSaving={isSaving}
          isComplete={isHealthProfileComplete}
        />
      </div>

      {/* Active goal indicator */}
      {goal?.goal && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">
            {t("balanceActiveGoal")} {goal.goal === "lose_fat" ? t("balanceGoalLoseFat") : goal.goal === "gain_muscle" ? t("balanceGoalGainMuscle") : goal.goal === "improve_performance" ? t("balanceGoalImprovePerformance") : t("balanceGoalStayActive")}
          </span>
        </div>
      )}

      {/* Segmented Control — underline style */}
      <div className="flex border-b border-border/50">
        {([
          { id: "balance",   label: "Nutrición", icon: BarChart3      },
          { id: "actividad", label: "Actividad", icon: Dumbbell        },
          { id: "resumen",   label: "Resumen",   icon: LayoutDashboard },
        ] as const).map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); onSubTabChange?.(id); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 pb-2.5 pt-1 text-xs font-medium transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2 : 1.5} />
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4/5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === "resumen" && (
          <div className={cn(balanceBlocked && "opacity-60 pointer-events-none")}>
          <HealthSummary
            goal={goal}
            stats={activityStats}
            weeklyRecipesCount={getMealsForPeriod("week").length}
            totalCaloriesConsumed={getTotalsForPeriod("week").calories}
            proteinPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.protein / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            carbsPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.carbs / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            fatsPercent={periodTotals.protein + periodTotals.carbs + periodTotals.fats > 0 ? (periodTotals.fats / (periodTotals.protein + periodTotals.carbs + periodTotals.fats)) * 100 : 0}
            totalWorkouts={workouts.length}
            todayCalories={getTotalsForPeriod("day").calories}
            todayProtein={getTotalsForPeriod("day").protein}
            todayCarbs={getTotalsForPeriod("day").carbs}
            todayFats={getTotalsForPeriod("day").fats}
            todayMealsCount={getMealsForPeriod("day").length}
            getNutritionForPeriod={(period) => {
              const totals = getTotalsForPeriod(period);
              const periodMeals = getMealsForPeriod(period);
              return {
                calories: totals.calories,
                protein: totals.protein,
                carbs: totals.carbs,
                fats: totals.fats,
                mealsCount: periodMeals.length,
              };
            }}
            getWorkoutsForPeriod={(period) => getWorkoutsByPeriod(period).length}
          />
          </div>
        )}

        {activeTab === "balance" && (
          <div className="space-y-4">
            {/* Banner */}
            <div className="relative w-full h-[100px] rounded-xl overflow-hidden border border-slate-100 dark:border-border/30">
              <img
                src={balanceSubTab === "guia" ? nutrientsBanner : balanceBanner}
                alt={balanceSubTab === "guia" ? "Trucos del Chef" : "Mi Nutrición"}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
                <div className="px-4">
                  <h3 className="text-white font-semibold text-base drop-shadow-lg">
                    {balanceSubTab === "guia" ? t("balanceBannerGuide") : balanceSubTab === "graficos" ? t("balanceBannerCharts") : t("balanceBannerTitle")}
                  </h3>
                  <p className="text-white/80 text-xs font-light drop-shadow-md">
                    {balanceSubTab === "guia" ? t("balanceBannerGuideSubtitle") : balanceSubTab === "graficos" ? t("balanceBannerChartsSubtitle") : t("balanceBannerSubtitle")}
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
                {t("balanceTabRegistro")}
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
                {t("balanceTabGraficos")}
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
                {t("balanceTabGuia")}
              </button>
            </div>

            {/* Registro - Daily meal log (main view) */}
            {balanceSubTab === "registro" && (
              <div className="space-y-6">
                <DailyMealLog onMealsChanged={refetchMeals} fitnessGoal={goal?.goal} />

                {/* Recommendations based on today's meals */}
                <NutritionRecommendations
                  totals={getTotalsForPeriod("day")}
                  mealsCount={getMealsForPeriod("day").length}
                  period="day"
                  fitnessGoal={goal?.goal}
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
                      {p === "day" ? t("balancePeriodDay") : p === "week" ? t("balancePeriodWeek") : p === "month" ? t("balancePeriodMonth") : t("balancePeriodYear")}
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
                        {t("balanceSummaryTitle")} {nutritionPeriod === "day" ? t("balanceSummaryDaily") : nutritionPeriod === "week" ? t("balanceSummaryWeekly") : nutritionPeriod === "month" ? t("balanceSummaryMonthly") : t("balanceSummaryYearly")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {periodMeals.length} {t("balanceMeals")}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-lg font-bold">{Math.round(periodTotals.calories)}</p>
                        <p className="text-[10px] text-muted-foreground">{t("balanceCalories")}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-1/20 flex items-center justify-center">
                          <Beef className="w-4 h-4 text-chart-1" />
                        </div>
                        <p className="text-lg font-bold text-chart-1">{Math.round(periodTotals.protein)}g</p>
                        <p className="text-[10px] text-muted-foreground">{t("balanceProtein")}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-2/20 flex items-center justify-center">
                          <Wheat className="w-4 h-4 text-chart-2" />
                        </div>
                        <p className="text-lg font-bold text-chart-2">{Math.round(periodTotals.carbs)}g</p>
                        <p className="text-[10px] text-muted-foreground">{t("balanceCarbs")}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-chart-3/20 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-chart-3" />
                        </div>
                        <p className="text-lg font-bold text-chart-3">{Math.round(periodTotals.fats)}g</p>
                        <p className="text-[10px] text-muted-foreground">{t("balanceFats")}</p>
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
                          {t("balanceMacroDistribution")}
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
                          {t("balanceWeeklyEvolution")}
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
                                  const labels: { [key: string]: string } = { proteinas: t("balSmartProtein"), carbohidratos: t("balSmartCarbs"), grasas: t("balSmartFats") };
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
                      <h3 className="font-semibold mb-2">{t("balanceNoData")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("balanceNoDataDesc")}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations for the period */}
                <NutritionRecommendations
                  totals={periodTotals}
                  mealsCount={periodMeals.length}
                  period={nutritionPeriod}
                  fitnessGoal={goal?.goal}
                  onNavigateToCooking={() => onRecommendRecipes?.()}
                />

                {/* Meals list for period — with delete */}
                {periodMeals.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        {t("balanceRegisteredMeals")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {periodMeals.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="divide-y divide-border/30">
                        {periodMeals.slice(0, 10).map((meal) => (
                          <div key={meal.id} className="flex items-center gap-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{meal.food_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(meal.meal_date + "T12:00:00").toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {" · "}{meal.meal_type.replace("_", " ")}
                                {" · "}<span className="font-medium">{Math.round(Number(meal.calories))} kcal</span>
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                              onClick={async () => {
                                const ok = await deleteMeal(meal.id);
                                if (ok) toast.success("Comida eliminada");
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        {periodMeals.length > 10 && (
                          <p className="text-xs text-center text-muted-foreground pt-3">
                            +{periodMeals.length - 10} {t("balanceMeals")} más
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("balanceDisclaimer")}
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
          <div className={cn("space-y-4", balanceBlocked && "opacity-60 pointer-events-none")}>
            <div className="relative w-full h-[100px] rounded-xl overflow-hidden">
              <img src={actividadBanner} alt="Actividad física" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent flex items-center">
                <div className="px-4">
                  <h3 className="text-white font-semibold text-base">{t("balanceActivityTitle")}</h3>
                  <p className="text-white/80 text-xs font-light">{t("balanceActivitySubtitle")}</p>
                </div>
              </div>
            </div>
            <ActivitySection onNavigateToBalance={() => setActiveTab("balance")} onWorkoutsChanged={refetchActivity} />
          </div>
        )}
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
}
