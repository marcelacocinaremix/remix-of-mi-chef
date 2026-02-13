import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from "recharts";
import { BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WorkoutLog, WorkoutType } from "@/hooks/useActivityTracking";
import { cn, formatLocalDate } from "@/lib/utils";

interface ChartDataPoint {
  day: string;
  minutos: number;
  calorias: number;
  workouts: number;
  types: WorkoutType[];
  intensities: number[];
  isBest?: boolean;
}

interface ActivityProgressChartProps {
  getWorkoutsByPeriod: (period: 'week' | 'month' | 'year') => WorkoutLog[];
  weeklyTarget: number;
}

const WORKOUT_LABELS: Record<WorkoutType, { es: string; en: string }> = {
  strength: { es: "Musculación", en: "Strength" },
  cardio: { es: "Cardio", en: "Cardio" },
  boxing: { es: "Boxeo", en: "Boxing" },
  functional: { es: "Funcional", en: "Functional" },
  yoga: { es: "Yoga", en: "Yoga" },
  swimming: { es: "Natación", en: "Swimming" },
  running: { es: "Running", en: "Running" },
  cycling: { es: "Ciclismo", en: "Cycling" },
  hiit: { es: "HIIT", en: "HIIT" },
  other: { es: "Otro", en: "Other" },
};

export function ActivityProgressChart({ getWorkoutsByPeriod, weeklyTarget }: ActivityProgressChartProps) {
  const { language } = useLanguage();
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('week');
  const [isAnimated, setIsAnimated] = useState(false);

  // Chart data for the selected period
  const chartData = useMemo(() => {
    const periodWorkouts = getWorkoutsByPeriod(timePeriod);
    let data: ChartDataPoint[] = [];
    
    if (timePeriod === 'week') {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatLocalDate(date);
        const dayWorkouts = periodWorkouts.filter(w => w.workout_date === dateStr);
        const dayMinutes = dayWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);
        const dayCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        
        data.push({
          day: language === 'es' ? days[date.getDay()] : daysEn[date.getDay()],
          minutos: dayMinutes,
          calorias: dayCalories,
          workouts: dayWorkouts.length,
          types: dayWorkouts.map(w => w.workout_type),
          intensities: dayWorkouts.map(w => w.intensity || 5),
        });
      }
    } else if (timePeriod === 'month') {
      const today = new Date();
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        
        const weekWorkouts = periodWorkouts.filter(w => {
          const wDate = new Date(w.workout_date);
          return wDate >= weekStart && wDate <= weekEnd;
        });
        
        data.push({
          day: language === 'es' ? `Sem ${4 - i}` : `Week ${4 - i}`,
          minutos: weekWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0),
          calorias: weekWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
          workouts: weekWorkouts.length,
          types: weekWorkouts.map(w => w.workout_type),
          intensities: weekWorkouts.map(w => w.intensity || 5),
        });
      }
    } else {
      const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthIndex = monthDate.getMonth();
        const year = monthDate.getFullYear();
        
        const monthWorkouts = periodWorkouts.filter(w => {
          const wDate = new Date(w.workout_date);
          return wDate.getMonth() === monthIndex && wDate.getFullYear() === year;
        });
        
        data.push({
          day: language === 'es' ? monthNamesEs[monthIndex] : monthNamesEn[monthIndex],
          minutos: monthWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0),
          calorias: monthWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
          workouts: monthWorkouts.length,
          types: monthWorkouts.map(w => w.workout_type),
          intensities: monthWorkouts.map(w => w.intensity || 5),
        });
      }
    }

    // Find best day
    const maxMinutes = Math.max(...data.map(d => d.minutos));
    if (maxMinutes > 0) {
      const bestIndex = data.findIndex(d => d.minutos === maxMinutes);
      if (bestIndex >= 0) {
        data[bestIndex].isBest = true;
      }
    }

    return data;
  }, [timePeriod, getWorkoutsByPeriod, language]);

  // Target line value (average minutes per day based on weekly target)
  const targetMinutesPerDay = timePeriod === 'week' ? (weeklyTarget * 45) / 7 : undefined;

  // Trigger animation on period change
  const handlePeriodChange = (value: string) => {
    setIsAnimated(false);
    setTimePeriod(value as 'week' | 'month' | 'year');
    setTimeout(() => setIsAnimated(true), 50);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const data = payload[0].payload as ChartDataPoint;
    const avgIntensity = data.intensities.length > 0 
      ? Math.round(data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length) 
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm"
      >
        <p className="font-semibold mb-1">{label}</p>
        <div className="space-y-1 text-xs">
          <p><span className="text-muted-foreground">{language === 'es' ? 'Duración:' : 'Duration:'}</span> {data.minutos} min</p>
          <p><span className="text-muted-foreground">{language === 'es' ? 'Calorías:' : 'Calories:'}</span> {data.calorias}</p>
          {data.workouts > 0 && (
            <>
              <p><span className="text-muted-foreground">{language === 'es' ? 'Entrenamientos:' : 'Workouts:'}</span> {data.workouts}</p>
              <p><span className="text-muted-foreground">{language === 'es' ? 'Intensidad:' : 'Intensity:'}</span> {avgIntensity}/10</p>
              {data.types.length > 0 && (
                <p className="text-muted-foreground">
                  {[...new Set(data.types)].map(t => WORKOUT_LABELS[t][language === 'es' ? 'es' : 'en']).join(', ')}
                </p>
              )}
            </>
          )}
          {data.isBest && (
            <p className="text-orange-500 font-medium mt-1">
              🏆 {language === 'es' ? 'Mejor día' : 'Best day'}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-card border-border overflow-hidden relative">
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            {language === 'es' ? 'Tu progreso' : 'Your progress'}
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={handlePeriodChange}>
            <TabsList className="h-8 bg-muted">
              <TabsTrigger 
                value="week" 
                className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'es' ? 'Semana' : 'Week'}
              </TabsTrigger>
              <TabsTrigger 
                value="month" 
                className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'es' ? 'Mes' : 'Month'}
              </TabsTrigger>
              <TabsTrigger 
                value="year" 
                className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {language === 'es' ? 'Año' : 'Year'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} key={timePeriod}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
              {targetMinutesPerDay && (
                <ReferenceLine 
                  y={targetMinutesPerDay} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                />
              )}
              <Bar 
                dataKey="minutos" 
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.isBest ? '#10b981' : 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>{language === 'es' ? 'Minutos' : 'Minutes'}</span>
          </div>
          {timePeriod === 'week' && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-primary" />
              <span>{language === 'es' ? 'Objetivo' : 'Goal'}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>{language === 'es' ? 'Mejor' : 'Best'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
