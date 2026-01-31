import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BalancePeriod } from "./PeriodSelector";

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

interface BalanceEvolutionChartProps {
  recipes: RecipeWithNutrition[];
  period: BalancePeriod;
}

export function BalanceEvolutionChart({ recipes, period }: BalanceEvolutionChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { label: string; calories: number; protein: number }[] = [];

    if (period === "week") {
      // Last 7 days
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayRecipes = recipes.filter(r => 
          new Date(r.cooked_at).toDateString() === dateStr
        );
        
        const dayTotals = dayRecipes.reduce(
          (acc, r) => ({
            calories: acc.calories + r.estimatedNutrition.calorias,
            protein: acc.protein + r.estimatedNutrition.proteinas,
          }),
          { calories: 0, protein: 0 }
        );
        
        data.push({
          label: days[date.getDay()],
          calories: dayTotals.calories,
          protein: dayTotals.protein,
        });
      }
    } else if (period === "month") {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        
        const weekRecipes = recipes.filter(r => {
          const date = new Date(r.cooked_at);
          return date >= weekStart && date <= weekEnd;
        });
        
        const weekTotals = weekRecipes.reduce(
          (acc, r) => ({
            calories: acc.calories + r.estimatedNutrition.calorias,
            protein: acc.protein + r.estimatedNutrition.proteinas,
          }),
          { calories: 0, protein: 0 }
        );
        
        data.push({
          label: `Sem ${4 - i}`,
          calories: weekTotals.calories,
          protein: weekTotals.protein,
        });
      }
    } else {
      // Last 12 months
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthRecipes = recipes.filter(r => {
          const date = new Date(r.cooked_at);
          return date >= monthDate && date <= monthEnd;
        });
        
        const monthTotals = monthRecipes.reduce(
          (acc, r) => ({
            calories: acc.calories + r.estimatedNutrition.calorias,
            protein: acc.protein + r.estimatedNutrition.proteinas,
          }),
          { calories: 0, protein: 0 }
        );
        
        data.push({
          label: months[monthDate.getMonth()],
          calories: monthTotals.calories,
          protein: monthTotals.protein,
        });
      }
    }

    return data;
  }, [recipes, period]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { calories: 0, protein: 0 };
    
    const recent = chartData.slice(-2);
    const prev = chartData.slice(-4, -2);
    
    const recentCalories = recent.reduce((sum, d) => sum + d.calories, 0) / recent.length;
    const prevCalories = prev.reduce((sum, d) => sum + d.calories, 0) / (prev.length || 1);
    const recentProtein = recent.reduce((sum, d) => sum + d.protein, 0) / recent.length;
    const prevProtein = prev.reduce((sum, d) => sum + d.protein, 0) / (prev.length || 1);
    
    return {
      calories: prevCalories > 0 ? Math.round(((recentCalories - prevCalories) / prevCalories) * 100) : 0,
      protein: prevProtein > 0 ? Math.round(((recentProtein - prevProtein) / prevProtein) * 100) : 0,
    };
  }, [chartData]);

  const hasData = chartData.some(d => d.calories > 0);

  if (!hasData) {
    return null;
  }

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (value > 0) return (
      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs">
        <ArrowUp className="w-3 h-3" />
        +{value}%
      </span>
    );
    return (
      <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 text-xs">
        <ArrowDown className="w-3 h-3" />
        {value}%
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolución
            </span>
            <div className="flex items-center gap-3 text-xs font-normal">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Calorías
                <TrendIndicator value={trend.calories} />
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-chart-1" />
                Proteínas
                <TrendIndicator value={trend.protein} />
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  hide
                  domain={[0, 'dataMax + 100']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      calories: 'Calorías',
                      protein: 'Proteínas',
                    };
                    return [name === 'protein' ? `${value}g` : value, labels[name] || name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorCalories)"
                />
                <Area 
                  type="monotone" 
                  dataKey="protein" 
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#colorProtein)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
