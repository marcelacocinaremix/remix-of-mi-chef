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
      es: { title: "🍳 Generar recetas", body: "Seguí los pasos: 1️⃣ Agregá hasta 10 ingredientes, 2️⃣ Elegí tipo de comida, 3️⃣ Seleccioná el tiempo, 4️⃣ Filtros avanzados opcionales, 5️⃣ Presioná \"Generar receta\". Tenés 3 recetas gratis por día." },
      en: { title: "🍳 Generate recipes", body: "Follow the steps: 1️⃣ Add up to 10 ingredients, 2️⃣ Choose meal type, 3️⃣ Select time, 4️⃣ Optional advanced filters, 5️⃣ Press \"Generate recipe\". You get 3 free recipes per day." },
      pt: { title: "🍳 Gerar receitas", body: "Siga os passos: 1️⃣ Adicione até 10 ingredientes, 2️⃣ Escolha tipo de refeição, 3️⃣ Selecione tempo, 4️⃣ Filtros avançados opcionais, 5️⃣ Pressione \"Gerar receita\". Você tem 3 receitas grátis por dia." },
    },
    prueba: {
      es: { title: "💡 Trucos del Chef", body: "Buscá cualquier alimento escribiendo o eligiendo de la lista. Seleccioná qué querés saber (conservar, cocinar, tiempos, etc.) y presioná \"Buscar\". ¡Podés guardar tus trucos favoritos! Tenés 2 consultas gratis por día." },
      en: { title: "💡 Chef Tips", body: "Search any food by typing or choosing from the list. Select what you want to know (storage, cooking, times, etc.) and press \"Search\". Save your favorite tips! 2 free queries per day." },
      pt: { title: "💡 Truques do Chef", body: "Busque qualquer alimento digitando ou escolhendo da lista. Selecione o que quer saber (conservação, cozimento, etc.) e pressione \"Buscar\". Salve seus favoritos! 2 consultas grátis por dia." },
    },
    micocina: {
      es: { title: "❤️ Mi Cocina", body: "Tus recetas favoritas guardadas y tu historial de cocina. Tocá cualquier receta para verla completa y volver a cocinarla." },
      en: { title: "❤️ My Kitchen", body: "Your saved favorite recipes and cooking history. Tap any recipe to view it and cook it again." },
      pt: { title: "❤️ Minha Cozinha", body: "Suas receitas favoritas salvas e histórico de culinária. Toque em qualquer receita para vê-la e cozinhá-la novamente." },
    },
    despensa: {
      es: { title: "📦 Despensa", body: "Gestioná los ingredientes que tenés en casa. Agregá items con fecha de vencimiento y usá la despensa para generar recetas con lo que ya tenés." },
      en: { title: "📦 Pantry", body: "Manage ingredients you have at home. Add items with expiration dates and use your pantry to generate recipes with what you already have." },
      pt: { title: "📦 Despensa", body: "Gerencie ingredientes que você tem em casa. Adicione itens com data de validade e use a despensa para gerar receitas com o que já tem." },
    },
    super: {
      es: { title: "🛒 Lista del Súper", body: "Tu lista de compras inteligente. Agregá ingredientes, marcá los que ya compraste y organizalos por categoría." },
      en: { title: "🛒 Shopping List", body: "Your smart shopping list. Add ingredients, check off what you've bought, and organize by category." },
      pt: { title: "🛒 Lista de Compras", body: "Sua lista de compras inteligente. Adicione ingredientes, marque os comprados e organize por categoria." },
    },
    mas: {
      es: { title: "📱 Más", body: "Accedé a funciones adicionales: balance nutricional, actividad física, historial de recetas, juegos de cocina, tips del día, planificador semanal y más." },
      en: { title: "📱 More", body: "Access additional features: nutritional balance, physical activity, recipe history, cooking games, daily tips, weekly planner and more." },
      pt: { title: "📱 Mais", body: "Acesse funcionalidades adicionais: balanço nutricional, atividade física, histórico de receitas, jogos de culinária, dicas do dia, planejador semanal e mais." },
    },
  };

  const tab = activeTab ?? "cocinar";
  const entry = help[tab] ?? help["cocinar"];
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
        className="relative w-14 h-14 bg-transparent text-primary rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 active:scale-95"
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

      </button>
    </div>
  );
}
