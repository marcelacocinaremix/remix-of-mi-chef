import { useState, useEffect, useMemo } from "react";
import { Heart, Trash2, ChevronRight, Cookie, Salad, Coffee, Sparkles, BookOpen, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";

interface FavoriteRecipe {
  id: string;
  recipe_name: string;
  recipe_data: Recipe;
  created_at: string;
}

interface FavoriteFoodTip {
  id: string;
  food_name: string;
  category: string;
  tip_data: {
    name: string;
    category: string;
    mainInfo: string;
    details: string[];
    tips: string[];
    warnings: string[];
  };
  created_at: string;
}

interface FavoriteRecipesProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

type CategoryFilter = "todas" | "salado" | "dulce" | "bebida";
type ActiveTab = "recetas" | "tips";

// Keywords to detect recipe category
const dulceKeywords = ["torta", "pastel", "brownie", "galleta", "cookie", "postre", "helado", "flan", "mousse", "chocolate", "dulce", "muffin", "cupcake", "budín", "alfajor", "panqueque", "crepe", "waffle", "cheesecake", "tarta dulce", "pie", "crema", "merengue", "caramelo", "azúcar", "miel", "fruta", "banana", "manzana", "frutilla", "naranja"];
const bebidaKeywords = ["batido", "smoothie", "licuado", "jugo", "bebida", "café", "té", "limonada", "agua", "shake", "frappé", "cocktail", "refresco"];

function detectCategory(recipe: Recipe): CategoryFilter {
  const name = recipe.name.toLowerCase();
  const tags = recipe.tags?.map(t => t.toLowerCase()) || [];
  const allText = [name, ...tags].join(" ");

  if (bebidaKeywords.some(k => allText.includes(k))) return "bebida";
  if (dulceKeywords.some(k => allText.includes(k))) return "dulce";
  return "salado";
}

const categoryLabels: Record<string, string> = {
  conservacion: "Conservación",
  temperaturas: "Temperaturas",
  tiempos: "Tiempos",
  preparacion: "Preparación",
  coccion: "Cocción",
  ahorro: "Ahorro",
  seguridad: "Seguridad",
};

export function FavoriteRecipes({ onSelectRecipe }: FavoriteRecipesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [favoriteTips, setFavoriteTips] = useState<FavoriteFoodTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("todas");
  const [activeTab, setActiveTab] = useState<ActiveTab>("recetas");

  const categoryFilters: { id: CategoryFilter; label: string; icon: React.ElementType }[] = [
    { id: "todas", label: t('allCategories'), icon: Sparkles },
    { id: "salado", label: t('savory'), icon: Salad },
    { id: "dulce", label: t('sweet'), icon: Cookie },
    { id: "bebida", label: t('beverage'), icon: Coffee },
  ];

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchFavoriteTips();
    } else {
      setFavorites([]);
      setFavoriteTips([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        recipe_data: item.recipe_data as unknown as Recipe
      }));
      
      setFavorites(typedData);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoriteTips = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("favorite_food_tips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setFavoriteTips(data || []);
    } catch (error) {
      console.error("Error fetching favorite tips:", error);
    }
  };

  const filteredFavorites = useMemo(() => {
    if (activeFilter === "todas") return favorites;
    return favorites.filter(fav => detectCategory(fav.recipe_data) === activeFilter);
  }, [favorites, activeFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = { todas: favorites.length, salado: 0, dulce: 0, bebida: 0 };
    favorites.forEach(fav => {
      const cat = detectCategory(fav.recipe_data);
      counts[cat]++;
    });
    return counts;
  }, [favorites]);

  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { error } = await supabase
        .from("favorite_recipes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFavorites(favorites.filter((f) => f.id !== id));
      toast({
        title: t('deleted'),
        description: t('recipeRemovedFromFavorites'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteTip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("favorite_food_tips")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFavoriteTips(favoriteTips.filter((f) => f.id !== id));
      toast({
        title: "Eliminado",
        description: "Tip eliminado de favoritos",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className={cn(
        "bg-card rounded-xl p-6 border border-border/50",
        "text-center"
      )}>
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">{t('favoriteRecipes')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('loginForFavoritesRecipes')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
        <p className="text-muted-foreground">{t('loadingFavorites')}</p>
      </div>
    );
  }

  const totalFavorites = favorites.length + favoriteTips.length;

  if (totalFavorites === 0) {
    return (
      <div className={cn(
        "bg-card rounded-xl p-6 border border-border/50",
        "text-center"
      )}>
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">{t('favoriteRecipes')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('noSavedRecipes')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-xl p-4 border border-border/50",
      "shadow-card"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary fill-primary" />
        <h3 className="font-display text-lg font-semibold">{t('myFavoritesTitle')}</h3>
        <span className="text-sm text-muted-foreground">({totalFavorites})</span>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("recetas")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "recetas"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Recetas
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            activeTab === "recetas" ? "bg-primary-foreground/20" : "bg-background"
          )}>
            {favorites.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "tips"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Tips
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            activeTab === "tips" ? "bg-primary-foreground/20" : "bg-background"
          )}>
            {favoriteTips.length}
          </span>
        </button>
      </div>

      {/* Recipes Tab */}
      {activeTab === "recetas" && (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categoryFilters.map((filter) => {
              const Icon = filter.icon;
              const count = categoryCounts[filter.id];
              const isActive = activeFilter === filter.id;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {filter.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-primary-foreground/20" : "bg-background"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredFavorites.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                {t('noRecipesInCategory')}
              </p>
            ) : (
              filteredFavorites.map((fav) => {
                const category = detectCategory(fav.recipe_data);
                return (
                  <div
                    key={fav.id}
                    onClick={() => onSelectRecipe(fav.recipe_data)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      "bg-muted/50 hover:bg-muted cursor-pointer",
                      "transition-colors"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {fav.recipe_name}
                        </p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          category === "dulce" && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
                          category === "salado" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          category === "bebida" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {category === "dulce" ? t('sweet') : category === "bebida" ? t('beverage') : t('savory')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fav.recipe_data.time} min • {fav.recipe_data.nutrition?.calories || "?"} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteRecipe(fav.id, e)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Tips Tab */}
      {activeTab === "tips" && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {favoriteTips.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No tenés tips guardados aún
            </p>
          ) : (
            favoriteTips.map((tip) => (
              <div
                key={tip.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  "bg-muted/50 hover:bg-muted",
                  "transition-colors"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate capitalize">
                      {tip.food_name}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {categoryLabels[tip.category] || tip.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tip.tip_data.mainInfo}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteTip(tip.id, e)}
                  className="h-8 w-8"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
