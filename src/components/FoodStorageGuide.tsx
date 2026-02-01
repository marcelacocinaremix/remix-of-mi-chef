import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface StorageInfo {
  isFood: boolean;
  name: string;
  storage: string;
  duration: string;
  temperature: string;
  commonMistakes: string[];
  tips: string[];
}

export function FoodStorageGuide() {
  const [foodName, setFoodName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [notFoodError, setNotFoodError] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!foodName.trim()) {
      toast({
        title: "Ingresá un alimento",
        description: "Escribí el nombre de un alimento para buscar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStorageInfo(null);
    setNotFoodError(false);

    try {
      const { data, error } = await supabase.functions.invoke("food-storage-guide", {
        body: { foodName: foodName.trim() },
      });

      if (error) throw error;

      if (data && !data.isFood) {
        setNotFoodError(true);
        setStorageInfo(null);
      } else if (data) {
        setStorageInfo(data);
      }
    } catch (error) {
      console.error("Error fetching storage info:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la información. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Refrigerator className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Conservación de Alimentos</h2>
              <p className="text-sm text-muted-foreground">
                Descubrí cómo almacenar correctamente cada alimento
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Apple className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ej: tomate, pollo, leche, pan..."
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
              onClick={handleSearch} 
              disabled={isLoading || !foodName.trim()}
              className="h-12 px-6 bg-blue-500 hover:bg-blue-600"
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
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
              <Refrigerator className="w-8 h-8 text-blue-500" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500 animate-bounce" />
          </div>
          <p className="text-muted-foreground">Buscando información sobre {foodName}...</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {storageInfo && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Main Info Card */}
            <Card className="border-primary/20 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
                    <Apple className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="capitalize">{storageInfo.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Storage & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10">
                    <Refrigerator className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dónde guardar</p>
                      <p className="font-medium text-sm">{storageInfo.storage}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10">
                    <Clock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duración</p>
                      <p className="font-medium text-sm">{storageInfo.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10">
                    <ThermometerSun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temperatura</p>
                      <p className="font-medium text-sm">{storageInfo.temperature}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Common Mistakes */}
            {storageInfo.commonMistakes.length > 0 && (
              <Card className="border-rose-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Errores comunes a evitar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {storageInfo.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            {storageInfo.tips.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-emerald-500" />
                    Tips prácticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {storageInfo.tips.map((tip, index) => (
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
      {!storageInfo && !isLoading && !notFoodError && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Buscá un alimento</h3>
                <p className="text-sm text-muted-foreground">
                  Ingresá el nombre de cualquier alimento para saber cómo conservarlo mejor
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Tomate", "Pollo", "Leche", "Pan", "Huevos", "Lechuga"].map((food) => (
                  <Button
                    key={food}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFoodName(food);
                      setTimeout(() => handleSearch(), 100);
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
