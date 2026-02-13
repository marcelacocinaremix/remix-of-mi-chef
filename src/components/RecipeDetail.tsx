import { Clock, ShoppingBag, ChefHat, Lightbulb, RefreshCw, ArrowLeft, Flame, Dumbbell, Wheat, Droplet, Leaf, Heart, Users, Play, Shuffle, ShoppingCart, Plus, Check, Copy, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/components/RecipeList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { CookingMode } from "@/components/CookingMode";
import { Badge } from "@/components/ui/badge";

import { useLanguage } from "@/contexts/LanguageContext";
import { useExportPDF } from "@/hooks/useExportPDF";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onRecipeCooked?: () => void;
  recentlyCooked?: boolean;
  pantryItems?: string[];
  onAddToShoppingList?: (ingredient: string, category: string) => Promise<boolean>;
}

// Ingredient substitutions database
const INGREDIENT_SUBSTITUTIONS: Record<string, string[]> = {
  "leche": ["leche de almendras", "leche de avena", "leche de coco"],
  "manteca": ["aceite de oliva", "aceite de coco", "margarina vegana"],
  "huevo": ["banana pisada", "chia con agua", "aquafaba"],
  "crema": ["crema de coco", "yogur natural", "leche evaporada"],
  "queso": ["queso vegano", "levadura nutricional", "tofu firme"],
  "harina": ["harina de almendras", "harina de avena", "harina sin gluten"],
  "azúcar": ["miel", "stevia", "eritritol"],
  "pan rallado": ["avena molida", "harina de almendras", "coco rallado"],
  "carne": ["tofu", "seitán", "legumbres"],
  "pollo": ["tofu", "seitán", "garbanzos"],
};

export function RecipeDetail({ recipe, onBack, onRecipeCooked, recentlyCooked, pantryItems = [], onAddToShoppingList }: RecipeDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isCopying, setIsCopying] = useState(false);
  const { exportRecipeToPDF, isExporting } = useExportPDF();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMarkingCooked, setIsMarkingCooked] = useState(false);
  const [hasMarkedCooked, setHasMarkedCooked] = useState(false);
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [hasUsedCookingMode, setHasUsedCookingMode] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(false);
  const [addedToList, setAddedToList] = useState<Set<string>>(new Set());
  const [hasCopied, setHasCopied] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const saveActionRef = useRef(false);

  // Check if recipe is already in favorites on mount
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("favorite_recipes")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_name", recipe.name)
        .maybeSingle();
      
      if (data) {
        setIsSaved(true);
      }
    };
    
    checkIfSaved();
  }, [user, recipe.name]);

  // Check if ingredient is in pantry
  const isInPantry = (ingredient: string): boolean => {
    const ingredientLower = ingredient.toLowerCase();
    return pantryItems.some(pantryItem => 
      ingredientLower.includes(pantryItem.toLowerCase()) || 
      pantryItem.toLowerCase().includes(ingredientLower.split(' ').pop() || '')
    );
  };

  // Detect category from ingredient name
  const detectCategory = (ingredient: string): string => {
    const ingredientLower = ingredient.toLowerCase();
    if (/tomate|cebolla|ajo|zanahoria|lechuga|espinaca|papa|batata|zapallo|pimiento|pepino|berenjena/.test(ingredientLower)) return 'verduras';
    if (/manzana|banana|naranja|limón|frutilla|durazno|pera|uva/.test(ingredientLower)) return 'frutas';
    if (/carne|pollo|cerdo|ternera|vacío|asado|bife|peceto/.test(ingredientLower)) return 'carnes';
    if (/pescado|salmón|merluza|atún|camarón|langostino/.test(ingredientLower)) return 'pescados';
    if (/leche|queso|yogur|crema|manteca|ricota/.test(ingredientLower)) return 'lacteos';
    if (/huevo/.test(ingredientLower)) return 'huevos';
    if (/harina|arroz|fideos|azúcar|sal|aceite|vinagre/.test(ingredientLower)) return 'almacen';
    if (/pan|galleta|tostada/.test(ingredientLower)) return 'panaderia';
    if (/orégano|pimienta|comino|pimentón|curry|mostaza/.test(ingredientLower)) return 'condimentos';
    return 'otros';
  };

  const handleAddToShoppingList = async (ingredient: string) => {
    if (!onAddToShoppingList) return;
    const category = detectCategory(ingredient);
    const success = await onAddToShoppingList(ingredient, category);
    if (success) {
      setAddedToList(prev => new Set(prev).add(ingredient));
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar recetas.",
        variant: "destructive",
      });
      return;
    }

    // Prevent rapid clicks
    if (saveActionRef.current) return;
    
    saveActionRef.current = true;
    setIsSaving(true);
    
    try {
      if (isSaved) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_name", recipe.name);

        if (error) throw error;

        setIsSaved(false);
        toast({
          title: "Receta eliminada",
          description: `${recipe.name} se quitó de tus favoritas.`,
        });
      } else {
        // Check if already exists before saving
        const { data: existing } = await supabase
          .from("favorite_recipes")
          .select("id")
          .eq("user_id", user.id)
          .eq("recipe_name", recipe.name)
          .maybeSingle();
        
        if (existing) {
          setIsSaved(true);
          toast({
            title: "Ya está guardada",
            description: "Esta receta ya está en tus favoritos.",
          });
          return;
        }

        const { error } = await supabase.from("favorite_recipes").insert([{
          user_id: user.id,
          recipe_name: recipe.name,
          recipe_data: JSON.parse(JSON.stringify(recipe)),
        }]);

        if (error) throw error;

        setIsSaved(true);
        toast({
          title: "¡Receta guardada!",
          description: `${recipe.name} se agregó a tus favoritas.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isSaved ? "No se pudo quitar la receta." : "No se pudo guardar la receta.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      saveActionRef.current = false;
    }
  };

  const handleMarkAsCooked = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para registrar recetas cocinadas.",
        variant: "destructive",
      });
      return;
    }

    setIsMarkingCooked(true);
    try {
      const { error } = await supabase.from("cooked_recipes").insert({
        user_id: user.id,
        recipe_name: recipe.name,
        recipe_data: JSON.parse(JSON.stringify(recipe)),
      });

      if (error) throw error;

      toast({
        title: "¡Receta registrada! 🎉",
        description: "Se agregó a tus logros y a tu resumen de salud.",
      });

      setHasMarkedCooked(true);
      onRecipeCooked?.();
    } catch (error) {
      console.error("Error marking recipe as cooked:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la receta.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingCooked(false);
    }
  };

  const getSubstitutions = (ingredient: string): string[] => {
    const ingredientLower = ingredient.toLowerCase();
    for (const [key, subs] of Object.entries(INGREDIENT_SUBSTITUTIONS)) {
      if (ingredientLower.includes(key)) {
        return subs;
      }
    }
    return [];
  };

  const ingredientsWithSubs = recipe.ingredients.map(ing => ({
    original: ing,
    substitutions: getSubstitutions(ing)
  }));

  const hasSubstitutions = ingredientsWithSubs.some(i => i.substitutions.length > 0);

  if (showCookingMode) {
    return (
      <CookingMode 
        recipe={recipe} 
        onClose={() => setShowCookingMode(false)}
        onMarkAsCooked={onRecipeCooked}
      />
    );
  }

  return (
    <div className="animate-slide-up">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a las recetas
      </Button>

      <div className={cn(
        "bg-card rounded-2xl overflow-hidden",
        "shadow-elevated border border-border/50"
      )}>
        {/* Header */}
        <div className="gradient-warm p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <span className="text-2xl">🍽️</span>
            <span className="text-sm font-medium uppercase tracking-wide">
              Tu receta de hoy
            </span>
            {recentlyCooked && (
              <Badge variant="secondary" className="bg-white/20 text-white ml-2">
                Cocinada recientemente
              </Badge>
            )}
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-4 mt-3 opacity-90 flex-wrap">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4" />
              {recipe.time} minutos
            </span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4" />
              {recipe.servings} porciones
            </span>
            <span className="text-sm font-medium px-2 py-0.5 bg-white/20 rounded-full">
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Cooking Mode Button */}
        <div className="p-4 bg-primary/5 border-b border-border">
          <Button
            onClick={() => setShowCookingMode(true)}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar modo cocina
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Pasos grandes y fáciles de leer mientras cocinás
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nutrition Info */}
          {recipe.nutrition && (
            <section className={cn(
              "p-4 rounded-xl",
              "bg-secondary/50 dark:bg-secondary/30 border border-border"
            )}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Información nutricional por porción
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-card rounded-lg shadow-sm border border-border/50">
                  <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.calories}</p>
                  <p className="text-xs text-muted-foreground">Calorías</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg shadow-sm border border-border/50">
                  <Dumbbell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.protein}g</p>
                  <p className="text-xs text-muted-foreground">Proteínas</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg shadow-sm border border-border/50">
                  <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbohidratos</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg shadow-sm border border-border/50">
                  <Droplet className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.fat}g</p>
                  <p className="text-xs text-muted-foreground">Grasas</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg shadow-sm border border-border/50">
                  <Leaf className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{recipe.nutrition.fiber}g</p>
                  <p className="text-xs text-muted-foreground">Fibra</p>
                </div>
              </div>
            </section>
          )}

          {/* Ingredients */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Ingredientes
                </h3>
              </div>
              {hasSubstitutions && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSubstitutions(!showSubstitutions)}
                  className="text-sm"
                >
                  <Shuffle className="w-4 h-4 mr-1" />
                  {showSubstitutions ? "Ocultar" : "Ver reemplazos"}
                </Button>
              )}
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ingredientsWithSubs.map((item, index) => {
                const inPantry = isInPantry(item.original);
                const alreadyAdded = addedToList.has(item.original);
                
                return (
                  <li key={index} className="space-y-1">
                    <div className={cn(
                      "flex items-center gap-2 text-foreground/90 p-2 rounded-lg transition-colors",
                      inPantry && "bg-green-50 dark:bg-green-950/30"
                    )}>
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        inPantry ? "bg-green-500" : "bg-primary/60"
                      )} />
                      <span className="flex-1">{item.original}</span>
                      {inPantry ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          ✓ Tenés
                        </Badge>
                      ) : onAddToShoppingList && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToShoppingList(item.original)}
                          disabled={alreadyAdded}
                          className={cn(
                            "h-7 px-2 text-xs",
                            alreadyAdded 
                              ? "text-green-600 hover:text-green-600" 
                              : "text-muted-foreground hover:text-primary"
                          )}
                        >
                          {alreadyAdded ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Agregado
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Al súper
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {showSubstitutions && item.substitutions.length > 0 && (
                      <div className="ml-4 flex flex-wrap gap-1">
                        {item.substitutions.map((sub, subIndex) => (
                          <Badge 
                            key={subIndex} 
                            variant="secondary" 
                            className="text-xs bg-blue-50 text-blue-700"
                          >
                            ↔️ {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Preparación paso a paso
              </h3>
            </div>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full",
                    "bg-primary/10 text-primary",
                    "flex items-center justify-center",
                    "text-sm font-bold font-display"
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-foreground/90 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Tip */}
          <section className={cn(
            "p-4 rounded-xl",
            "bg-accent dark:bg-accent/50 border border-border"
          )}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-foreground mb-1">
                  💡 Tip de Marcela
                </h4>
                <p className="text-foreground/80 text-sm">{recipe.tip}</p>
              </div>
            </div>
          </section>

          {/* Variation */}
          {recipe.variation && (
            <section className={cn(
              "p-4 rounded-xl",
              "bg-secondary border border-border/50"
            )}>
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-1">
                    🔄 Variación opcional
                  </h4>
                  <p className="text-foreground/80 text-sm">{recipe.variation}</p>
                </div>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleToggleFavorite} 
              disabled={isSaving} 
              size="lg" 
              variant={isSaved ? "outline" : "default"}
              className={cn("w-full", isSaved && "border-destructive text-red-700 dark:text-red-400 hover:bg-destructive/10")}
            >
              <Heart className={cn("w-5 h-5", isSaved && "fill-red-600 text-red-600")} />
              {isSaving ? (isSaved ? "Quitando..." : t("saving")) : isSaved ? "Quitar de favoritos" : t("saveToFavorites")}
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-1">
              {isSaved ? "Tocá para quitar de tu colección" : "Guarda esta receta en tu colección de favoritos"}
            </p>
            
            <Button 
              variant={hasUsedCookingMode ? "outline" : "default"} 
              size="lg"
              onClick={() => {
                setShowCookingMode(true);
                setHasUsedCookingMode(true);
              }}
              className="w-full"
            >
              <Play className="w-5 h-5" />
              {hasUsedCookingMode ? "Modo cocina ✓" : t("cookingMode")}
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-1">
              {hasUsedCookingMode ? "Ya usaste el modo cocina" : "Seguí el paso a paso con temporizadores incluidos"}
            </p>
            
            
            <Button 
              variant={hasCopied ? "outline" : "default"} 
              size="lg"
              onClick={async () => {
                setIsCopying(true);
                try {
                  const ingredientsText = recipe.ingredients.join('\n');
                  await navigator.clipboard.writeText(ingredientsText);
                  setHasCopied(true);
                  toast({
                    title: "¡Ingredientes copiados!",
                    description: "Los ingredientes se copiaron al portapapeles.",
                  });
                } catch {
                  toast({
                    title: "Error",
                    description: "No se pudieron copiar los ingredientes.",
                    variant: "destructive",
                  });
                } finally {
                  setIsCopying(false);
                }
              }}
              disabled={isCopying}
              className="w-full"
            >
              <Copy className="w-5 h-5" />
              {isCopying ? "Copiando..." : hasCopied ? "Copiados ✓" : "Copiar ingredientes"}
            </Button>
          </div>

          {/* Footer message */}
          <div className="pt-4 border-t border-border text-center">
            <p className="text-muted-foreground italic text-sm">
              "Espero que disfrutes esta receta. En{" "}
              <span className="text-primary font-medium">MARCELACOCINA</span>{" "}
              tenés muchas más ideas fáciles para el día a día."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
