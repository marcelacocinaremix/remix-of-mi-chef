import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Fish, 
  Beef, 
  Egg, 
  Milk, 
  Wheat, 
  Apple, 
  Carrot, 
  Nut, 
  Drumstick, 
  Bean,
  ChefHat,
  Sparkles,
  Plus,
  ChevronRight,
  Salad
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodItem {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  portion: string;
}

interface FoodCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  foods: FoodItem[];
}

const foodCategories: FoodCategory[] = [
  {
    id: "pescados",
    name: "Pescados y Mariscos",
    icon: <Fish className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Altos en proteína y omega-3",
    foods: [
      { name: "Atún", protein: 26, carbs: 0, fats: 1, calories: 130, portion: "100g" },
      { name: "Salmón", protein: 25, carbs: 0, fats: 13, calories: 208, portion: "100g" },
      { name: "Merluza", protein: 18, carbs: 0, fats: 1, calories: 82, portion: "100g" },
      { name: "Trucha", protein: 20, carbs: 0, fats: 3, calories: 119, portion: "100g" },
      { name: "Sardinas", protein: 21, carbs: 0, fats: 11, calories: 185, portion: "100g" },
      { name: "Caballa", protein: 19, carbs: 0, fats: 14, calories: 205, portion: "100g" },
      { name: "Lenguado", protein: 19, carbs: 0, fats: 1, calories: 86, portion: "100g" },
      { name: "Dorado", protein: 20, carbs: 0, fats: 2, calories: 100, portion: "100g" },
      { name: "Camarones", protein: 24, carbs: 0, fats: 0.3, calories: 99, portion: "100g" },
      { name: "Pulpo", protein: 30, carbs: 4, fats: 2, calories: 164, portion: "100g" },
      { name: "Calamar", protein: 18, carbs: 3, fats: 1, calories: 92, portion: "100g" },
      { name: "Mejillones", protein: 12, carbs: 4, fats: 2, calories: 86, portion: "100g" },
      { name: "Anchoas", protein: 29, carbs: 0, fats: 5, calories: 131, portion: "100g" },
      { name: "Bacalao", protein: 18, carbs: 0, fats: 0.7, calories: 82, portion: "100g" },
      { name: "Corvina", protein: 19, carbs: 0, fats: 1, calories: 85, portion: "100g" },
    ]
  },
  {
    id: "carnes",
    name: "Carnes Rojas",
    icon: <Beef className="w-5 h-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Fuente de proteína y hierro",
    foods: [
      { name: "Bife de lomo", protein: 27, carbs: 0, fats: 8, calories: 180, portion: "100g" },
      { name: "Carne picada magra", protein: 26, carbs: 0, fats: 10, calories: 176, portion: "100g" },
      { name: "Asado de tira", protein: 24, carbs: 0, fats: 15, calories: 250, portion: "100g" },
      { name: "Cerdo (lomo)", protein: 25, carbs: 0, fats: 6, calories: 143, portion: "100g" },
      { name: "Cordero", protein: 25, carbs: 0, fats: 20, calories: 294, portion: "100g" },
      { name: "Bife de chorizo", protein: 26, carbs: 0, fats: 12, calories: 210, portion: "100g" },
      { name: "Vacío", protein: 22, carbs: 0, fats: 8, calories: 160, portion: "100g" },
      { name: "Entraña", protein: 26, carbs: 0, fats: 7, calories: 165, portion: "100g" },
      { name: "Matambre", protein: 24, carbs: 0, fats: 14, calories: 222, portion: "100g" },
      { name: "Colita de cuadril", protein: 22, carbs: 0, fats: 5, calories: 135, portion: "100g" },
      { name: "Paleta de cerdo", protein: 21, carbs: 0, fats: 10, calories: 174, portion: "100g" },
      { name: "Costilla de cerdo", protein: 20, carbs: 0, fats: 18, calories: 242, portion: "100g" },
      { name: "Hígado de res", protein: 26, carbs: 4, fats: 5, calories: 165, portion: "100g" },
      { name: "Osobuco", protein: 19, carbs: 0, fats: 4, calories: 110, portion: "100g" },
      { name: "Bondiola", protein: 27, carbs: 0, fats: 11, calories: 207, portion: "100g" },
    ]
  },
  {
    id: "aves",
    name: "Aves",
    icon: <Drumstick className="w-5 h-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Proteína magra y versátil",
    foods: [
      { name: "Pechuga de pollo", protein: 31, carbs: 0, fats: 3, calories: 165, portion: "100g" },
      { name: "Muslo de pollo", protein: 26, carbs: 0, fats: 10, calories: 209, portion: "100g" },
      { name: "Pavo", protein: 29, carbs: 0, fats: 1, calories: 135, portion: "100g" },
      { name: "Pollo entero", protein: 27, carbs: 0, fats: 14, calories: 239, portion: "100g" },
      { name: "Ala de pollo", protein: 30, carbs: 0, fats: 8, calories: 191, portion: "100g" },
      { name: "Pata de pollo", protein: 28, carbs: 0, fats: 5, calories: 158, portion: "100g" },
      { name: "Pechuga de pavo", protein: 30, carbs: 0, fats: 1, calories: 125, portion: "100g" },
      { name: "Pato", protein: 19, carbs: 0, fats: 28, calories: 337, portion: "100g" },
      { name: "Codorniz", protein: 22, carbs: 0, fats: 4, calories: 134, portion: "100g" },
      { name: "Gallina", protein: 25, carbs: 0, fats: 13, calories: 219, portion: "100g" },
      { name: "Hígado de pollo", protein: 24, carbs: 1, fats: 5, calories: 140, portion: "100g" },
      { name: "Mollejas", protein: 28, carbs: 0, fats: 3, calories: 139, portion: "100g" },
    ]
  },
  {
    id: "huevos-lacteos",
    name: "Huevos y Lácteos",
    icon: <Egg className="w-5 h-5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    description: "Proteína completa y calcio",
    foods: [
      { name: "Huevo entero", protein: 6, carbs: 0.5, fats: 5, calories: 72, portion: "1 unidad" },
      { name: "Clara de huevo", protein: 4, carbs: 0, fats: 0, calories: 17, portion: "1 unidad" },
      { name: "Yogur griego", protein: 10, carbs: 4, fats: 5, calories: 100, portion: "100g" },
      { name: "Queso cottage", protein: 11, carbs: 3, fats: 4, calories: 98, portion: "100g" },
      { name: "Leche descremada", protein: 3, carbs: 5, fats: 0, calories: 34, portion: "100ml" },
      { name: "Leche entera", protein: 3, carbs: 5, fats: 3, calories: 61, portion: "100ml" },
      { name: "Queso mozzarella", protein: 22, carbs: 2, fats: 22, calories: 280, portion: "100g" },
      { name: "Queso parmesano", protein: 38, carbs: 4, fats: 26, calories: 392, portion: "100g" },
      { name: "Queso cheddar", protein: 25, carbs: 1, fats: 33, calories: 403, portion: "100g" },
      { name: "Queso crema", protein: 6, carbs: 4, fats: 34, calories: 342, portion: "100g" },
      { name: "Ricota", protein: 11, carbs: 3, fats: 8, calories: 130, portion: "100g" },
      { name: "Yogur natural", protein: 5, carbs: 7, fats: 3, calories: 61, portion: "100g" },
      { name: "Huevo de codorniz", protein: 1, carbs: 0, fats: 1, calories: 14, portion: "1 unidad" },
      { name: "Kéfir", protein: 3, carbs: 4, fats: 2, calories: 45, portion: "100ml" },
      { name: "Queso azul", protein: 21, carbs: 2, fats: 29, calories: 353, portion: "100g" },
      { name: "Manteca", protein: 1, carbs: 0, fats: 81, calories: 717, portion: "100g" },
    ]
  },
  {
    id: "legumbres",
    name: "Legumbres",
    icon: <Bean className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-600/10",
    description: "Proteína vegetal y fibra",
    foods: [
      { name: "Lentejas", protein: 9, carbs: 20, fats: 0.4, calories: 116, portion: "100g cocidas" },
      { name: "Garbanzos", protein: 9, carbs: 27, fats: 3, calories: 164, portion: "100g cocidos" },
      { name: "Porotos negros", protein: 9, carbs: 24, fats: 0.5, calories: 132, portion: "100g cocidos" },
      { name: "Arvejas", protein: 5, carbs: 14, fats: 0.4, calories: 81, portion: "100g" },
      { name: "Soja", protein: 17, carbs: 10, fats: 9, calories: 173, portion: "100g cocida" },
      { name: "Porotos blancos", protein: 9, carbs: 25, fats: 0.5, calories: 139, portion: "100g cocidos" },
      { name: "Porotos colorados", protein: 9, carbs: 23, fats: 0.5, calories: 127, portion: "100g cocidos" },
      { name: "Habas", protein: 8, carbs: 19, fats: 0.7, calories: 110, portion: "100g cocidas" },
      { name: "Edamame", protein: 11, carbs: 10, fats: 5, calories: 121, portion: "100g" },
      { name: "Tofu", protein: 8, carbs: 2, fats: 4, calories: 76, portion: "100g" },
      { name: "Tempeh", protein: 19, carbs: 9, fats: 11, calories: 193, portion: "100g" },
      { name: "Hummus", protein: 8, carbs: 14, fats: 10, calories: 166, portion: "100g" },
      { name: "Lupines", protein: 16, carbs: 10, fats: 3, calories: 119, portion: "100g cocidos" },
    ]
  },
  {
    id: "cereales",
    name: "Cereales y Granos",
    icon: <Wheat className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
    description: "Energía y carbohidratos complejos",
    foods: [
      { name: "Arroz integral", protein: 3, carbs: 23, fats: 1, calories: 111, portion: "100g cocido" },
      { name: "Arroz blanco", protein: 3, carbs: 28, fats: 0.3, calories: 130, portion: "100g cocido" },
      { name: "Avena", protein: 5, carbs: 27, fats: 3, calories: 150, portion: "40g" },
      { name: "Quinoa", protein: 4, carbs: 21, fats: 2, calories: 120, portion: "100g cocida" },
      { name: "Pan integral", protein: 4, carbs: 20, fats: 1, calories: 80, portion: "1 rebanada" },
      { name: "Pasta integral", protein: 5, carbs: 25, fats: 1, calories: 124, portion: "100g cocida" },
      { name: "Pasta común", protein: 5, carbs: 31, fats: 1, calories: 157, portion: "100g cocida" },
      { name: "Cuscús", protein: 4, carbs: 23, fats: 0.2, calories: 112, portion: "100g cocido" },
      { name: "Bulgur", protein: 3, carbs: 19, fats: 0.2, calories: 83, portion: "100g cocido" },
      { name: "Polenta", protein: 2, carbs: 15, fats: 0.2, calories: 71, portion: "100g cocida" },
      { name: "Mijo", protein: 3, carbs: 23, fats: 1, calories: 119, portion: "100g cocido" },
      { name: "Cebada", protein: 2, carbs: 28, fats: 0.4, calories: 123, portion: "100g cocida" },
      { name: "Trigo sarraceno", protein: 3, carbs: 20, fats: 0.6, calories: 92, portion: "100g cocido" },
      { name: "Amaranto", protein: 4, carbs: 19, fats: 2, calories: 102, portion: "100g cocido" },
      { name: "Tortilla de maíz", protein: 2, carbs: 11, fats: 0.5, calories: 52, portion: "1 unidad" },
      { name: "Pan blanco", protein: 3, carbs: 23, fats: 1, calories: 75, portion: "1 rebanada" },
    ]
  },
  {
    id: "verduras",
    name: "Verduras",
    icon: <Salad className="w-5 h-5" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Vitaminas y minerales esenciales",
    foods: [
      { name: "Espinaca", protein: 3, carbs: 4, fats: 0.4, calories: 23, portion: "100g" },
      { name: "Brócoli", protein: 3, carbs: 7, fats: 0.4, calories: 34, portion: "100g" },
      { name: "Zanahoria", protein: 1, carbs: 10, fats: 0.2, calories: 41, portion: "100g" },
      { name: "Tomate", protein: 1, carbs: 4, fats: 0.2, calories: 18, portion: "100g" },
      { name: "Zapallo", protein: 1, carbs: 7, fats: 0.1, calories: 26, portion: "100g" },
      { name: "Cebolla", protein: 1, carbs: 9, fats: 0.1, calories: 40, portion: "100g" },
      { name: "Ajo", protein: 6, carbs: 33, fats: 0.5, calories: 149, portion: "100g" },
      { name: "Pimiento rojo", protein: 1, carbs: 6, fats: 0.3, calories: 31, portion: "100g" },
      { name: "Pimiento verde", protein: 1, carbs: 5, fats: 0.2, calories: 20, portion: "100g" },
      { name: "Pepino", protein: 0.7, carbs: 4, fats: 0.1, calories: 15, portion: "100g" },
      { name: "Lechuga", protein: 1, carbs: 2, fats: 0.2, calories: 15, portion: "100g" },
      { name: "Acelga", protein: 2, carbs: 4, fats: 0.2, calories: 19, portion: "100g" },
      { name: "Rúcula", protein: 3, carbs: 4, fats: 0.7, calories: 25, portion: "100g" },
      { name: "Coliflor", protein: 2, carbs: 5, fats: 0.3, calories: 25, portion: "100g" },
      { name: "Repollo", protein: 1, carbs: 6, fats: 0.1, calories: 25, portion: "100g" },
      { name: "Berenjena", protein: 1, carbs: 6, fats: 0.2, calories: 25, portion: "100g" },
      { name: "Calabacín", protein: 1, carbs: 3, fats: 0.3, calories: 17, portion: "100g" },
      { name: "Choclo", protein: 3, carbs: 19, fats: 1, calories: 86, portion: "100g" },
      { name: "Remolacha", protein: 2, carbs: 10, fats: 0.2, calories: 43, portion: "100g" },
      { name: "Apio", protein: 0.7, carbs: 3, fats: 0.2, calories: 16, portion: "100g" },
      { name: "Espárragos", protein: 2, carbs: 4, fats: 0.1, calories: 20, portion: "100g" },
      { name: "Champiñones", protein: 3, carbs: 3, fats: 0.3, calories: 22, portion: "100g" },
      { name: "Batata", protein: 2, carbs: 20, fats: 0.1, calories: 86, portion: "100g" },
      { name: "Papa", protein: 2, carbs: 17, fats: 0.1, calories: 77, portion: "100g" },
    ]
  },
  {
    id: "frutas",
    name: "Frutas",
    icon: <Apple className="w-5 h-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Vitaminas y azúcares naturales",
    foods: [
      { name: "Banana", protein: 1, carbs: 23, fats: 0.3, calories: 89, portion: "1 unidad" },
      { name: "Manzana", protein: 0.3, carbs: 14, fats: 0.2, calories: 52, portion: "1 unidad" },
      { name: "Naranja", protein: 1, carbs: 12, fats: 0.1, calories: 47, portion: "1 unidad" },
      { name: "Frutilla", protein: 0.7, carbs: 8, fats: 0.3, calories: 32, portion: "100g" },
      { name: "Palta", protein: 2, carbs: 9, fats: 15, calories: 160, portion: "1/2 unidad" },
      { name: "Mandarina", protein: 0.8, carbs: 13, fats: 0.3, calories: 53, portion: "1 unidad" },
      { name: "Pomelo", protein: 0.8, carbs: 11, fats: 0.1, calories: 42, portion: "1/2 unidad" },
      { name: "Limón", protein: 1, carbs: 9, fats: 0.3, calories: 29, portion: "1 unidad" },
      { name: "Uva", protein: 0.7, carbs: 18, fats: 0.2, calories: 69, portion: "100g" },
      { name: "Sandía", protein: 0.6, carbs: 8, fats: 0.2, calories: 30, portion: "100g" },
      { name: "Melón", protein: 0.8, carbs: 8, fats: 0.2, calories: 34, portion: "100g" },
      { name: "Durazno", protein: 1, carbs: 10, fats: 0.3, calories: 39, portion: "1 unidad" },
      { name: "Ciruela", protein: 0.7, carbs: 11, fats: 0.3, calories: 46, portion: "1 unidad" },
      { name: "Kiwi", protein: 1, carbs: 15, fats: 0.5, calories: 61, portion: "1 unidad" },
      { name: "Mango", protein: 0.8, carbs: 15, fats: 0.4, calories: 60, portion: "100g" },
      { name: "Piña", protein: 0.5, carbs: 13, fats: 0.1, calories: 50, portion: "100g" },
      { name: "Papaya", protein: 0.5, carbs: 11, fats: 0.3, calories: 43, portion: "100g" },
      { name: "Arándanos", protein: 0.7, carbs: 14, fats: 0.3, calories: 57, portion: "100g" },
      { name: "Frambuesas", protein: 1, carbs: 12, fats: 0.7, calories: 52, portion: "100g" },
      { name: "Cereza", protein: 1, carbs: 12, fats: 0.3, calories: 50, portion: "100g" },
      { name: "Pera", protein: 0.4, carbs: 15, fats: 0.1, calories: 57, portion: "1 unidad" },
      { name: "Ananá", protein: 0.5, carbs: 13, fats: 0.1, calories: 50, portion: "100g" },
      { name: "Coco", protein: 3, carbs: 15, fats: 33, calories: 354, portion: "100g" },
      { name: "Higo", protein: 0.8, carbs: 19, fats: 0.3, calories: 74, portion: "1 unidad" },
    ]
  },
  {
    id: "frutos-secos",
    name: "Frutos Secos y Semillas",
    icon: <Nut className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-600/10",
    description: "Grasas saludables y energía",
    foods: [
      { name: "Almendras", protein: 6, carbs: 6, fats: 14, calories: 164, portion: "30g" },
      { name: "Nueces", protein: 4, carbs: 4, fats: 18, calories: 185, portion: "30g" },
      { name: "Maní", protein: 7, carbs: 5, fats: 14, calories: 166, portion: "30g" },
      { name: "Castañas de cajú", protein: 5, carbs: 9, fats: 12, calories: 155, portion: "30g" },
      { name: "Semillas de chía", protein: 5, carbs: 12, fats: 9, calories: 138, portion: "30g" },
      { name: "Semillas de lino", protein: 5, carbs: 9, fats: 13, calories: 160, portion: "30g" },
      { name: "Semillas de girasol", protein: 6, carbs: 6, fats: 15, calories: 175, portion: "30g" },
      { name: "Semillas de calabaza", protein: 9, carbs: 4, fats: 15, calories: 180, portion: "30g" },
      { name: "Pistachos", protein: 6, carbs: 8, fats: 13, calories: 159, portion: "30g" },
      { name: "Avellanas", protein: 4, carbs: 5, fats: 17, calories: 178, portion: "30g" },
      { name: "Nuez de Brasil", protein: 4, carbs: 4, fats: 19, calories: 186, portion: "30g" },
      { name: "Nuez pecán", protein: 3, carbs: 4, fats: 20, calories: 196, portion: "30g" },
      { name: "Coco rallado", protein: 2, carbs: 6, fats: 19, calories: 187, portion: "30g" },
      { name: "Semillas de sésamo", protein: 5, carbs: 7, fats: 15, calories: 172, portion: "30g" },
      { name: "Pasta de maní", protein: 7, carbs: 6, fats: 14, calories: 180, portion: "30g" },
      { name: "Pasta de almendras", protein: 6, carbs: 6, fats: 16, calories: 190, portion: "30g" },
    ]
  },
];

interface FoodNutritionGuideProps {
  onAddToCook?: (food: FoodItem, category: string) => void;
}

export function FoodNutritionGuide({ onAddToCook }: FoodNutritionGuideProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFood, setExpandedFood] = useState<string | null>(null);

  const selectedCategoryData = foodCategories.find(c => c.id === selectedCategory);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {!selectedCategory ? (
          // Categories Grid
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {foodCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50",
                    "hover:border-primary/50 hover:bg-primary/5 transition-all duration-200",
                    "active:scale-95 group"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    category.bgColor, category.color
                  )}>
                    {category.icon}
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Category Detail View
          <div className="animate-fade-in">
            {/* Category Header */}
            <div className={cn(
              "p-4 flex items-center gap-3 border-b",
              selectedCategoryData?.bgColor
            )}>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                selectedCategoryData?.bgColor, selectedCategoryData?.color
              )}>
                {selectedCategoryData?.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{selectedCategoryData?.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedCategoryData?.description}</p>
              </div>
            </div>

            {/* Foods List */}
            <ScrollArea className="h-[280px]">
              <div className="p-3 space-y-2">
                {selectedCategoryData?.foods.map((food, index) => (
                  <div
                    key={food.name}
                    className={cn(
                      "rounded-xl border border-border/50 overflow-hidden transition-all duration-200",
                      expandedFood === food.name ? "bg-muted/30" : "hover:bg-muted/20"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Food Header */}
                    <button
                      onClick={() => setExpandedFood(expandedFood === food.name ? null : food.name)}
                      className="w-full p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                          selectedCategoryData?.bgColor, selectedCategoryData?.color
                        )}>
                          {food.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm text-foreground">{food.name}</p>
                          <p className="text-xs text-muted-foreground">{food.portion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-chart-1/10 text-chart-1 border-0">
                          {food.protein}g prot
                        </Badge>
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedFood === food.name && "rotate-90"
                        )} />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedFood === food.name && (
                      <div className="px-3 pb-3 animate-fade-in">
                        <div className="bg-background rounded-lg p-3 space-y-3">
                          {/* Macros Grid */}
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-chart-1/10">
                              <p className="text-lg font-bold text-chart-1">{food.protein}g</p>
                              <p className="text-[10px] text-muted-foreground">Proteína</p>
                            </div>
                            <div className="p-2 rounded-lg bg-chart-2/10">
                              <p className="text-lg font-bold text-chart-2">{food.carbs}g</p>
                              <p className="text-[10px] text-muted-foreground">Carbos</p>
                            </div>
                            <div className="p-2 rounded-lg bg-chart-3/10">
                              <p className="text-lg font-bold text-chart-3">{food.fats}g</p>
                              <p className="text-[10px] text-muted-foreground">Grasas</p>
                            </div>
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <p className="text-lg font-bold text-orange-500">{food.calories}</p>
                              <p className="text-[10px] text-muted-foreground">Calorías</p>
                            </div>
                          </div>

                          {/* Add to Cook Button */}
                          {onAddToCook && (
                            <Button
                              onClick={() => onAddToCook(food, selectedCategoryData?.name || '')}
                              size="sm"
                              className="w-full"
                              variant="default"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar para cocinar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
