import { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, X } from "lucide-react";
import { FuturisticOrb } from "./FuturisticOrb";
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/components/RecipeList";
import { FiltersState } from "@/components/AdvancedFilters";
import { useMarcelaAI, MarcelaMood, MarcelaAnimation } from "@/hooks/useMarcelaAI";
import { translations, Language, TranslationKey } from "@/i18n/translations";

interface WeeklyCalendarState {
  isActive: boolean;
  isGeneratingAI: boolean;
  mealsPlanned: number;
}

interface MarcelaAssistantProps {
  hasGeneratedRecipes?: boolean;
  selectedRecipe?: Recipe | null;
  activeFilters?: FiltersState;
  mealType?: string | null;
  ingredientsCount?: number;
  isLoading?: boolean;
  isSurpriseMode?: boolean;
  isCharacterAnimating?: boolean;
  weeklyCalendar?: WeeklyCalendarState;
  showingYouTubeChannel?: boolean;
  onIngredientAdded?: string[];
  onRecipeCooked?: string;
  onFavoriteAdded?: string;
  onHistoryDeleted?: boolean;
  historyStats?: { totalRecipes?: number; topIngredients?: string[] };
  activeTab?: string;
  onFiltersChanged?: FiltersState;
  onTimeChanged?: number;
  onPantryOpened?: boolean;
  onFavoritesOpened?: boolean;
  onShoppingListOpened?: boolean;
  onCalendarOpened?: boolean;
  onLoginRequired?: string | null;
}

/** Returns contextual help text based on the active tab/section */
function getContextualHelp(activeTab: string | undefined, lang: Language): { title: string; body: string } {
  const help: Record<string, { es: { title: string; body: string }; en: { title: string; body: string }; pt: { title: string; body: string } }> = {
    cocinar: {
      es: { title: "🍳 ¿Cómo generar recetas?", body: "Agregá ingredientes, elegí el tiempo y presioná \"Dame la receta\". Cuantos más ingredientes, mejor el resultado." },
      en: { title: "🍳 How to generate recipes?", body: "Add ingredients, choose the time and press \"Give me the recipe\". More ingredients = better results." },
      pt: { title: "🍳 Como gerar receitas?", body: "Adicione ingredientes, escolha o tempo e pressione \"Me dê a receita\". Mais ingredientes = melhores resultados." },
    },
    micocina: {
      es: { title: "❤️ Mi Cocina", body: "Aquí guardás tus recetas favoritas y revisás tu historial de cocina. También podés ver tus logros y racha." },
      en: { title: "❤️ My Kitchen", body: "Save your favorite recipes and review your cooking history. Track achievements and streaks too." },
      pt: { title: "❤️ Minha Cozinha", body: "Salve suas receitas favoritas e revise seu histórico de culinária. Acompanhe conquistas e sequências." },
    },
    favoritos: {
      es: { title: "⭐ Favoritos", body: "Las recetas que marcaste como favoritas aparecen aquí para acceso rápido. ¡Podés cocinarlas de nuevo!" },
      en: { title: "⭐ Favorites", body: "Recipes you marked as favorites appear here for quick access. You can cook them again!" },
      pt: { title: "⭐ Favoritos", body: "As receitas que você marcou como favoritas aparecem aqui. Você pode cozinhá-las novamente!" },
    },
    historial: {
      es: { title: "📖 Historial", body: "Ves todas las recetas que cocinaste. Podés eliminar el historial o volver a buscar una receta." },
      en: { title: "📖 History", body: "See all the recipes you've cooked. You can clear your history or search for a recipe again." },
      pt: { title: "📖 Histórico", body: "Veja todas as receitas que você cozinhou. Você pode limpar o histórico ou pesquisar uma receita novamente." },
    },
    planificar: {
      es: { title: "📅 Planificar", body: "Organizá tus comidas en el calendario semanal o mensual. También podés gestionar tu lista del super y despensa." },
      en: { title: "📅 Plan", body: "Organize your meals in the weekly or monthly calendar. Manage your shopping list and pantry too." },
      pt: { title: "📅 Planejar", body: "Organize suas refeições no calendário semanal ou mensal. Gerencie sua lista de compras e despensa." },
    },
    inicio: {
      es: { title: "🏠 Inicio", body: "Tu resumen diario: actividad, nutrición y racha de cocina. Todo en un solo lugar." },
      en: { title: "🏠 Home", body: "Your daily summary: activity, nutrition and cooking streak. Everything in one place." },
      pt: { title: "🏠 Início", body: "Seu resumo diário: atividade, nutrição e sequência de culinária. Tudo em um só lugar." },
    },
    aprender: {
      es: { title: "🎓 Aprender", body: "Explorá lecciones de cocina, técnicas y consejos. Completá desafíos para ganar puntos." },
      en: { title: "🎓 Learn", body: "Explore cooking lessons, techniques and tips. Complete challenges to earn points." },
      pt: { title: "🎓 Aprender", body: "Explore aulas de culinária, técnicas e dicas. Complete desafios para ganhar pontos." },
    },
    balance: {
      es: { title: "⚖️ Balance Nutricional", body: "Registrá tus comidas para ver tu balance diario de calorías, proteínas, carbohidratos y grasas." },
      en: { title: "⚖️ Nutritional Balance", body: "Log your meals to see your daily balance of calories, protein, carbs and fats." },
      pt: { title: "⚖️ Equilíbrio Nutricional", body: "Registre suas refeições para ver seu balanço diário de calorias, proteínas, carboidratos e gorduras." },
    },
  };

  const tab = activeTab ?? "inicio";
  const entry = help[tab] ?? help["inicio"];
  return entry[lang] ?? entry["es"];
}

export function MarcelaAssistant({ 
  hasGeneratedRecipes = false, 
  selectedRecipe = null, 
  activeFilters,
  mealType,
  ingredientsCount = 0,
  isLoading = false,
  isSurpriseMode = false,
  isCharacterAnimating = false,
  weeklyCalendar,
  showingYouTubeChannel = false,
  onIngredientAdded,
  onRecipeCooked,
  onFavoriteAdded,
  onHistoryDeleted,
  historyStats,
  activeTab,
  onFiltersChanged,
  onTimeChanged,
  onPantryOpened,
  onFavoritesOpened,
  onShoppingListOpened,
  onCalendarOpened,
  onLoginRequired
}: MarcelaAssistantProps) {
  const storedLang =
    typeof window !== "undefined" ? localStorage.getItem("marcelacocina_language") : null;
  const lang: Language =
    storedLang === "es" || storedLang === "en" || storedLang === "pt" ? storedLang : "es";

  const tLocal = (key: TranslationKey): string => {
    return translations[lang][key] || translations.es[key] || key;
  };

  const format = (template: string, vars: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  };

  // Popover state
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // AI Reactions
  const { currentReaction, isLoading: isAILoading, react, reactInstant } = useMarcelaAI();
  const [displayedReaction, setDisplayedReaction] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<MarcelaMood>('happy');
  const [currentAnimation, setCurrentAnimation] = useState<MarcelaAnimation>('wave');
  const [hasNewReaction, setHasNewReaction] = useState(false);

  const prevIngredientsRef = useRef<string[]>([]);
  const hasInitializedRef = useRef(false);
  const prevLangRef = useRef<Language>(lang);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        fabRef.current && !fabRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        react('app_opened');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // React to AI response changes
  useEffect(() => {
    if (currentReaction) {
      setDisplayedReaction(currentReaction.reaction);
      setCurrentMood(currentReaction.mood);
      setCurrentAnimation(currentReaction.animation);
      setHasNewReaction(true);
    }
  }, [currentReaction]);

  // Clear badge when popover opened
  useEffect(() => {
    if (isOpen) setHasNewReaction(false);
  }, [isOpen]);

  // React to ingredient changes
  useEffect(() => {
    if (!onIngredientAdded) return;
    const prevLength = prevIngredientsRef.current.length;
    const newLength = onIngredientAdded.length;
    if (newLength > prevLength) react('ingredient_added');
    else if (newLength < prevLength) reactInstant('ingredient_removed');
    prevIngredientsRef.current = [...onIngredientAdded];
  }, [onIngredientAdded, react, reactInstant]);

  useEffect(() => { if (onRecipeCooked) react('recipe_cooked'); }, [onRecipeCooked, react]);
  useEffect(() => { if (onFavoriteAdded) react('favorite_added'); }, [onFavoriteAdded, react]);
  useEffect(() => { if (onHistoryDeleted) reactInstant('history_deleted'); }, [onHistoryDeleted, reactInstant]);
  useEffect(() => { if (mealType) react('meal_type_selected'); }, [mealType, react]);
  useEffect(() => { if (isSurpriseMode) react('surprise_clicked'); }, [isSurpriseMode, react]);
  useEffect(() => { if (hasGeneratedRecipes && !selectedRecipe) react('recipe_generated'); }, [hasGeneratedRecipes, selectedRecipe, react]);
  useEffect(() => { if (selectedRecipe) react('recipe_selected'); }, [selectedRecipe, react]);
  useEffect(() => { if (weeklyCalendar?.isActive && !weeklyCalendar.isGeneratingAI) react('calendar_opened'); }, [weeklyCalendar?.isActive, react]);

  const prevTabRef = useRef<string>('');
  const isFirstTabChangeRef = useRef(true);
  useEffect(() => {
    if (activeTab && activeTab !== prevTabRef.current) {
      if (isFirstTabChangeRef.current) {
        isFirstTabChangeRef.current = false;
        prevTabRef.current = activeTab;
        return;
      }
      prevTabRef.current = activeTab;
      react(`tab_${activeTab}`);
    }
  }, [activeTab, react]);

  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      reactInstant(activeTab ? `tab_${activeTab}` : 'idle');
    }
  }, [lang, activeTab, reactInstant]);

  const prevFiltersRef = useRef<string>('');
  useEffect(() => {
    if (onFiltersChanged) {
      const filtersKey = JSON.stringify(onFiltersChanged);
      if (filtersKey !== prevFiltersRef.current && prevFiltersRef.current !== '') react('filter_changed');
      prevFiltersRef.current = filtersKey;
    }
  }, [onFiltersChanged, react]);

  const prevTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (onTimeChanged !== undefined && prevTimeRef.current !== null && onTimeChanged !== prevTimeRef.current) reactInstant('time_changed');
    prevTimeRef.current = onTimeChanged ?? null;
  }, [onTimeChanged, reactInstant]);

  useEffect(() => { if (onPantryOpened) react('pantry_opened'); }, [onPantryOpened, react]);
  useEffect(() => { if (onFavoritesOpened) react('favorites_opened'); }, [onFavoritesOpened, react]);
  useEffect(() => { if (onShoppingListOpened) react('shopping_list_opened'); }, [onShoppingListOpened, react]);
  useEffect(() => { if (onCalendarOpened) react('calendar_opened'); }, [onCalendarOpened, react]);

  // Login required message
  const [loginFeature, setLoginFeature] = useState<string | null>(null);
  const [loginMessageIndex, setLoginMessageIndex] = useState<number | null>(null);
  useEffect(() => {
    if (onLoginRequired) {
      setLoginFeature(onLoginRequired);
      setLoginMessageIndex(Math.floor(Math.random() * 3));
      setCurrentMood('happy');
      setIsOpen(true);
      const timer = window.setTimeout(() => {
        setLoginFeature(null);
        setLoginMessageIndex(null);
        setIsOpen(false);
      }, 8000);
      return () => window.clearTimeout(timer);
    }
  }, [onLoginRequired]);

  const shouldShowSparkles = currentMood === 'excited' || currentMood === 'proud' || currentAnimation === 'sparkle' || currentAnimation === 'celebrate';

  const getMoodEmoji = (mood: MarcelaMood): string => {
    const emojis: Record<MarcelaMood, string> = {
      happy: '😊', excited: '🤩', thinking: '🤔', proud: '🥰', curious: '👀', loving: '💕'
    };
    return emojis[mood] || '😊';
  };

  /** Render popover content */
  const renderPopoverContent = () => {
    // Login required — highest priority
    if (loginMessageIndex !== null) {
      const key: TranslationKey =
        loginMessageIndex === 0 ? "marcelaLoginRequired1"
        : loginMessageIndex === 1 ? "marcelaLoginRequired2"
        : "marcelaLoginRequired3";
      const message = format(tLocal(key), { feature: loginFeature ?? "" });
      return (
        <div className="space-y-2">
          <p className="flex items-start gap-1.5">
            <span>🔐</span>
            <span>{message}</span>
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-1 text-[11px] bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            {tLocal("marcelaCreateAccountCta")} →
          </a>
        </div>
      );
    }

    // AI reaction message
    if (displayedReaction) {
      return (
        <div className="space-y-1.5">
          <p className="flex items-start gap-1.5">
            <span>{getMoodEmoji(currentMood)}</span>
            <span>{displayedReaction}</span>
          </p>
          {/* Contextual help below reaction */}
          {(() => {
            const help = getContextualHelp(activeTab, lang);
            return (
              <div className="pt-1.5 mt-1.5 border-t border-border/30">
                <p className="font-semibold mb-0.5">{help.title}</p>
                <p className="text-muted-foreground">{help.body}</p>
              </div>
            );
          })()}
        </div>
      );
    }

    // Default: contextual help
    const help = getContextualHelp(activeTab, lang);
    return (
      <div className="space-y-1.5">
        <p className="font-semibold">{help.title}</p>
        <p className="text-muted-foreground">{help.body}</p>
      </div>
    );
  };

  return (
    <div className="fixed bottom-[100px] right-[20px] z-[60] flex flex-col items-end gap-2">
      {/* Glassmorphism popover — absolute, above FAB, no DOM displacement */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-[calc(100%+10px)] right-0 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ maxWidth: "65vw", width: "max-content", minWidth: "180px" }}
        >
          <div
            className="relative rounded-xl border border-border/40 shadow-lg overflow-hidden text-[12px] leading-relaxed bg-background/80 dark:bg-card/85"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              padding: "8px 10px",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="pr-4">
              {renderPopoverContent()}
            </div>
            {/* Tail pointing down-right toward the FAB */}
            <div className="absolute -bottom-[5px] right-4 w-2.5 h-2.5 rotate-45 border-r border-b border-border/40 bg-background/80 dark:bg-card/85" />
          </div>
        </div>
      )}

      {/* FAB — single point of access */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-14 h-14 bg-background border border-border/40 text-primary rounded-full shadow-sm flex items-center justify-center hover:scale-105 hover:bg-accent/30 transition-all duration-200 active:scale-95"
        title={tLocal("marcelaShowTitle")}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : shouldShowSparkles || isLoading ? (
          <FuturisticOrb
            size={44}
            isActive={shouldShowSparkles || isCharacterAnimating}
            isThinking={isLoading || currentMood === 'thinking' || isAILoading}
          />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}

        {/* New reaction badge */}
        {hasNewReaction && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
        )}
      </button>
    </div>
  );
}
