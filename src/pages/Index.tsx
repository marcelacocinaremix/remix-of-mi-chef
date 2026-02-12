import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { FiltersState } from "@/components/AdvancedFilters";
import { Recipe } from "@/components/RecipeList";
import { RecipeDetail } from "@/components/RecipeDetail";
import { SupermarketListModal } from "@/components/SupermarketListModal";
import { UserMenu } from "@/components/UserMenu";
import { MarcelaAssistant } from "@/components/MarcelaAssistant";
import { FloatingTimer } from "@/components/FloatingTimer";
import { Footer } from "@/components/Footer";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import MySummary from "@/components/MySummary";
import { BackToMenuButton } from "@/components/BackToMenuButton";
// DailyUsageIndicator removed - now only shows alert when limit reached
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Heart,
  Home,
  ChefHat,
  Calendar as CalendarIcon,
  Youtube,
  Instagram,
  GraduationCap,
  Gamepad2,
  HeartPulse,
} from "lucide-react";
import { NutritionalBalance } from "@/components/NutritionalBalance";
import { CocinarGroupSection } from "@/components/CocinarGroupSection";
import { CookWithMarcela } from "@/components/CookWithMarcela";
import { PlanificarSection } from "@/components/PlanificarSection";
import { MiCocinaSection } from "@/components/MiCocinaSection";
import { MarcelaSection } from "@/components/MarcelaSection";
import { LearnSection } from "@/components/LearnSection";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/useSound";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useAchievements } from "@/hooks/useAchievements";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";

export default function Index() {
  const { t, language, isFirstVisit, setFirstVisitComplete } = useLanguage();
  const { user } = useAuth();
  const { dailyUsage, checkDailyUsage, refetch: refetchPremium } = usePremium();
  const isMobile = useIsMobile();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [time, setTime] = useState<number>(30);
  const [mealType, setMealType] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    difficulty: null,
    diet: [],
    excludeIngredients: [],
    servings: null,
    cookingMethod: null,
    budget: null,
    maxTime: null,
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [instantRecipe, setInstantRecipe] = useState<Recipe | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [weeklyCalendarState, setWeeklyCalendarState] = useState({ isActive: false, isGeneratingAI: false, mealsPlanned: 0 });
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const { toast } = useToast();
  const { play: playSound } = useSound();
  const { getRecentRecipeNames, refetch: refetchCookedRecipes, addCookedRecipe } = useCookedRecipes();
  const shoppingList = useShoppingList();
  const { recordCookedRecipe, refetch: refetchAchievements } = useAchievements();
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [isCharacterAnimating, setIsCharacterAnimating] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  // showPaywallModal removed - app is free now
  const [activeTab, setActiveTab] = useState<string>(user ? "inicio" : "cocinar");
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [historyDeleted, setHistoryDeleted] = useState(false);
  const [clickedMenuId, setClickedMenuId] = useState<string | null>(null);
  
  // Interactive cooking features state
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  
  // Tracking for MarcelaAssistant reactions
  const [pantryOpened, setPantryOpened] = useState(false);
  const [favoritesOpened, setFavoritesOpened] = useState(false);
  const [shoppingListOpened, setShoppingListOpened] = useState(false);
  const [calendarOpened, setCalendarOpened] = useState(false);
  const [loginRequired, setLoginRequired] = useState<string | null>(null);
  const [showLoginFloatingMessage, setShowLoginFloatingMessage] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<{ name: string; reason: string } | null>(null);

  // Compute the active tab for Marcela (use sub-tab when available)
  const marcelaActiveTab = activeSubTab || activeTab;

  // Update activeTab when user logs in
  useEffect(() => {
    if (user && activeTab === "cocinar") {
      setActiveTab("inicio");
    }
  }, [user]);

  // Show onboarding if first visit OR if user is not logged in
  if (isFirstVisit || !user) {
    return <OnboardingFlow onComplete={setFirstVisitComplete} />;
  }

  const parseEdgeFunctionError = (err: any) => {
    const status = err?.context?.status as number | undefined;
    const rawBody = err?.context?.body;

    let body: any = undefined;
    if (typeof rawBody === 'string') {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = undefined;
      }
    } else if (rawBody && typeof rawBody === 'object') {
      body = rawBody;
    }

    return {
      status,
      code: body?.code as string | undefined,
      message: (body?.error || body?.message || err?.message) as string | undefined,
    };
  };

  const handleGenerateRecipeInvokeError = (err: any) => {
    const { status, code, message } = parseEdgeFunctionError(err);

    if (status === 401 || code === 'AUTH_REQUIRED') {
      toast({
        title: 'Iniciá sesión',
        description: 'Necesitás iniciar sesión para generar recetas.',
        variant: 'destructive',
      });
      window.location.href = '/auth?redirect=/';
      return true;
    }

    if (code === 'FREE_LIMIT_EXCEEDED' || code === 'PAYWALL_REQUIRED' || status === 402 || status === 403) {
      toast({
        title: 'Límite diario alcanzado',
        description: '¡Volvé mañana para más recetas! (3 por día)',
        variant: 'destructive',
      });
      return true;
    }

    if (status === 429 || code === 'RATE_LIMITED') {
      // Check if it's daily limit (from edge function)
      const isDailyLimit = err?.context?.body?.dailyLimitReached;
      if (isDailyLimit) {
        toast({
          title: '🍳 ¡Usaste tus 8 recetas de hoy!',
          description: 'Volvé mañana para seguir cocinando con Marcela',
          variant: 'destructive',
        });
        refetchPremium();
      } else {
        toast({
          title: 'Estamos con mucha demanda',
          description: 'Probá de nuevo en un ratito.',
          variant: 'destructive',
        });
      }
      return true;
    }

    if (message && message !== 'Edge Function returned a non-2xx status code') {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return true;
    }

    return false;
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "¡Agregá ingredientes!",
        description: "Necesito saber qué tenés disponible para sugerirte recetas.",
        variant: "destructive",
      });
      return;
    }

    // No need to track uses anymore - subscription based

    playSound('magic');
    setIsButtonAnimating(true);
    setIsCharacterAnimating(true);
    setTimeout(() => setIsButtonAnimating(false), 600);
    setTimeout(() => setIsCharacterAnimating(false), 2500);

    setIsLoading(true);
    setRecipes([]);
    setSelectedRecipe(null);
    setInstantRecipe(null);
    setIsGeneratingAI(false);

    const recentRecipes = getRecentRecipeNames(7);
    const isLimitedMode = true; // App is now free with daily limit

    // HYBRID MODE: First try to get instant cached recipes
    try {
      const { data: cachedData, error: cacheError } = await supabase.functions.invoke('generate-recipe', {
        body: { 
          ingredients, 
          time, 
          mealType,
          quickFilters,
          language: language,
          hybridMode: true
        }
      });

      // Check for daily limit in hybrid mode too
      if (cacheError || cachedData?.dailyLimitReached) {
        const errorStr = JSON.stringify(cacheError || {}).toLowerCase();
        const is429 = errorStr.includes('429') || errorStr.includes('límite') || cachedData?.dailyLimitReached;
        
        if (is429) {
          toast({
            title: "🍳 ¡Usaste tus 8 recetas de hoy!",
            description: "Volvé mañana para seguir cocinando con Marcela",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      if (cachedData?.recipes && cachedData.recipes.length > 0 && cachedData.source === 'cache') {
        // Show instant recipe while AI generates
        setInstantRecipe(cachedData.recipes[0]);
        setRecipes(cachedData.recipes);
        toast({
          title: "¡Receta instantánea!",
          description: "Te muestro una receta mientras Marcela prepara más opciones...",
        });
      }
    } catch (cacheError: any) {
      console.log('Cache lookup failed:', cacheError);
      // Check if it's a 429 error in the catch block
      const errorStr = JSON.stringify(cacheError || {}).toLowerCase();
      const errorMessage = cacheError?.message?.toLowerCase() || '';
      const is429 = errorStr.includes('429') || errorStr.includes('límite') || 
                    errorStr.includes('dailylimit') || errorMessage.includes('429');
      
      if (is429) {
        toast({
          title: "🍳 ¡Usaste tus 8 recetas de hoy!",
          description: "Volvé mañana para seguir cocinando con Marcela",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    // Generate with AI in parallel
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: { 
          ingredients, 
          time, 
          mealType,
          quickFilters,
          difficulty: filters.difficulty,
          diet: filters.diet,
          excludeIngredients: filters.excludeIngredients,
          servings: filters.servings,
          cookingMethod: filters.cookingMethod,
          budget: filters.budget,
          excludeRecipes: recentRecipes,
          language: language,
          limitedMode: isLimitedMode
        }
      });

      if (error) {
        // Check if it's a daily limit error (429) - check multiple formats
        const errorStr = JSON.stringify(error).toLowerCase();
        const is429 = error.message?.includes('429') || 
                      error.status === 429 ||
                      errorStr.includes('429') ||
                      errorStr.includes('dailylimitreached') ||
                      errorStr.includes('límite');
        
        if (is429) {
          toast({
            title: "🍳 ¡Usaste tus 8 recetas de hoy!",
            description: "Volvé mañana para seguir cocinando con Marcela",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsGeneratingAI(false);
          return;
        }
        throw error;
      }

      // Check for daily limit in response
      if (data?.dailyLimitReached) {
        toast({
          title: "🍳 ¡Usaste tus 8 recetas de hoy!",
          description: "Volvé mañana para seguir cocinando con Marcela",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsGeneratingAI(false);
        return;
      }
      
      if (data?.error === 'no_food_ingredients' || (data?.recipes && data.recipes.length === 0)) {
        // If we have cached recipes, keep them
        if (instantRecipe) {
          toast({
            title: "Usando recetas guardadas",
            description: "No encontré más opciones, pero podés usar las que te mostré.",
          });
        } else {
          toast({
            title: "No encontré recetas",
            description: "Parece que los ingredientes ingresados no son alimentos. ¡Probá con ingredientes de cocina!",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        setIsGeneratingAI(false);
        return;
      }
      
       // Handle fallback recipes (from cache or emergency)
       if (data?.recipes && data.recipes.length > 0 && (data.source === 'cache' || data.source === 'emergency')) {
         setRecipes(data.recipes);
         setInstantRecipe(data.recipes[0]);
         
         // Save to history
         if (data.recipes[0]) {
           addCookedRecipe(data.recipes[0]);
         }
         
         toast({
           title: data.source === 'emergency' ? "🍳 Recetas de emergencia" : "Usando recetas guardadas",
           description: data.source === 'emergency' 
             ? "La IA está ocupada, pero te preparé opciones clásicas."
             : "La IA está con mucha demanda, pero te dejo opciones instantáneas.",
         });
         setIsLoading(false);
         setIsGeneratingAI(false);
         return;
       }

       if (data?.error) {
         // If we have cached recipes, use them as fallback
         if (instantRecipe) {
           toast({
             title: "Usando receta de respaldo",
             description: "Hubo un problema pero te muestro una receta guardada.",
           });
           setIsLoading(false);
           setIsGeneratingAI(false);
           return;
         }
         throw new Error(data.error);
       }

       if (data?.recipes && data.recipes.length > 0) {
        // Always show all recipes (up to 2)
        const recipesToShow = data.recipes.slice(0, 2);
        setRecipes(recipesToShow);
        setInstantRecipe(null); // Clear instant recipe as we have AI recipes now
        
        // Save first recipe to history automatically
        if (recipesToShow[0]) {
          addCookedRecipe(recipesToShow[0]);
        }
        
        toast({
          title: "¡Recetas listas!",
          description: `Preparé ${recipesToShow.length} opciones para vos.`,
        });
      } else if (!instantRecipe) {
        throw new Error('No se pudieron generar recetas');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      // If we have cached recipes, don't show error
      if (instantRecipe) {
        // Save the fallback recipe to history
        addCookedRecipe(instantRecipe);
        toast({
          title: "Usando receta de respaldo",
          description: "La IA está ocupada, pero te muestro una receta guardada.",
        });
      } else {
        if (handleGenerateRecipeInvokeError(error)) return;
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No pude generar las recetas.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsGeneratingAI(false);
    }
  };

  const handleReset = () => {
    setIngredients([]);
    setTime(30);
    setMealType(null);
    setFilters({ difficulty: null, diet: [], excludeIngredients: [], servings: null, cookingMethod: null, budget: null, maxTime: null });
    setRecipes([]);
    setSelectedRecipe(null);
  };

  // Helper to select recipe and scroll to top
  const handleSelectRecipe = (recipe: Recipe | null) => {
    setSelectedRecipe(recipe);
    if (recipe) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectIngredients = (pantryIngredients: string[]) => {
    setIngredients([...new Set([...ingredients, ...pantryIngredients])]);
    setPantryItems(pantryIngredients);
  };

  const handleDecideForMe = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "¡Agregá ingredientes!",
        description: "Necesito saber qué tenés disponible.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRecipes([]);

    try {
      const recentRecipes = getRecentRecipeNames(7);
      
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: { 
          ingredients, 
          time: 45,
          randomize: true,
          excludeRecipes: recentRecipes
        }
      });

      if (error) throw error;
      
      if (data?.error === 'no_food_ingredients' || (data?.recipes && data.recipes.length === 0)) {
        toast({
          title: "No encontré recetas",
          description: "Parece que los ingredientes ingresados no son alimentos. ¡Probá con ingredientes de cocina!",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (data?.error) throw new Error(data.error);
      
      if (data?.recipes && data.recipes.length > 0) {
        // Save to history
        addCookedRecipe(data.recipes[0]);
        handleSelectRecipe(data.recipes[0]);
        toast({
          title: "¡Decidí por vos!",
          description: `Te recomiendo: ${data.recipes[0].name}`,
        });
      } else {
        throw new Error('No se pudo generar una receta');
      }
    } catch (error) {
      console.error('Error in handleDecideForMe:', error);
      if (handleGenerateRecipeInvokeError(error)) return;
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No pude decidir una receta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Menu items configuration - Reorganized into 8 main sections (2 rows of 4)
  const menuItems = [
    // Row 1
    { id: "inicio", label: t("menuHome"), icon: Home, requiresAuth: false },
    { id: "cocinar", label: t("menuCook"), icon: ChefHat, requiresAuth: false },
    { id: "micocina", label: t("menuMyKitchen"), icon: Heart, requiresAuth: true },
    { id: "planificar", label: t("menuPlan"), icon: CalendarIcon, requiresAuth: true },
    // Row 2
    { id: "salud", label: t("subTabHealth"), icon: HeartPulse, requiresAuth: true },
    { id: "aprender", label: t("menuLearn"), icon: GraduationCap, requiresAuth: false },
    { id: "jugar", label: t("menuPlay"), icon: Gamepad2, requiresAuth: false },
    { id: "marcela", label: t("menuRecipes"), icon: Youtube, requiresAuth: false },
  ];

  const handleTabChange = (value: string) => {
    const item = menuItems.find(m => m.id === value);
    
    // Trigger click animation
    setClickedMenuId(value);
    setTimeout(() => setClickedMenuId(null), 600);
    
    // Check if requires auth and user is not logged in
    if (item?.requiresAuth && !user) {
      setLoginRequired(item.label);
      setTimeout(() => setLoginRequired(null), 100);
      setShowLoginFloatingMessage(true);
      setTimeout(() => setShowLoginFloatingMessage(false), 3000);
      return;
    }
    
    setActiveTab(value);
    setActiveSubTab(null); // Reset sub-tab when main tab changes
    
    // Trigger tracking states for grouped sections
    if (value === "planificar") {
      setPantryOpened(true);
      setCalendarOpened(true);
      setShoppingListOpened(true);
      setTimeout(() => {
        setPantryOpened(false);
        setCalendarOpened(false);
        setShoppingListOpened(false);
      }, 100);
    }
    if (value === "micocina") {
      setFavoritesOpened(true);
      setTimeout(() => setFavoritesOpened(false), 100);
    }
  };

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden w-screen max-w-[100vw]">
      <FuturisticBackground />
      <div className="w-full max-w-4xl mx-auto py-6 md:py-10 px-3 sm:px-4 relative z-10 overflow-hidden box-border">
        {/* Top bar with social links and user menu */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <a
              href="https://www.youtube.com/@marcelacocina"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors text-sm"
            >
              <Youtube className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">YouTube</span>
            </a>
            <a
              href="https://www.instagram.com/marcelacocina_ok/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <Instagram className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Instagram</span>
            </a>
          </div>
          <UserMenu />
        </div>

        <Header />
        
        <MarcelaAssistant 
          hasGeneratedRecipes={recipes.length > 0 && !selectedRecipe} 
          selectedRecipe={selectedRecipe}
          activeFilters={filters}
          mealType={mealType}
          ingredientsCount={ingredients.length}
          isLoading={isLoading}
          isSurpriseMode={false}
          isCharacterAnimating={isCharacterAnimating}
          weeklyCalendar={activeTab === "planificador" ? {
            isActive: true,
            isGeneratingAI: weeklyCalendarState.isGeneratingAI,
            mealsPlanned: weeklyCalendarState.mealsPlanned
          } : undefined}
          showingYouTubeChannel={activeTab === "marcelacocina"}
          onIngredientAdded={ingredients}
          onHistoryDeleted={historyDeleted}
          activeTab={marcelaActiveTab}
          onFiltersChanged={filters}
          onTimeChanged={time}
          onPantryOpened={pantryOpened}
          onFavoritesOpened={favoritesOpened}
          onShoppingListOpened={shoppingListOpened}
          onCalendarOpened={calendarOpened}
          onLoginRequired={loginRequired}
        />

        {selectedRecipe ? (
          <RecipeDetail 
            recipe={selectedRecipe} 
            onBack={() => setSelectedRecipe(null)}
            onRecipeCooked={() => {
              refetchCookedRecipes();
              recordCookedRecipe();
              refetchAchievements();
            }}
            pantryItems={pantryItems}
            onAddToShoppingList={shoppingList.addItem}
          />
        ) : (
          <main className="space-y-6">


            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Two row navigation - 4 items per row */}
              <div className="mb-6 space-y-2">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-1 sm:gap-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1.5 sm:p-2 overflow-hidden">
                {menuItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isClicked = clickedMenuId === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[64px] sm:min-h-[78px] min-w-0 ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "bg-background/60 hover:bg-background active:scale-95 text-foreground"
                        }`}
                      >
                        <div className={`relative flex-shrink-0 ${isClicked ? "animate-futuristic-click" : ""}`}>
                          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isActive ? "drop-shadow-glow" : ""} ${isClicked ? "animate-icon-pulse" : ""}`} />
                          {isClicked && (
                            <span className="absolute inset-0 animate-ripple-out rounded-full border-2 border-primary/50" />
                          )}
                        </div>
                        <span className="text-center leading-tight w-full px-0.5">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-1 sm:gap-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1.5 sm:p-2 overflow-hidden">
                {menuItems.slice(4, 8).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isClicked = clickedMenuId === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[64px] sm:min-h-[78px] min-w-0 ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "bg-background/60 hover:bg-background active:scale-95 text-foreground"
                        }`}
                      >
                        <div className={`relative flex-shrink-0 ${isClicked ? "animate-futuristic-click" : ""}`}>
                          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isActive ? "drop-shadow-glow" : ""} ${isClicked ? "animate-icon-pulse" : ""}`} />
                          {isClicked && (
                            <span className="absolute inset-0 animate-ripple-out rounded-full border-2 border-primary/50" />
                          )}
                        </div>
                        <span className="text-center leading-tight w-full px-0.5">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab: Inicio */}
              <TabsContent value="inicio" className="space-y-6 animate-fade-in">
                <MySummary
                  onOpenRecipe={handleSelectRecipe}
                />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Cocinar (con Timer) */}
              <TabsContent value="cocinar" className="space-y-6 animate-fade-in">
                <CocinarGroupSection
                  ingredients={ingredients}
                  setIngredients={setIngredients}
                  time={time}
                  setTime={setTime}
                  mealType={mealType}
                  setMealType={setMealType}
                  filters={filters}
                  setFilters={setFilters}
                  quickFilters={quickFilters}
                  setQuickFilters={setQuickFilters}
                  recipes={recipes}
                  isLoading={isLoading}
                  onGenerateRecipe={handleGenerateRecipe}
                  onDecideForMe={handleDecideForMe}
                  onReset={handleReset}
                  onSelectRecipe={handleSelectRecipe}
                  playSound={playSound}
                  pendingSuggestion={pendingSuggestion}
                  onClearSuggestion={() => setPendingSuggestion(null)}
                />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Jugar */}
              <TabsContent value="jugar" className="space-y-6 animate-fade-in">
                <div className="max-w-lg mx-auto">
                  <CookWithMarcela onAchievementUnlocked={() => {
                    refetchAchievements();
                    toast({
                      title: "🎉 ¡Nuevo logro desbloqueado!",
                      description: `¡Completaste una receta interactiva!`,
                    });
                  }} />
                </div>
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Aprender */}
              <TabsContent value="aprender" className="space-y-6 animate-fade-in">
                <LearnSection 
                  onNavigateToCooking={() => setActiveTab("cocinar")}
                  onNavigateToGame={() => setActiveTab("jugar")}
                  onSubTabChange={setActiveSubTab}
                />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Planificar (Calendario + Despensa + Super) */}
              <TabsContent value="planificar" className="space-y-6 animate-fade-in">
                <PlanificarSection
                  ingredients={ingredients}
                  pantryItems={pantryItems}
                  onStateChange={setWeeklyCalendarState}
                  onSelectIngredients={handleSelectIngredients}
                  onSubTabChange={setActiveSubTab}
                />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Mi Cocina (Favoritos + Historial + Logros + Escaneo) */}
              <TabsContent value="micocina" className="space-y-6 animate-fade-in">
                <MiCocinaSection
                  onSelectRecipe={handleSelectRecipe}
                  onHistoryDeleted={() => setHistoryDeleted(true)}
                  onSelectSuggestion={(suggestion) => {
                    setPendingSuggestion(suggestion);
                    setActiveTab("cocinar");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    toast({
                      title: "Receta seleccionada",
                      description: `"${suggestion.name}" - Hacé click en "Dame la receta" para generarla`,
                    });
                  }}
                  onSubTabChange={setActiveSubTab}
                />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Marcela (YouTube + Canal) */}
              <TabsContent value="marcela" className="space-y-6 animate-fade-in">
                <MarcelaSection />
                <BackToMenuButton />
              </TabsContent>

              {/* Tab: Salud */}
              <TabsContent value="salud" className="space-y-6 animate-fade-in">
                <div className="max-w-xl mx-auto">
                  <NutritionalBalance 
                    onRecommendRecipes={() => {
                      setActiveTab("cocinar");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast({
                        title: t("marcelaTipTitle"),
                        description: t("marcelaTipNutrients"),
                      });
                    }}
                    onAddIngredientToCook={(ingredientName) => {
                      // Add ingredient to cooking section
                      setIngredients(prev => {
                        const newIngredients = [...new Set([...prev, ingredientName])];
                        return newIngredients;
                      });
                      // Navigate to cooking tab
                      setActiveTab("cocinar");
                      // Show success toast
                      toast({
                        title: "✅ Ingrediente agregado",
                        description: `"${ingredientName}" fue agregado a tu lista de cocinar`,
                      });
                    }}
                    onSubTabChange={setActiveSubTab}
                  />
                </div>
                <BackToMenuButton />
              </TabsContent>
            </Tabs>

            {/* Shopping List Modal */}
            <SupermarketListModal 
              open={showShoppingListModal} 
              onOpenChange={setShowShoppingListModal} 
            />
          </main>
        )}

        {/* Floating Timer */}
        <FloatingTimer 
          activeTab={activeTab} 
          onNavigateToTimer={() => setActiveTab("cocinar")} 
        />

        {/* Floating Login Message */}
        {showLoginFloatingMessage && (
          <div className="fixed bottom-40 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🔐</span>
              <span className="text-sm font-medium text-foreground">Necesitás iniciar sesión</span>
              <a 
                href="/auth" 
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Entrar
              </a>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
