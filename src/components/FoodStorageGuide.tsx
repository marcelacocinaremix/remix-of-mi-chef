import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Refrigerator, 
  Search, 
  Clock, 
  AlertTriangle, 
  Lightbulb, 
  ThermometerSun,
  Loader2,
  Sparkles,
  Apple,
  XCircle,
  Coins,
  Utensils,
  Flame,
  Shield,
  Droplets,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

const categories: CategoryOption[] = [
  {
    id: "conservacion",
    name: "Conservación",
    icon: Refrigerator,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    description: "Cómo guardar y cuánto dura"
  },
  {
    id: "temperaturas",
    name: "Temperaturas",
    icon: ThermometerSun,
    color: "text-red-500",
    bgColor: "bg-red-500",
    description: "Temperaturas de cocción"
  },
  {
    id: "tiempos",
    name: "Tiempos",
    icon: Timer,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    description: "Tiempos de cocción"
  },
  {
    id: "preparacion",
    name: "Preparación",
    icon: Utensils,
    color: "text-amber-500",
    bgColor: "bg-amber-500",
    description: "Cómo preparar y cortar"
  },
  {
    id: "coccion",
    name: "Cocción",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    description: "Métodos de cocción"
  },
  {
    id: "ahorro",
    name: "Ahorro",
    icon: Coins,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
    description: "Tips para no desperdiciar"
  },
  {
    id: "seguridad",
    name: "Seguridad",
    icon: Shield,
    color: "text-slate-500",
    bgColor: "bg-slate-500",
    description: "Manipulación segura"
  },
];

interface FoodInfo {
  isFood: boolean;
  name: string;
  category: string;
  mainInfo: string;
  details: string[];
  tips: string[];
  warnings?: string[];
}

export function FoodStorageGuide() {
  const [foodName, setFoodName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("conservacion");
  const [isLoading, setIsLoading] = useState(false);
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [notFoodError, setNotFoodError] = useState(false);
  const [lastSearch, setLastSearch] = useState<{food: string, category: string} | null>(null);
  const { toast } = useToast();

  const handleSearch = async (categoryOverride?: string) => {
    const categoryToUse = categoryOverride || selectedCategory;
    
    if (!foodName.trim()) {
      toast({
        title: "Ingresá un alimento",
        description: "Escribí el nombre de un alimento para buscar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setFoodInfo(null);
    setNotFoodError(false);

    try {
      const { data, error } = await supabase.functions.invoke("food-tips-guide", {
        body: { 
          foodName: foodName.trim(),
          category: categoryToUse
        },
      });

      if (error) throw error;

      if (data && !data.isFood) {
        setNotFoodError(true);
        setFoodInfo(null);
      } else if (data) {
        setFoodInfo(data);
        setLastSearch({ food: foodName.trim(), category: categoryToUse });
      }
    } catch (error) {
      console.error("Error fetching food info:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la información. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // If we already searched for a food, search again with new category
    if (lastSearch && lastSearch.food === foodName.trim()) {
      handleSearch(categoryId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Guía de Alimentos</h2>
              <p className="text-sm text-muted-foreground">
                Ingresá un alimento y elegí qué querés saber
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Apple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ej: pollo, tomate, arroz, leche..."
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value);
                  setNotFoodError(false);
                }}
                onKeyPress={handleKeyPress}
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={() => handleSearch()} 
              disabled={isLoading || !foodName.trim()}
              className="h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Selector */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap shrink-0 min-w-[90px]",
                  isActive
                    ? `${category.bgColor} text-white shadow-lg scale-105`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{category.name}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Not a food error */}
      <AnimatePresence>
        {notFoodError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-amber-600 dark:text-amber-400">
                      Esto no parece ser un alimento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Por favor, ingresá el nombre de un alimento como: frutas, verduras, carnes, lácteos, granos, etc.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center animate-pulse",
              currentCategory?.bgColor + "/20"
            )}>
              {currentCategory && <currentCategory.icon className={cn("w-8 h-8", currentCategory.color)} />}
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500 animate-bounce" />
          </div>
          <p className="text-muted-foreground">
            Buscando {currentCategory?.name.toLowerCase()} de {foodName}...
          </p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {foodInfo && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Main Info Card */}
            <Card className="border-primary/20 overflow-hidden">
              <div className={cn("h-2", currentCategory?.bgColor)} />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    currentCategory?.bgColor + "/15"
                  )}>
                    {currentCategory && <currentCategory.icon className={cn("w-5 h-5", currentCategory.color)} />}
                  </div>
                  <div>
                    <span className="capitalize">{foodInfo.name}</span>
                    <p className="text-sm font-normal text-muted-foreground">
                      {currentCategory?.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Info */}
                <div className={cn(
                  "p-4 rounded-lg",
                  currentCategory?.bgColor + "/10"
                )}>
                  <p className="font-medium">{foodInfo.mainInfo}</p>
                </div>

                {/* Details */}
                {foodInfo.details.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className={cn("w-4 h-4", currentCategory?.color)} />
                      Detalles
                    </h4>
                    <ul className="space-y-2">
                      {foodInfo.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            currentCategory?.bgColor + "/20",
                            currentCategory?.color
                          )}>
                            {index + 1}
                          </span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warnings */}
            {foodInfo.warnings && foodInfo.warnings.length > 0 && (
              <Card className="border-rose-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Precauciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {foodInfo.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            {foodInfo.tips.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-emerald-500" />
                    Tips prácticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {foodInfo.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State - suggestions */}
      {!foodInfo && !isLoading && !notFoodError && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Buscá un alimento</h3>
                <p className="text-sm text-muted-foreground">
                  Ingresá cualquier alimento y elegí qué información querés
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Pollo", "Tomate", "Arroz", "Huevos", "Carne", "Papa"].map((food) => (
                  <Button
                    key={food}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFoodName(food);
                    }}
                    className="text-xs"
                  >
                    {food}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
