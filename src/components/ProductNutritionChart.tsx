import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Product {
  calories: number | null;
  protein: number | null;
  total_carbs: number | null;
  sugars: number | null;
  total_fat: number | null;
  saturated_fat: number | null;
  dietary_fiber: number | null;
  sodium: number | null;
  serving_size: string | null;
}

interface ProductNutritionChartProps {
  product: Product;
}

const COLORS = {
  protein: "#3B82F6",
  carbs: "#22C55E",
  fat: "#EF4444",
  fiber: "#8B5CF6",
  sugars: "#F59E0B",
};

export function ProductNutritionChart({ product }: ProductNutritionChartProps) {
  // Prepare macros data for pie chart
  const macrosData = [
    { name: "Proteínas", value: product.protein || 0, color: COLORS.protein },
    { name: "Carbohidratos", value: product.total_carbs || 0, color: COLORS.carbs },
    { name: "Grasas", value: product.total_fat || 0, color: COLORS.fat },
  ].filter(d => d.value > 0);

  // Calculate total grams for percentage
  const totalGrams = macrosData.reduce((sum, d) => sum + d.value, 0);

  // Prepare bar chart data
  const barData = [
    { name: "Proteínas", value: product.protein || 0, fill: COLORS.protein },
    { name: "Carbs", value: product.total_carbs || 0, fill: COLORS.carbs },
    { name: "Azúcares", value: product.sugars || 0, fill: COLORS.sugars },
    { name: "Grasas", value: product.total_fat || 0, fill: COLORS.fat },
    { name: "Fibra", value: product.dietary_fiber || 0, fill: COLORS.fiber },
  ].filter(d => d.value > 0);

  const hasData = macrosData.length > 0 || barData.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos nutricionales para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Serving info */}
      {product.serving_size && (
        <div className="text-center text-sm text-muted-foreground">
          Por porción de {product.serving_size}
        </div>
      )}

      {/* Calories highlight */}
      {product.calories && (
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">{product.calories}</div>
          <div className="text-sm text-muted-foreground">Calorías</div>
        </div>
      )}

      {/* Macros Pie Chart */}
      {macrosData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-center">Distribución de Macros</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {macrosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}g`, ""]}
                  contentStyle={{ 
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))"
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  formatter={(value, entry: any) => (
                    <span className="text-xs">
                      {value}: {entry.payload.value}g
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Nutrients Bar Chart */}
      {barData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-center">Nutrientes por porción</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `${v}g`} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={70}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}g`, ""]}
                  contentStyle={{ 
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))"
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {product.sodium && (
          <div className={cn(
            "p-3 rounded-lg bg-muted/50 text-center",
            product.sodium > 400 && "bg-red-50 dark:bg-red-950/30"
          )}>
            <div className="text-lg font-semibold">{product.sodium}mg</div>
            <div className="text-xs text-muted-foreground">Sodio</div>
          </div>
        )}
        {product.sugars !== null && product.sugars !== undefined && (
          <div className={cn(
            "p-3 rounded-lg bg-muted/50 text-center",
            product.sugars > 10 && "bg-amber-50 dark:bg-amber-950/30"
          )}>
            <div className="text-lg font-semibold">{product.sugars}g</div>
            <div className="text-xs text-muted-foreground">Azúcares</div>
          </div>
        )}
      </div>
    </div>
  );
}
