import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { FiltersState } from "@/components/AdvancedFilters";
import { Recipe } from "@/components/RecipeList";
import { RecipeDetail } from "@/components/RecipeDetail";
import { SupermarketListModal } from "@/components/SupermarketListModal";
import { UserMenu } from "@/components/UserMenu";
import { MarcelaAssistant } from "@/components/MarcelaAssistant";
import { FloatingTimer } from "@/components/FloatingTimer";
import { FloatingTimerButton } from "@/components/FloatingTimerButton";
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
  Lock,
} from "lucide-react";
import { NutritionalBalance } from "@/components/NutritionalBalance";
import { CocinarGroupSection } from "@/components/CocinarGroupSection";
import { PlanificarSection } from "@/components/PlanificarSection";
import { MiCocinaSection } from "@/components/MiCocinaSection";
import { MarcelaSection } from "@/components/MarcelaSection";
import { LearnSection } from "@/components/LearnSection";
import { GameSection } from "@/components/game/GameSection";
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
import { useAdMob } from "@/hooks/useAdMob";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function Index() {
  const { t, language, isFirstVisit, setFirstVisitComplete } = useLanguage();
  const { user } = useAuth();
  const { dailyUsage, checkDailyUsage, refetch: refetchPremium, isPremium, hasAnyAccess, isTrialExpired } = usePremium();
  const { showInterstitial } = useAdMob();
  const isMobile = useIsMobile();
  const { theme } = useAppTheme();
  const isFuture = theme === "future";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
  // Track shown recipes per session to rotate and avoid repeats
  const [shownRecipeNames, setShownRecipeNames] = useState<string[]>([]);

  // Compute the active tab for Marcela (use sub-tab when available)
  const marcelaActiveTab = activeSubTab || activeTab;

  // Update activeTab when user logs in
  useEffect(() => {
    if (user && activeTab === "cocinar") {
      setActiveTab("inicio");
    }
  }, [user]);

  // AdMob is initialized in main.tsx before the app renders

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
        description: `¡Volvé mañana para más recetas! (${isPremium ? 10 : 3} por día)`,
        variant: 'destructive',
      });
      return true;
    }

    if (status === 429 || code === 'RATE_LIMITED') {
      // Check if it's daily limit (from edge function)
      const isDailyLimit = err?.context?.body?.dailyLimitReached;
      if (isDailyLimit) {
        toast({
          title: '🍳 ¡Se acabaron tus recetas de hoy!',
          description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`,
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

    // Check daily usage before generating
    if (user) {
      const usageResult = await checkDailyUsage();
      if (!usageResult.allowed) {
        toast({
          title: "🍳 ¡Se acabaron tus recetas de hoy!",
          description: usageResult.message || `Ya usaste tus ${isPremium ? '10' : '3'} recetas del día. ¡Volvé mañana para seguir cocinando!`,
          variant: "destructive",
        });
        return;
      }
    }
    // Show interstitial ad for free users before generating
    if (!isPremium) {
      await showInterstitial();
    }

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
    // Combine recently cooked + already shown this session for rotation
    const allExcluded = [...new Set([...recentRecipes, ...shownRecipeNames])];

    // SINGLE CALL: Backend handles free (DB only) vs premium (DB + AI fallback)
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
          excludeRecipes: allExcluded,
          language: language,
        }
      });

      if (error) {
        const errorStr = JSON.stringify(error).toLowerCase();
        const is429 = error.message?.includes('429') || 
                      error.status === 429 ||
                      errorStr.includes('429') ||
                      errorStr.includes('dailylimitreached') ||
                      errorStr.includes('límite');
        
        if (is429) {
          toast({
            title: "🍳 ¡Se acabaron tus recetas de hoy!",
            description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`,
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
            title: "🍳 ¡Se acabaron tus recetas de hoy!",
            description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`,
            variant: "destructive",
        });
        setIsLoading(false);
        setIsGeneratingAI(false);
        return;
      }
      
      if (data?.error === 'no_flavor_match') {
        toast({
          title: "Sin recetas con ese perfil",
          description: data?.message || "No encontré una receta que tenga sentido con esos ingredientes y el sabor seleccionado.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsGeneratingAI(false);
        return;
      }

      if (data?.error === 'no_food_ingredients' || (data?.recipes && data.recipes.length === 0)) {
        if (instantRecipe) {
          toast({
            title: "Usando recetas guardadas",
            description: "No encontré más opciones, pero podés usar las que te mostré.",
          });
        } else {
          toast({
            title: "No encontramos recetas con esos ingredientes",
            description: data?.message || "Probá quitando alguno para encontrar más opciones. 🍳",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        setIsGeneratingAI(false);
        return;
      }
      
       // Handle cache hit with match info
       if (data?.recipes && data.recipes.length > 0 && data.source === 'cache') {
         setRecipes(data.recipes);
         addCookedRecipe(data.recipes[0]);
         // Track shown recipe name for rotation
         const recipeName = data.recipes[0]?.name || '';
         if (recipeName) {
           setShownRecipeNames(prev => [...prev, recipeName.toLowerCase()]);
         }
         
         const matchInfo = data.matchInfo;
         const isPartial = matchInfo && matchInfo.percentage < 100;
         toast({
           title: isPartial ? `Receta con ${matchInfo.matched} de ${matchInfo.total} ingredientes` : "¡Receta lista!",
           description: isPartial 
             ? `Coincidencia del ${matchInfo.percentage}%. Probá quitando algún ingrediente para más opciones.`
             : "¡Encontré una receta perfecta para vos!",
         });
         setIsLoading(false);
         setIsGeneratingAI(false);
         refetchPremium();
         return;
       }

       // Handle errors (no_matching_recipe, ai_unavailable, etc.)
       if (data?.error && (!data?.recipes || data.recipes.length === 0)) {
         toast({
           title: "No se pudo generar la receta",
           description: data.message || "Intentá de nuevo en unos segundos.",
           variant: "destructive",
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
        // Show only 1 recipe per click
        const recipesToShow = data.recipes.slice(0, 1);
        setRecipes(recipesToShow);
        setInstantRecipe(null); // Clear instant recipe as we have AI recipes now
        
        // Save first recipe to history automatically
         if (recipesToShow[0]) {
           addCookedRecipe(recipesToShow[0]);
           // Track shown recipe name for rotation
           const aiName = recipesToShow[0]?.name || '';
           if (aiName) {
             setShownRecipeNames(prev => [...prev, aiName.toLowerCase()]);
           }
         }
        
        toast({
          title: "¡Receta lista!",
          description: "¡Preparé una receta para vos!",
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
      refetchPremium();
    }
  };

  const handleReset = () => {
    setIngredients([]);
    setTime(30);
    setMealType(null);
    setFilters({ difficulty: null, diet: [], excludeIngredients: [], servings: null, cookingMethod: null, budget: null, maxTime: null });
    setRecipes([]);
    setSelectedRecipe(null);
    setShownRecipeNames([]); // Reset rotation on new search
  };

  const handleSelectRecipe = (recipe: Recipe | null) => {
    setSelectedRecipe(recipe);
    if (recipe) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      }, 0);
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
          quickFilters,
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
    { id: "inicio",     label: t("menuHome"),       icon: Home,          requiresAuth: false, lockedWhenExpired: false },
    { id: "cocinar",    label: t("menuCook"),        icon: ChefHat,       requiresAuth: false, lockedWhenExpired: false },
    { id: "micocina",   label: t("menuMyKitchen"),   icon: Heart,         requiresAuth: true,  lockedWhenExpired: false },
    { id: "planificar", label: t("menuPlan"),        icon: CalendarIcon,  requiresAuth: true,  lockedWhenExpired: false },
    // Row 2
    { id: "salud",     label: t("subTabHealth"),    icon: HeartPulse,    requiresAuth: true,  lockedWhenExpired: true  },
    { id: "aprender",  label: t("menuLearn"),       icon: GraduationCap, requiresAuth: false, lockedWhenExpired: false },
    { id: "jugar",     label: t("menuPlay"),        icon: Gamepad2,      requiresAuth: false, lockedWhenExpired: false },
    { id: "marcela",   label: t("menuRecipes"),     icon: Youtube,       requiresAuth: false, lockedWhenExpired: false },
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
    <div className="h-[100dvh] gradient-hero relative overflow-hidden w-screen max-w-[100vw] flex flex-col">
      <FuturisticBackground />
      <div ref={scrollContainerRef} className="w-full max-w-4xl mx-auto py-6 md:py-10 px-3 sm:px-4 relative z-10 flex-1 overflow-y-auto overflow-x-hidden box-border">
        {/* Top bar with social links and user menu */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open("https://www.youtube.com/@marcelacocina", "_blank")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors text-sm cursor-pointer"
            >
              <Youtube className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">YouTube</span>
            </button>
            <button
              onClick={() => window.open("https://instagram.com/marcelacocina_ok", "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer"
            >
              <Instagram className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Instagram</span>
            </button>
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
              <div className="mb-6 space-y-2 pb-6 -mx-3 sm:-mx-4 px-3 sm:px-4 bg-background/80 backdrop-blur-sm">
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
                            ? isFuture
                              ? "bg-transparent border-2 border-primary text-primary shadow-[0_0_12px_hsl(195_100%_50%/0.6),inset_0_0_12px_hsl(195_100%_50%/0.08)]"
                              : "bg-primary text-primary-foreground shadow-lg"
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
                    const showLock = item.lockedWhenExpired && user && !hasAnyAccess;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[64px] sm:min-h-[78px] min-w-0 ${
                          isActive
                            ? isFuture
                              ? "bg-transparent border-2 border-primary text-primary shadow-[0_0_12px_hsl(195_100%_50%/0.6),inset_0_0_12px_hsl(195_100%_50%/0.08)]"
                              : "bg-primary text-primary-foreground shadow-lg"
                            : "bg-background/60 hover:bg-background active:scale-95 text-foreground"
                        }`}
                      >
                        <div className={`relative flex-shrink-0 ${isClicked ? "animate-futuristic-click" : ""}`}>
                          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isActive ? "drop-shadow-glow" : ""} ${isClicked ? "animate-icon-pulse" : ""}`} />
                          {showLock && (
                            <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-500" />
                          )}
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
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
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
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
              </TabsContent>

              {/* Tab: Jugar */}
              <TabsContent value="jugar" className="space-y-6 animate-fade-in">
                <div className="max-w-lg mx-auto">
                  <GameSection />
                </div>
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
              </TabsContent>

              {/* Tab: Aprender */}
              <TabsContent value="aprender" className="space-y-6 animate-fade-in">
                <LearnSection 
                  onNavigateToCooking={() => setActiveTab("cocinar")}
                  onNavigateToGame={() => setActiveTab("jugar")}
                  onSubTabChange={setActiveSubTab}
                />
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
              </TabsContent>

              {/* Tab: Planificar (Calendario + Despensa + Super) */}
              <TabsContent value="planificar" className="space-y-6 animate-fade-in">
                <PlanificarSection
                  ingredients={ingredients}
                  pantryItems={pantryItems}
                  onStateChange={setWeeklyCalendarState}
                  onSelectIngredients={handleSelectIngredients}
                  onSubTabChange={setActiveSubTab}
                  onNavigateToCooking={() => setActiveTab("cocinar")}
                />
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
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
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
              </TabsContent>

              {/* Tab: Marcela (YouTube + Canal) */}
              <TabsContent value="marcela" className="space-y-6 animate-fade-in">
                <MarcelaSection />
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
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
                <BackToMenuButton scrollContainerRef={scrollContainerRef} />
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

        {/* Floating Timer Button - always visible above Marcela orb */}
        <FloatingTimerButton />

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
