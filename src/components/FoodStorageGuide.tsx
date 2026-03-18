import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Refrigerator, 
  Search, 
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
  Timer,
  Heart,
  History,
  X,
  Snowflake,
  ShoppingCart,
  Shuffle,
  Leaf,
  ChefHat,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { DailyLimitModal } from "@/components/DailyLimitModal";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  group: "basico" | "cocina" | "extra";
}

const categoryGroups = {
  basico: { label: "Básicos", description: "Lo esencial" },
  cocina: { label: "Cocina", description: "Para cocinar" },
  extra: { label: "Más info", description: "Información adicional" },
};

const categories: CategoryOption[] = [
  // Básicos
  {
    id: "conservacion",
    name: "Conservar",
    icon: Refrigerator,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    description: "Cómo guardar y cuánto dura",
    group: "basico"
  },
  {
    id: "congelacion",
    name: "Congelar",
    icon: Snowflake,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500",
    description: "Tips de congelación",
    group: "basico"
  },
  {
    id: "compra",
    name: "Comprar",
    icon: ShoppingCart,
    color: "text-pink-500",
    bgColor: "bg-pink-500",
    description: "Cómo elegir fresco",
    group: "basico"
  },
  // Cocina
  {
    id: "preparacion",
    name: "Preparar",
    icon: Utensils,
    color: "text-amber-500",
    bgColor: "bg-amber-500",
    description: "Limpiar y cortar",
    group: "cocina"
  },
  {
    id: "coccion",
    name: "Cocinar",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    description: "Métodos de cocción",
    group: "cocina"
  },
  {
    id: "temperaturas",
    name: "Temperaturas",
    icon: ThermometerSun,
    color: "text-red-500",
    bgColor: "bg-red-500",
    description: "Temperaturas ideales",
    group: "cocina"
  },
  {
    id: "tiempos",
    name: "Tiempos",
    icon: Timer,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    description: "Tiempos de cocción",
    group: "cocina"
  },
  // Extra
  {
    id: "sustitutos",
    name: "Sustitutos",
    icon: Shuffle,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500",
    description: "Con qué reemplazar",
    group: "extra"
  },
  {
    id: "combinaciones",
    name: "Combinar",
    icon: ChefHat,
    color: "text-rose-500",
    bgColor: "bg-rose-500",
    description: "Qué combina bien",
    group: "extra"
  },
  {
    id: "nutricion",
    name: "Nutrición",
    icon: Leaf,
    color: "text-green-500",
    bgColor: "bg-green-500",
    description: "Info nutricional",
    group: "extra"
  },
  {
    id: "ahorro",
    name: "Ahorro",
    icon: Coins,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
    description: "No desperdiciar",
    group: "extra"
  },
  {
    id: "seguridad",
    name: "Seguridad",
    icon: Shield,
    color: "text-slate-500",
    bgColor: "bg-slate-500",
    description: "Manipulación segura",
    group: "extra"
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

interface SearchHistoryItem {
  food: string;
  category: string;
  timestamp: number;
}

const HISTORY_KEY = "food_tips_history";
const MAX_HISTORY = 10;

export function FoodStorageGuide() {
  const [foodName, setFoodName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("conservacion");
  const [isLoading, setIsLoading] = useState(false);
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [notFoodError, setNotFoodError] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedFavId, setSavedFavId] = useState<string | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const DAILY_LIMIT = 3;

  // Load daily usage count from localStorage (keyed by user+date)
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `food_guide_uses_${user.id}_${today}`;
    setDailyUsed(Number(localStorage.getItem(key) || "0"));
  }, [user]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history:", e);
      }
    }
  }, []);

  const saveToHistory = (food: string, category: string) => {
    const newItem: SearchHistoryItem = { food, category, timestamp: Date.now() };
    const filtered = searchHistory.filter(
      (item) => !(item.food.toLowerCase() === food.toLowerCase() && item.category === category)
    );
    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY);
    setSearchHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (index: number) => {
    const newHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleSearch = async (foodOverride?: string, categoryOverride?: string) => {
    // Check daily limit for free users
    if (!isPremium) {
      if (dailyUsed >= DAILY_LIMIT) {
        setShowLimitModal(true);
        return;
      }
    }

    const foodToUse = (foodOverride || foodName).trim();
    const categoryToUse = categoryOverride || selectedCategory;
    
    if (!foodToUse) {
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
    setIsSaved(false);
    if (foodOverride) setFoodName(foodOverride);
    if (categoryOverride) setSelectedCategory(categoryOverride);

    try {
      const { data, error } = await supabase.functions.invoke("food-tips-guide", {
        body: { 
          foodName: foodToUse,
          category: categoryToUse
        },
      });

      if (error) throw error;

      if (data && !data.isFood) {
        setNotFoodError(true);
        setFoodInfo(null);
      } else if (data) {
        setFoodInfo(data);
        saveToHistory(foodToUse, categoryToUse);

        // Increment daily counter for free users
        if (!isPremium && user) {
          const today = new Date().toISOString().split("T")[0];
          const key = `food_guide_uses_${user.id}_${today}`;
          const newCount = dailyUsed + 1;
          setDailyUsed(newCount);
          localStorage.setItem(key, String(newCount));
        }
        
        // Check if already saved in favorites
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existingFav } = await (supabase.from("favorite_food_tips") as any)
            .select("id")
            .eq("user_id", user.id)
            .eq("food_name", data.name)
            .eq("category", data.category)
            .maybeSingle();
          
          setIsSaved(!!existingFav);
          setSavedFavId(existingFav?.id ?? null);
        }
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

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás estar logueado para guardar favoritos",
        variant: "destructive",
      });
      return;
    }

    if (!foodInfo) return;

    setIsSaving(true);
    try {
      if (isSaved && savedFavId) {
        // Remove from favorites using the stored id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("favorite_food_tips") as any)
          .delete()
          .eq("id", savedFavId);

        if (error) throw error;
        
        setIsSaved(false);
        setSavedFavId(null);
        toast({ title: "Eliminado", description: "Tip eliminado de tus favoritos" });
      } else if (isSaved) {
        // Fallback: delete by food_name + category if no id stored
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("favorite_food_tips") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("food_name", foodInfo.name)
          .eq("category", foodInfo.category);

        if (error) throw error;
        setIsSaved(false);
        setSavedFavId(null);
        toast({ title: "Eliminado", description: "Tip eliminado de tus favoritos" });
      } else {
        // Add to favorites
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error } = await (supabase.from("favorite_food_tips") as any).insert([{
          user_id: user.id,
          food_name: foodInfo.name,
          category: foodInfo.category,
          tip_data: foodInfo,
        }]).select("id").maybeSingle();

        if (error) {
          if (error.code === "23505") {
            setIsSaved(true);
            toast({ title: "Ya guardado", description: "Este tip ya está en tus favoritos" });
          } else {
            throw error;
          }
        } else {
          setIsSaved(true);
          setSavedFavId(inserted?.id ?? null);
          toast({ title: "¡Guardado!", description: "Tip agregado a tus favoritos" });
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast({
        title: "Error",
        description: "No pudimos procesar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);

  // Group categories by type
  const groupedCategories = {
    basico: categories.filter(c => c.group === "basico"),
    cocina: categories.filter(c => c.group === "cocina"),
    extra: categories.filter(c => c.group === "extra"),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Daily usage indicator — only for free users */}
      {!isPremium && (
        <div className={cn(
          "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold border",
          dailyUsed >= DAILY_LIMIT
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : dailyUsed >= DAILY_LIMIT - 1
              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        )}>
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span className="text-xs font-medium opacity-70">plan gratis</span>
            <span className="font-bold">{dailyUsed}/{DAILY_LIMIT}</span>
            <span className="text-xs font-normal opacity-75">
              {dailyUsed >= DAILY_LIMIT ? "agotadas" : "por día"}
            </span>
          </div>
          <button
            onClick={() => setShowLimitModal(true)}
            className="text-xs font-semibold underline opacity-70 hover:opacity-100"
          >
            Ver Premium
          </button>
        </div>
      )}
      {/* Step 1: Search Input */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="font-semibold">Escribí el alimento</h3>
          </div>
          <div className="relative">
            <Apple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Ej: pollo, tomate, arroz, leche, carne..."
              value={foodName}
              onChange={(e) => {
                setFoodName(e.target.value);
                setNotFoodError(false);
                // Clear results when user starts typing something new
                if (foodInfo) setFoodInfo(null);
                setIsSaved(false);
                setSavedFavId(null);
              }}
              onKeyPress={handleKeyPress}
              className="pl-10 h-12 text-base"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Category Selector */}
      <Card className="border-border/50">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="font-semibold">Elegí qué querés saber</h3>
          </div>

          <div className="space-y-4">
            {(Object.keys(groupedCategories) as Array<keyof typeof groupedCategories>).map((groupKey) => (
              <div key={groupKey}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                  {categoryGroups[groupKey].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupedCategories[groupKey].map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm",
                          isActive
                            ? `${category.bgColor} text-white shadow-md`
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {currentCategory && (
            <div className={cn("mt-4 p-3 rounded-lg", currentCategory.bgColor + "/10")}>
              <p className="text-sm flex items-center gap-2">
                <currentCategory.icon className={cn("w-4 h-4", currentCategory.color)} />
                <span className="font-medium">{currentCategory.name}:</span>
                <span className="text-muted-foreground">{currentCategory.description}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Search Button */}
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</span>
        <Button 
          onClick={() => handleSearch()} 
          disabled={isLoading || !foodName.trim()}
          className="flex-1 h-12"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Buscar información
            </>
          )}
        </Button>
      </div>

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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                  </div>
                  <Button
                    variant={isSaved ? "outline" : "default"}
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={isSaving}
                    className="gap-1.5"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={cn("w-4 h-4", isSaved && "fill-rose-500 text-rose-500")} />
                    )}
                    {isSaved ? "Guardado" : "Guardar"}
                  </Button>
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
                      {foodInfo.details.map((detail, index) => {
                        // Handle case where detail might be an object instead of string
                        const detailText = typeof detail === 'string' 
                          ? detail 
                          : typeof detail === 'object' && detail !== null
                            ? Object.values(detail).filter(v => typeof v === 'string').join(' - ')
                            : String(detail);
                        return (
                          <li key={index} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              currentCategory?.bgColor + "/20",
                              currentCategory?.color
                            )}>
                              {index + 1}
                            </span>
                            <span>{detailText}</span>
                          </li>
                        );
                      })}
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
                    {foodInfo.warnings.map((warning, index) => {
                      // Handle case where warning might be an object instead of string
                      const warningText = typeof warning === 'string' 
                        ? warning 
                        : typeof warning === 'object' && warning !== null
                          ? Object.values(warning).filter(v => typeof v === 'string').join(' - ')
                          : String(warning);
                      return (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{warningText}</span>
                        </li>
                      );
                    })}
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
                    {foodInfo.tips.map((tip, index) => {
                      // Handle case where tip might be an object instead of string
                      const tipText = typeof tip === 'string' 
                        ? tip 
                        : typeof tip === 'object' && tip !== null
                          ? Object.values(tip).filter(v => typeof v === 'string').join(' - ')
                          : String(tip);
                      return (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{tipText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search History */}
      {searchHistory.length > 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
              <History className="w-4 h-4" />
              Historial de búsquedas
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => {
                const cat = categories.find((c) => c.id === item.category);
                return (
                  <div
                    key={index}
                    className="group flex items-center gap-1 bg-muted/50 rounded-full pl-3 pr-1 py-1"
                  >
                    <button
                      onClick={() => handleSearch(item.food, item.category)}
                      className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                    >
                      {cat && <cat.icon className={cn("w-3 h-3", cat.color)} />}
                      <span className="capitalize">{item.food}</span>
                    </button>
                    <button
                      onClick={() => removeFromHistory(index)}
                      className="p-1 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - suggestions */}
      {!foodInfo && !isLoading && !notFoodError && searchHistory.length === 0 && (
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
      <SubscriptionManager open={showLimitModal} onOpenChange={setShowLimitModal} />
    </div>
  );
}


