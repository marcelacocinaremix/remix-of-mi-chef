import { useState, useEffect } from "react";
import { Search, ChefHat, Heart, Calendar, GraduationCap, Gamepad2, Youtube, Home, UtensilsCrossed, ShoppingCart, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchSectionProps {
  onNavigate: (tab: string) => void;
  onOpenRecipe?: (recipe: Recipe) => void;
}

interface SearchResult {
  type: "section" | "feature" | "recipe" | "pantry" | "shopping";
  id: string;
  subId?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data?: any;
}

export function SearchSection({ onNavigate, onOpenRecipe }: SearchSectionProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTab, setActiveSearchTab] = useState("todo");
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [cookedRecipes, setCookedRecipes] = useState<any[]>([]);
  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Main sections
  const mainSections = [
    { id: "inicio", label: t("menuHome"), icon: Home, description: t("sectionHomeDesc"), keywords: ["inicio", "home", "resumen", "principal", "start"] },
    { id: "cocinar", label: t("menuCook"), icon: ChefHat, description: t("sectionCookDesc"), keywords: ["cocinar", "receta", "ia", "generar", "crear", "cook", "recipe", "generate"] },
    { id: "micocina", label: t("menuMyKitchen"), icon: Heart, description: t("sectionMyKitchenDesc"), keywords: ["cocina", "favoritos", "despensa", "compras", "pantry", "kitchen", "favorites", "my kitchen"] },
    { id: "planificar", label: t("menuPlan"), icon: Calendar, description: t("sectionPlanDesc"), keywords: ["planificar", "calendario", "semana", "meal plan", "plan", "calendar", "week"] },
    { id: "aprender", label: t("menuLearn"), icon: GraduationCap, description: t("sectionLearnDesc"), keywords: ["aprender", "tips", "técnicas", "tutorial", "learn", "education"] },
    { id: "jugar", label: t("menuPlay"), icon: Gamepad2, description: t("sectionPlayDesc"), keywords: ["jugar", "juego", "game", "divertido", "play", "fun"] },
    { id: "marcela", label: t("menuRecipes"), icon: Youtube, description: t("sectionRecipesDesc"), keywords: ["marcela", "youtube", "video", "canal", "recipes", "channel"] },
  ];

  // Deep subsections and features
  const deepFeatures = [
    // Mi Cocina subsections
    { id: "micocina", subId: "favoritos", label: t("myKitchenFavorites"), icon: Heart, description: t("searchFavoritesDesc"), keywords: ["favoritos", "guardados", "favorites", "saved", "liked"] },
    { id: "micocina", subId: "despensa", label: t("myKitchenPantry"), icon: BookOpen, description: t("searchPantryDesc"), keywords: ["despensa", "ingredientes", "pantry", "ingredients", "stock", "inventory"] },
    { id: "micocina", subId: "compras", label: t("myKitchenShopping"), icon: ShoppingCart, description: t("searchShoppingDesc"), keywords: ["compras", "lista", "shopping", "buy", "market", "supermercado"] },
    { id: "micocina", subId: "historial", label: t("myKitchenHistory"), icon: UtensilsCrossed, description: t("searchHistoryDesc"), keywords: ["historial", "cocinado", "history", "cooked", "prepared", "made"] },
    
    // Planificar subsections
    { id: "planificar", subId: "calendario", label: t("planCalendar"), icon: Calendar, description: t("searchCalendarDesc"), keywords: ["calendario", "semanal", "calendar", "weekly", "days", "dias"] },
    { id: "planificar", subId: "plantillas", label: t("planTemplates"), icon: Calendar, description: t("searchTemplatesDesc"), keywords: ["plantillas", "templates", "presets", "quick", "rapido"] },
    { id: "planificar", subId: "balance", label: t("planBalance"), icon: Calendar, description: t("searchBalanceDesc"), keywords: ["balance", "nutricional", "nutritional", "macros", "proteinas", "carbohidratos", "grasas", "protein", "carbs", "fat"] },
    { id: "planificar", subId: "progreso", label: t("planProgress"), icon: Calendar, description: t("searchProgressDesc"), keywords: ["progreso", "semana", "progress", "week", "stats", "estadisticas"] },
    
    // Marcela subsections  
    { id: "marcela", subId: "youtube", label: t("marcelaYoutube"), icon: Youtube, description: t("searchYoutubeDesc"), keywords: ["youtube", "videos", "canal", "channel", "watch", "ver"] },
    { id: "marcela", subId: "comunidad", label: t("marcelaCommunity"), icon: Youtube, description: t("searchCommunityDesc"), keywords: ["comunidad", "grupo", "community", "group", "cocinar", "cook together"] },
    { id: "marcela", subId: "tips", label: t("marcelaTips"), icon: Youtube, description: t("searchTipsDesc"), keywords: ["tips", "consejos", "trucos", "advice", "tricks", "help"] },
    
    // Aprender subsections
    { id: "aprender", subId: "guia", label: t("learnGuide"), icon: GraduationCap, description: t("searchGuideDesc"), keywords: ["guia", "alimentos", "guide", "food", "nutrition", "nutricion", "vitaminas", "minerales"] },
    { id: "aprender", subId: "tecnicas", label: t("learnTechniques"), icon: GraduationCap, description: t("searchTechniquesDesc"), keywords: ["tecnicas", "cortes", "metodos", "techniques", "cuts", "methods", "how to", "como"] },
    { id: "aprender", subId: "basicos", label: t("learnBasics"), icon: GraduationCap, description: t("searchBasicsDesc"), keywords: ["basicos", "principiante", "basics", "beginner", "start", "empezar"] },
    { id: "aprender", subId: "avanzado", label: t("learnAdvanced"), icon: GraduationCap, description: t("searchAdvancedDesc"), keywords: ["avanzado", "profesional", "advanced", "professional", "expert", "experto"] },
    
    // Cocinar subsections
    { id: "cocinar", subId: "filtros", label: t("cookFilters"), icon: ChefHat, description: t("searchFiltersDesc"), keywords: ["filtros", "preferencias", "filters", "preferences", "dietary", "dieta", "vegetariano", "vegano"] },
    { id: "cocinar", subId: "timer", label: t("cookTimer"), icon: ChefHat, description: t("searchTimerDesc"), keywords: ["timer", "temporizador", "cronometro", "tiempo", "time", "countdown"] },
    { id: "cocinar", subId: "voz", label: t("cookVoice"), icon: ChefHat, description: t("searchVoiceDesc"), keywords: ["voz", "microfono", "voice", "microphone", "speak", "hablar", "dictar"] },
    { id: "cocinar", subId: "foto", label: t("cookPhoto"), icon: ChefHat, description: t("searchPhotoDesc"), keywords: ["foto", "camara", "photo", "camera", "scan", "escanear", "detectar"] },
    
    // Jugar subsections
    { id: "jugar", subId: "logros", label: t("playAchievements"), icon: Gamepad2, description: t("searchAchievementsDesc"), keywords: ["logros", "medallas", "achievements", "medals", "badges", "premios", "rewards"] },
    { id: "jugar", subId: "desafio", label: t("playChallenge"), icon: Gamepad2, description: t("searchChallengeDesc"), keywords: ["desafio", "diario", "challenge", "daily", "reto"] },
    { id: "jugar", subId: "puntos", label: t("playPoints"), icon: Gamepad2, description: t("searchPointsDesc"), keywords: ["puntos", "score", "points", "puntaje", "high score"] },
    
    // Inicio subsections
    { id: "inicio", subId: "resumen", label: t("homeSummary"), icon: Home, description: t("searchSummaryDesc"), keywords: ["resumen", "mi resumen", "summary", "my summary", "overview", "dashboard"] },
    { id: "inicio", subId: "productos", label: t("homeProducts"), icon: Home, description: t("searchProductsDesc"), keywords: ["productos", "escaner", "products", "scanner", "barcode", "codigo"] },
  ];

  // Combine all searchable items
  const sections = mainSections;

  // Fetch user data
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const [favRes, cookedRes, pantryRes, shoppingRes] = await Promise.all([
          supabase.from("favorite_recipes").select("*").eq("user_id", user.id),
          supabase.from("cooked_recipes").select("*").eq("user_id", user.id).order("cooked_at", { ascending: false }).limit(50),
          supabase.from("pantry_items").select("*").eq("user_id", user.id),
          supabase.from("shopping_list_items").select("*").eq("user_id", user.id).eq("is_purchased", false),
        ]);

        setFavoriteRecipes(favRes.data || []);
        setCookedRecipes(cookedRes.data || []);
        setPantryItems(pantryRes.data || []);
        setShoppingItems(shoppingRes.data || []);
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const normalizeString = (str: string) => 
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const matchesQuery = (text: string, query: string) => 
    normalizeString(text).includes(normalizeString(query));

  // Build search results
  const getSearchResults = (): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    
    const results: SearchResult[] = [];
    const query = searchQuery.trim();

    // Search main sections
    sections.forEach((section) => {
      const matchesLabel = matchesQuery(section.label, query);
      const matchesDesc = matchesQuery(section.description, query);
      const matchesKeywords = section.keywords.some(k => matchesQuery(k, query));
      
      if (matchesLabel || matchesDesc || matchesKeywords) {
        const Icon = section.icon;
        results.push({
          type: "section",
          id: section.id,
          title: section.label,
          subtitle: section.description,
          icon: <Icon className="w-5 h-5 text-primary" />,
        });
      }
    });

    // Search deep features (subsections)
    deepFeatures.forEach((feature) => {
      const matchesLabel = matchesQuery(feature.label, query);
      const matchesDesc = matchesQuery(feature.description, query);
      const matchesKeywords = feature.keywords.some(k => matchesQuery(k, query));
      
      if (matchesLabel || matchesDesc || matchesKeywords) {
        const Icon = feature.icon;
        results.push({
          type: "feature",
          id: feature.id,
          subId: feature.subId,
          title: feature.label,
          subtitle: feature.description,
          icon: <Icon className="w-5 h-5 text-accent-foreground" />,
        });
      }
    });

    // Search favorite recipes
    favoriteRecipes.forEach((recipe) => {
      if (matchesQuery(recipe.recipe_name, query)) {
        results.push({
          type: "recipe",
          id: `fav-${recipe.id}`,
          title: recipe.recipe_name,
          subtitle: t("searchFavoriteRecipe"),
          icon: <Heart className="w-5 h-5 text-red-500" />,
          data: recipe.recipe_data,
        });
      }
    });

    // Search cooked recipes
    cookedRecipes.forEach((recipe) => {
      // Avoid duplicates with favorites
      const alreadyAdded = results.some(r => r.title === recipe.recipe_name && r.type === "recipe");
      if (!alreadyAdded && matchesQuery(recipe.recipe_name, query)) {
        results.push({
          type: "recipe",
          id: `cooked-${recipe.id}`,
          title: recipe.recipe_name,
          subtitle: t("searchCookedRecipe"),
          icon: <UtensilsCrossed className="w-5 h-5 text-orange-500" />,
          data: recipe.recipe_data,
        });
      }
    });

    // Search pantry items
    pantryItems.forEach((item) => {
      if (matchesQuery(item.ingredient_name, query)) {
        results.push({
          type: "pantry",
          id: `pantry-${item.id}`,
          title: item.ingredient_name,
          subtitle: `${t("searchInPantry")}${item.category ? ` • ${item.category}` : ""}`,
          icon: <BookOpen className="w-5 h-5 text-green-500" />,
        });
      }
    });

    // Search shopping list
    shoppingItems.forEach((item) => {
      if (matchesQuery(item.ingredient_name, query)) {
        results.push({
          type: "shopping",
          id: `shopping-${item.id}`,
          title: item.ingredient_name,
          subtitle: t("searchInShoppingList"),
          icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,
        });
      }
    });

    return results;
  };

  const results = getSearchResults();

  const filteredResults = activeSearchTab === "todo" 
    ? results 
    : results.filter(r => {
        if (activeSearchTab === "secciones") return r.type === "section" || r.type === "feature";
        if (activeSearchTab === "recetas") return r.type === "recipe";
        if (activeSearchTab === "despensa") return r.type === "pantry" || r.type === "shopping";
        return true;
      });

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "section") {
      onNavigate(result.id);
    } else if (result.type === "feature") {
      // Navigate to parent section - the subId can be used by the section to auto-select subtab
      onNavigate(result.id);
    } else if (result.type === "recipe" && result.data && onOpenRecipe) {
      onOpenRecipe(result.data);
    } else if (result.type === "pantry") {
      onNavigate("micocina");
    } else if (result.type === "shopping") {
      onNavigate("micocina");
    }
  };

  const getResultTypeBadge = (type: string) => {
    switch (type) {
      case "section": return t("searchSection");
      case "feature": return t("searchFeature");
      case "recipe": return t("searchRecipe");
      case "pantry": return t("searchPantryLabel");
      default: return t("searchShopping");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <Search className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{t("searchTitle")}</h2>
        <p className="text-muted-foreground">
          {t("searchSubtitle")}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 text-base"
          />
        </div>
      </div>

      {/* Results or Default View */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          {/* Filter Tabs */}
          <Tabs value={activeSearchTab} onValueChange={setActiveSearchTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
              <TabsTrigger value="todo" className="text-xs">{t("searchAll")}</TabsTrigger>
              <TabsTrigger value="recetas" className="text-xs">{t("searchRecipes")}</TabsTrigger>
              <TabsTrigger value="despensa" className="text-xs">{t("searchPantryTab")}</TabsTrigger>
              <TabsTrigger value="secciones" className="text-xs">{t("searchSections")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground text-center">
            {filteredResults.length} {filteredResults.length !== 1 ? t("searchResultsPlural") : t("searchResults")} {t("searchFor")} "{searchQuery}"
          </p>

          {/* Results List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredResults.map((result) => (
              <Card
                key={result.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {result.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {getResultTypeBadge(result.type)}
                  </Badge>
                </CardContent>
              </Card>
            ))}

            {filteredResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("searchNoResults")} "{searchQuery}"</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setSearchQuery("")}
                >
                  {t("searchClear")}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Default: Show all sections */
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {t("searchAppSections")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onNavigate(section.id)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{section.label}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {section.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats */}
          {user && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Card className="text-center p-3">
                <p className="text-2xl font-bold text-primary">{favoriteRecipes.length}</p>
                <p className="text-xs text-muted-foreground">{t("searchFavorites")}</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-2xl font-bold text-orange-500">{pantryItems.length}</p>
                <p className="text-xs text-muted-foreground">{t("searchInPantryShort")}</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-2xl font-bold text-blue-500">{shoppingItems.length}</p>
                <p className="text-xs text-muted-foreground">{t("searchToBuy")}</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}