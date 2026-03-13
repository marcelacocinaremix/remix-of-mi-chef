import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavBar, MainTab } from "@/components/BottomNavBar";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { FiltersState } from "@/components/AdvancedFilters";
import { Recipe } from "@/components/RecipeList";
import { RecipeDetail } from "@/components/RecipeDetail";
import { SupermarketListModal } from "@/components/SupermarketListModal";
import { MarcelaAssistant } from "@/components/MarcelaAssistant";
import { FloatingTimer } from "@/components/FloatingTimer";
import { FloatingTimerButton } from "@/components/FloatingTimerButton";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { MasSection } from "@/components/MasSection";
import MySummary from "@/components/MySummary";
import { TrialNoticeModal } from "@/components/TrialNoticeModal";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { NutritionalBalance } from "@/components/NutritionalBalance";
import { CocinarGroupSection } from "@/components/CocinarGroupSection";
import { PlanificarSection } from "@/components/PlanificarSection";
import { MiCocinaSection } from "@/components/MiCocinaSection";
import { MarcelaSection } from "@/components/MarcelaSection";
import { LearnSection } from "@/components/LearnSection";
import { FoodStorageGuide } from "@/components/FoodStorageGuide";
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
import { useStreakContext } from "@/contexts/StreakContext";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";
import { ArrowLeft } from "lucide-react";

// Sub-tabs inside "Más" that render as full sections
type MasSubTab = "aprender" | "jugar" | "marcela" | "perfil" | "balance" | "guia" | "logros" | null;

export default function Index() {
  const { t, language, isFirstVisit, setFirstVisitComplete } = useLanguage();
  const { user } = useAuth();
  const { dailyUsage, checkDailyUsage, refetch: refetchPremium, isPremium, hasAnyAccess, isTrialExpired } = usePremium();
  const { showInterstitial } = useAdMob();
  const isMobile = useIsMobile();
  const { theme } = useAppTheme();
  const { isRunning: timerIsRunning, isFinished: timerIsFinished } = useKitchenTimer();

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
  const { recordActivity: recordStreak } = useStreakContext();
  const [isCharacterAnimating, setIsCharacterAnimating] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("inicio");
  const [masSubTab, setMasSubTab] = useState<MasSubTab>(null);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const [historyDeleted, setHistoryDeleted] = useState(false);
  const [loginRequired, setLoginRequired] = useState<string | null>(null);
  const [showLoginFloatingMessage, setShowLoginFloatingMessage] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<{ name: string; reason: string } | null>(null);
  const [shownRecipeNames, setShownRecipeNames] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [pantryOpened, setPantryOpened] = useState(false);
  const [favoritesOpened, setFavoritesOpened] = useState(false);
  const [shoppingListOpened, setShoppingListOpened] = useState(false);
  const [calendarOpened, setCalendarOpened] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // ──────────────── Error parsing helpers ────────────────
  const parseEdgeFunctionError = (err: any) => {
    const status = err?.context?.status as number | undefined;
    const rawBody = err?.context?.body;
    let body: any = undefined;
    if (typeof rawBody === 'string') {
      try { body = JSON.parse(rawBody); } catch { body = undefined; }
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
      toast({ title: 'Iniciá sesión', description: 'Necesitás iniciar sesión para generar recetas.', variant: 'destructive' });
      window.location.href = '/auth?redirect=/';
      return true;
    }
    if (code === 'FREE_LIMIT_EXCEEDED' || code === 'PAYWALL_REQUIRED' || status === 402 || status === 403) {
      toast({ title: 'Límite diario alcanzado', description: `¡Volvé mañana para más recetas! (${isPremium ? 10 : 3} por día)`, variant: 'destructive' });
      return true;
    }
    if (status === 429 || code === 'RATE_LIMITED') {
      const isDailyLimit = err?.context?.body?.dailyLimitReached;
      if (isDailyLimit) {
        toast({ title: '🍳 ¡Se acabaron tus recetas de hoy!', description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`, variant: 'destructive' });
        refetchPremium();
      } else {
        toast({ title: 'Estamos con mucha demanda', description: 'Probá de nuevo en un ratito.', variant: 'destructive' });
      }
      return true;
    }
    if (message && message !== 'Edge Function returned a non-2xx status code') {
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return true;
    }
    return false;
  };

  // ──────────────── Generate recipe ────────────────
  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      toast({ title: "¡Agregá ingredientes!", description: "Necesito saber qué tenés disponible para sugerirte recetas.", variant: "destructive" });
      return;
    }
    if (user) {
      const usageResult = await checkDailyUsage();
      if (!usageResult.allowed) {
        toast({ title: "🍳 ¡Se acabaron tus recetas de hoy!", description: usageResult.message || `Ya usaste tus ${isPremium ? '10' : '3'} recetas del día. ¡Volvé mañana para seguir cocinando!`, variant: "destructive" });
        return;
      }
    }
    if (!isPremium) await showInterstitial();

    playSound('magic');
    setIsCharacterAnimating(true);
    setTimeout(() => setIsCharacterAnimating(false), 2500);
    setIsLoading(true);
    setRecipes([]);
    setSelectedRecipe(null);
    setInstantRecipe(null);
    setIsGeneratingAI(true);

    const recentRecipes = getRecentRecipeNames(7);
    const allExcluded = [...new Set([...recentRecipes, ...shownRecipeNames])];

    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: { ingredients, time, mealType, quickFilters, difficulty: filters.difficulty, diet: filters.diet, excludeIngredients: filters.excludeIngredients, servings: filters.servings, cookingMethod: filters.cookingMethod, budget: filters.budget, excludeRecipes: allExcluded, language }
      });

      if (error) {
        const errorStr = JSON.stringify(error).toLowerCase();
        const is429 = error.message?.includes('429') || error.status === 429 || errorStr.includes('429') || errorStr.includes('dailylimitreached') || errorStr.includes('límite');
        if (is429) {
          toast({ title: "🍳 ¡Se acabaron tus recetas de hoy!", description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`, variant: "destructive" });
          setIsLoading(false); setIsGeneratingAI(false); return;
        }
        throw error;
      }

      if (data?.dailyLimitReached) {
        toast({ title: "🍳 ¡Se acabaron tus recetas de hoy!", description: `Ya usaste tus ${isPremium ? 10 : 3} recetas del día. ¡Volvé mañana para seguir cocinando!`, variant: "destructive" });
        setIsLoading(false); setIsGeneratingAI(false); return;
      }
      if (data?.error === 'no_flavor_match') {
        toast({ title: "Sin recetas con ese perfil", description: data?.message || "No encontré una receta que tenga sentido con esos ingredientes.", variant: "destructive" });
        setIsLoading(false); setIsGeneratingAI(false); return;
      }
      if (data?.error === 'no_food_ingredients' || (data?.recipes && data.recipes.length === 0)) {
        if (!instantRecipe) toast({ title: "No encontramos recetas con esos ingredientes", description: data?.message || "Probá quitando alguno para encontrar más opciones. 🍳", variant: "destructive" });
        setIsLoading(false); setIsGeneratingAI(false); return;
      }
      if (data?.recipes && data.recipes.length > 0 && data.source === 'cache') {
        setRecipes(data.recipes);
        data.recipes.forEach((r: Recipe) => addCookedRecipe(r));
        data.recipes.forEach((r: Recipe) => { const n = r?.name || ''; if (n) setShownRecipeNames(prev => [...prev, n.toLowerCase()]); });
        const matchInfo = data.matchInfo;
        const isPartial = matchInfo && matchInfo.percentage < 100;
        const count = data.recipes.length;
        toast({ title: isPartial ? `Receta con ${matchInfo.matched} de ${matchInfo.total} ingredientes` : count > 1 ? `¡${count} recetas listas!` : "¡Receta lista!", description: isPartial ? `Coincidencia del ${matchInfo.percentage}%.` : count > 1 ? "¡Preparé 2 opciones para vos!" : "¡Encontré una receta perfecta para vos!" });
        setIsLoading(false); setIsGeneratingAI(false); refetchPremium(); return;
      }
      if (data?.error && (!data?.recipes || data.recipes.length === 0)) {
        toast({ title: "No se pudo generar la receta", description: data.message || "Intentá de nuevo en unos segundos.", variant: "destructive" });
        setIsLoading(false); setIsGeneratingAI(false); return;
      }
      if (data?.error) {
        if (instantRecipe) { toast({ title: "Usando receta de respaldo", description: "Hubo un problema pero te muestro una receta guardada." }); setIsLoading(false); setIsGeneratingAI(false); return; }
        throw new Error(data.error);
      }
      if (data?.recipes && data.recipes.length > 0) {
        const recipesToShow = data.recipes.slice(0, 2);
        setRecipes(recipesToShow);
        setInstantRecipe(null);
        recipesToShow.forEach((r: Recipe) => { if (r) { addCookedRecipe(r); const n = r?.name || ''; if (n) setShownRecipeNames(prev => [...prev, n.toLowerCase()]); } });
        const count = recipesToShow.length;
        toast({ title: count > 1 ? "¡2 recetas listas!" : "¡Receta lista!", description: count > 1 ? "¡Te preparé 2 opciones para elegir!" : "¡Preparé una receta para vos!" });
      } else if (!instantRecipe) {
        throw new Error('No se pudieron generar recetas');
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      if (instantRecipe) {
        addCookedRecipe(instantRecipe);
        toast({ title: "Usando receta de respaldo", description: "La IA está ocupada, pero te muestro una receta guardada." });
      } else {
        if (handleGenerateRecipeInvokeError(error)) return;
        toast({ title: "Error", description: error instanceof Error ? error.message : "No pude generar las recetas.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false); setIsGeneratingAI(false); refetchPremium(); recordStreak();
    }
  };

  const handleReset = () => {
    setIngredients([]); setTime(30); setMealType(null);
    setFilters({ difficulty: null, diet: [], excludeIngredients: [], servings: null, cookingMethod: null, budget: null, maxTime: null });
    setRecipes([]); setSelectedRecipe(null); setShownRecipeNames([]);
  };

  const handleSelectRecipe = (recipe: Recipe | null) => {
    setSelectedRecipe(recipe);
    if (recipe) setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' }), 0);
  };

  const handleSelectIngredients = (pantryIngredients: string[]) => {
    setIngredients([...new Set([...ingredients, ...pantryIngredients])]);
    setPantryItems(pantryIngredients);
  };

  const handleDecideForMe = async () => {
    if (ingredients.length === 0) {
      toast({ title: "¡Agregá ingredientes!", description: "Necesito saber qué tenés disponible.", variant: "destructive" });
      return;
    }
    setIsLoading(true); setRecipes([]);
    try {
      const recentRecipes = getRecentRecipeNames(7);
      const { data, error } = await supabase.functions.invoke('generate-recipe', { body: { ingredients, time: 45, quickFilters, randomize: true, excludeRecipes: recentRecipes } });
      if (error) throw error;
      if (data?.error === 'no_food_ingredients' || (data?.recipes && data.recipes.length === 0)) {
        toast({ title: "No encontré recetas", description: "Parece que los ingredientes ingresados no son alimentos.", variant: "destructive" });
        setIsLoading(false); return;
      }
      if (data?.error) throw new Error(data.error);
      if (data?.recipes && data.recipes.length > 0) {
        addCookedRecipe(data.recipes[0]);
        handleSelectRecipe(data.recipes[0]);
        toast({ title: "¡Decidí por vos!", description: `Te recomiendo: ${data.recipes[0].name}` });
      } else throw new Error('No se pudo generar una receta');
    } catch (error) {
      console.error('Error in handleDecideForMe:', error);
      if (handleGenerateRecipeInvokeError(error)) return;
      toast({ title: "Error", description: error instanceof Error ? error.message : "No pude decidir una receta.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  // ──────────────── Tab navigation ────────────────
  const handleTabChange = (tab: MainTab) => {
    setClickedTab(tab);
    setTimeout(() => setClickedTab(null), 400);

    // Auth guard
    const requiresAuth = ["micocina", "planificar"].includes(tab);
    if (requiresAuth && !user) {
      setShowLoginFloatingMessage(true);
      setTimeout(() => setShowLoginFloatingMessage(false), 3000);
      return;
    }

    setActiveTab(tab);
    setActiveSubTab(null);
    setMasSubTab(null);

    // Streak triggers
    if (user && ["aprender", "planificar", "balance"].includes(tab)) recordStreak();

    if (tab === "planificar") {
      setPantryOpened(true); setCalendarOpened(true); setShoppingListOpened(true);
      setTimeout(() => { setPantryOpened(false); setCalendarOpened(false); setShoppingListOpened(false); }, 100);
    }
    if (tab === "micocina") {
      setFavoritesOpened(true);
      setTimeout(() => setFavoritesOpened(false), 100);
    }
    // Scroll to top
    setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  // Navigate from "Más" grid to sub-section
  const handleMasNavigate = (id: string) => {
    if (id === "perfil") { setShowProfileModal(true); return; }
    setMasSubTab(id as MasSubTab);
    if (user && ["aprender", "balance"].includes(id)) recordStreak();
    setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  // Timer FAB visibility: always show if running/finished; otherwise only in "cocinar"
  const showTimerButton = activeTab === "cocinar" || timerIsRunning || timerIsFinished;

  return (
    <div className="h-[100dvh] gradient-hero relative overflow-hidden w-screen max-w-[100vw] flex flex-col">
      <FuturisticBackground />

      {/* Sticky header */}
      <AppHeader />

      {/* Scrollable content area — padded to avoid overlap with bottom nav */}
      <div
        ref={scrollContainerRef}
        className="w-full max-w-4xl mx-auto px-3 sm:px-4 relative z-10 flex-1 overflow-y-auto overflow-x-hidden box-border pb-24"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Marcela Assistant (always rendered; hidden by default per design) */}
        <MarcelaAssistant
          hasGeneratedRecipes={recipes.length > 0 && !selectedRecipe}
          selectedRecipe={selectedRecipe}
          activeFilters={filters}
          mealType={mealType}
          ingredientsCount={ingredients.length}
          isLoading={isLoading}
          isSurpriseMode={false}
          isCharacterAnimating={isCharacterAnimating}
          weeklyCalendar={activeTab === "planificar" ? { isActive: true, isGeneratingAI: weeklyCalendarState.isGeneratingAI, mealsPlanned: weeklyCalendarState.mealsPlanned } : undefined}
          showingYouTubeChannel={activeTab === "mas" && masSubTab === "marcela"}
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

        {/* ─── Recipe detail overlay ─── */}
        {selectedRecipe ? (
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            onRecipeCooked={() => { refetchCookedRecipes(); recordCookedRecipe(); refetchAchievements(); }}
            pantryItems={pantryItems}
            onAddToShoppingList={shoppingList.addItem}
          />
        ) : (
          <main className="space-y-4 pt-4">
            {/* ─── MAIN TABS (all except "mas" sub-sections) ─── */}
            <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as MainTab)} className="w-full">

              {/* Inicio */}
              <TabsContent value="inicio" className="space-y-6 animate-fade-in mt-0">
                <MySummary onOpenRecipe={handleSelectRecipe} />
              </TabsContent>

              {/* Cocinar */}
              <TabsContent value="cocinar" className="space-y-6 animate-fade-in mt-0">
                <CocinarGroupSection
                  ingredients={ingredients} setIngredients={setIngredients}
                  time={time} setTime={setTime}
                  mealType={mealType} setMealType={setMealType}
                  filters={filters} setFilters={setFilters}
                  quickFilters={quickFilters} setQuickFilters={setQuickFilters}
                  recipes={recipes} isLoading={isLoading}
                  onGenerateRecipe={handleGenerateRecipe}
                  onDecideForMe={handleDecideForMe}
                  onReset={handleReset}
                  onSelectRecipe={handleSelectRecipe}
                  playSound={playSound}
                  pendingSuggestion={pendingSuggestion}
                  onClearSuggestion={() => setPendingSuggestion(null)}
                />
              </TabsContent>

              {/* Mi Cocina */}
              <TabsContent value="micocina" className="space-y-6 animate-fade-in mt-0">
                <MiCocinaSection
                  onSelectRecipe={handleSelectRecipe}
                  onHistoryDeleted={() => setHistoryDeleted(true)}
                  onSelectSuggestion={(suggestion) => {
                    setPendingSuggestion(suggestion);
                    setActiveTab("cocinar");
                    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    toast({ title: "Receta seleccionada", description: `"${suggestion.name}" - Hacé click en "Dame la receta" para generarla` });
                  }}
                  onSubTabChange={setActiveSubTab}
                />
              </TabsContent>

              {/* Planificar */}
              <TabsContent value="planificar" className="space-y-6 animate-fade-in mt-0">
                <PlanificarSection
                  ingredients={ingredients}
                  pantryItems={pantryItems}
                  onStateChange={setWeeklyCalendarState}
                  onSelectIngredients={handleSelectIngredients}
                  onSubTabChange={setActiveSubTab}
                  onNavigateToCooking={() => setActiveTab("cocinar")}
                />
              </TabsContent>

              {/* Más — muestra grid o sub-sección */}
              <TabsContent value="mas" className="animate-fade-in mt-0">
                {!masSubTab ? (
                  <MasSection onNavigate={handleMasNavigate} />
                ) : (
                  <div className="space-y-4">
                    {/* Back button */}
                    <button
                      onClick={() => setMasSubTab(null)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t("menuMore")}
                    </button>

                    {masSubTab === "aprender" && (
                      <LearnSection
                        onNavigateToCooking={() => setActiveTab("cocinar")}
                        onNavigateToGame={() => { setActiveTab("mas"); setMasSubTab("jugar"); }}
                        onSubTabChange={setActiveSubTab}
                      />
                    )}
                    {masSubTab === "guia" && (
                      <FoodStorageGuide />
                    )}
                    {masSubTab === "jugar" && (
                      <div className="max-w-lg mx-auto">
                        <GameSection />
                      </div>
                    )}
                    {masSubTab === "marcela" && <MarcelaSection />}
                    {masSubTab === "logros" && (
                      <div className="max-w-xl mx-auto">
                        <AchievementsSection />
                      </div>
                    )}
                    {masSubTab === "balance" && (
                      <div className="max-w-xl mx-auto">
                        <NutritionalBalance
                          onRecommendRecipes={() => {
                            setActiveTab("cocinar");
                            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            toast({ title: t("marcelaTipTitle"), description: t("marcelaTipNutrients") });
                          }}
                          onAddIngredientToCook={(ingredientName) => {
                            setIngredients(prev => [...new Set([...prev, ingredientName])]);
                            setActiveTab("cocinar");
                            toast({ title: "✅ Ingrediente agregado", description: `"${ingredientName}" fue agregado a tu lista de cocinar` });
                          }}
                          onSubTabChange={setActiveSubTab}
                        />
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Shopping List Modal */}
            <SupermarketListModal open={showShoppingListModal} onOpenChange={setShowShoppingListModal} />
          </main>
        )}

        {/* Floating Timer pill (shows when timer running/finished on any tab) */}
        <FloatingTimer
          activeTab={activeTab}
          onNavigateToTimer={() => setActiveTab("cocinar")}
        />

        {/* Timer FAB: solo en cocinar, o si hay timer activo */}
        {showTimerButton && <FloatingTimerButton />}

        {/* Login message */}
        {showLoginFloatingMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🔐</span>
              <span className="text-sm font-medium">{t("loginRequired")}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Fixed Bottom Navigation ─── */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        clickedTab={clickedTab}
      />

      {/* Profile modal (opened from Más > Perfil) */}
      <UserProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />

      <TrialNoticeModal />
    </div>
  );
}
