import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Loader2, GripVertical, Lightbulb, Sparkles, Eye } from "lucide-react";
import marcelaImage from "@/assets/marcela-character.png";
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/components/RecipeList";
import { FiltersState } from "@/components/AdvancedFilters";
import { useSound } from "@/hooks/useSound";
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
  // New props for AI reactions
  onIngredientAdded?: string[];
  onRecipeCooked?: string;
  onFavoriteAdded?: string;
  onHistoryDeleted?: boolean;
  historyStats?: { totalRecipes?: number; topIngredients?: string[] };
  // Tab/section navigation reactions
  activeTab?: string;
  onFiltersChanged?: FiltersState;
  onTimeChanged?: number;
  onPantryOpened?: boolean;
  onFavoritesOpened?: boolean;
  onShoppingListOpened?: boolean;
  onCalendarOpened?: boolean;
  onLoginRequired?: string | null;
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

  const [isVisible, setIsVisible] = useState(false);
  const [recipeDescription, setRecipeDescription] = useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  
  // AI Reactions
  const { currentReaction, isLoading: isAILoading, react, reactInstant } = useMarcelaAI();
  const [displayedReaction, setDisplayedReaction] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<MarcelaMood>('happy');
  const [currentAnimation, setCurrentAnimation] = useState<MarcelaAnimation>('wave');
  const [showTip, setShowTip] = useState<string | null>(null);
  
  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  
  // Sound
  const { play: playSound } = useSound();
  const prevMessageKeyRef = useRef<string>('');
  const prevIngredientsRef = useRef<string[]>([]);
  const hasInitializedRef = useRef(false);
  const prevLangRef = useRef<Language>(lang);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Initial greeting with AI
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
      if (currentReaction.tip) {
        setShowTip(currentReaction.tip);
        // Hide tip after 5 seconds
        const timer = setTimeout(() => setShowTip(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentReaction]);

  // React to ingredient changes - more responsive
  useEffect(() => {
    if (!onIngredientAdded) return;
    
    const prevLength = prevIngredientsRef.current.length;
    const newLength = onIngredientAdded.length;
    
    if (newLength > prevLength) {
      // New ingredient added
      react('ingredient_added');
    } else if (newLength < prevLength) {
      // Ingredient removed
      reactInstant('ingredient_removed');
    }
    
    prevIngredientsRef.current = [...onIngredientAdded];
  }, [onIngredientAdded, react, reactInstant]);

  // React to recipe cooked
  useEffect(() => {
    if (onRecipeCooked) {
      react('recipe_cooked');
    }
  }, [onRecipeCooked, react]);

  // React to favorite added
  useEffect(() => {
    if (onFavoriteAdded) {
      react('favorite_added');
    }
  }, [onFavoriteAdded, react]);

  // React to history deleted
  useEffect(() => {
    if (onHistoryDeleted) {
      reactInstant('history_deleted');
    }
  }, [onHistoryDeleted, reactInstant]);

  // React to meal type selection
  useEffect(() => {
    if (mealType) {
      react('meal_type_selected');
    }
  }, [mealType, react]);

  // React to surprise mode
  useEffect(() => {
    if (isSurpriseMode) {
      react('surprise_clicked');
    }
  }, [isSurpriseMode, react]);

  // React to recipes generated
  useEffect(() => {
    if (hasGeneratedRecipes && !selectedRecipe) {
      react('recipe_generated');
    }
  }, [hasGeneratedRecipes, selectedRecipe, react]);

  // React to recipe selection
  useEffect(() => {
    if (selectedRecipe) {
      react('recipe_selected');
      fetchRecipeDescription(selectedRecipe);
    } else {
      setRecipeDescription(null);
    }
  }, [selectedRecipe, react]);

  // React to weekly calendar
  useEffect(() => {
    if (weeklyCalendar?.isActive && !weeklyCalendar.isGeneratingAI) {
      react('calendar_opened');
    }
  }, [weeklyCalendar?.isActive, react]);

  // React to tab changes - all sections (skip initial load to avoid double message)
  const prevTabRef = useRef<string>('');
  const isFirstTabChangeRef = useRef(true);
  useEffect(() => {
    if (activeTab && activeTab !== prevTabRef.current) {
      // Skip the very first tab change (initial load) to avoid double message with app_opened
      if (isFirstTabChangeRef.current) {
        isFirstTabChangeRef.current = false;
        prevTabRef.current = activeTab;
        return;
      }
      prevTabRef.current = activeTab;
      // Map tab to action
      const tabAction = `tab_${activeTab}`;
      react(tabAction);
    }
  }, [activeTab, react]);

  // React to language changes - re-trigger current section guidance
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      const action = activeTab ? `tab_${activeTab}` : 'idle';
      reactInstant(action);
    }
  }, [lang, activeTab, reactInstant]);

  // React to filters changed
  const prevFiltersRef = useRef<string>('');
  useEffect(() => {
    if (onFiltersChanged) {
      const filtersKey = JSON.stringify(onFiltersChanged);
      if (filtersKey !== prevFiltersRef.current && prevFiltersRef.current !== '') {
        react('filter_changed');
      }
      prevFiltersRef.current = filtersKey;
    }
  }, [onFiltersChanged, react]);

  // React to time changed
  const prevTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (onTimeChanged !== undefined && prevTimeRef.current !== null && onTimeChanged !== prevTimeRef.current) {
      reactInstant('time_changed');
    }
    prevTimeRef.current = onTimeChanged ?? null;
  }, [onTimeChanged, reactInstant]);

  // React to pantry opened
  useEffect(() => {
    if (onPantryOpened) {
      react('pantry_opened');
    }
  }, [onPantryOpened, react]);

  // React to favorites opened
  useEffect(() => {
    if (onFavoritesOpened) {
      react('favorites_opened');
    }
  }, [onFavoritesOpened, react]);

  // React to shopping list opened
  useEffect(() => {
    if (onShoppingListOpened) {
      react('shopping_list_opened');
    }
  }, [onShoppingListOpened, react]);

  // React to calendar opened via button
  useEffect(() => {
    if (onCalendarOpened) {
      react('calendar_opened');
    }
  }, [onCalendarOpened, react]);

  // React to login required - show friendly message
  const [loginFeature, setLoginFeature] = useState<string | null>(null);
  const [loginMessageIndex, setLoginMessageIndex] = useState<number | null>(null);
  useEffect(() => {
    if (onLoginRequired) {
      setLoginFeature(onLoginRequired);
      setLoginMessageIndex(Math.floor(Math.random() * 3));
      setCurrentMood('happy');
      setCurrentAnimation('wave');

      const timer = window.setTimeout(() => {
        setLoginFeature(null);
        setLoginMessageIndex(null);
      }, 8000);

      return () => window.clearTimeout(timer);
    }
  }, [onLoginRequired]);

  // Generate a key to detect message changes for sound
  const getMessageKey = () => {
    if (showingYouTubeChannel) return 'youtube';
    if (weeklyCalendar?.isGeneratingAI) return 'calendar-generating';
    if (weeklyCalendar?.isActive) return `calendar-${weeklyCalendar.mealsPlanned}`;
    if (isSurpriseMode) return 'surprise-loading';
    if (selectedRecipe) return `recipe-${selectedRecipe.name}`;
    if (isLoading) return 'loading';
    if (hasGeneratedRecipes) return 'recipes-generated';
    if (mealType) return `mealtype-${mealType}`;
    if (ingredientsCount > 0) return `ingredients-${ingredientsCount}`;
    return 'welcome';
  };

  // Handle drag with refs for better performance
  const positionRef = useRef({ x: 0, y: 0 });
  
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    hasDragged.current = false;
    dragStartPos.current = { x: clientX, y: clientY };
    initialPos.current = { x: positionRef.current.x, y: positionRef.current.y };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;
    
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasDragged.current = true;
    }
    
    const newPos = {
      x: initialPos.current.x + deltaX,
      y: initialPos.current.y + deltaY
    };
    positionRef.current = newPos;
    setPosition(newPos);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };
    const handleMouseUp = () => handleDragEnd();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const fetchRecipeDescription = async (recipe: Recipe) => {
    setIsLoadingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('describe-recipe', {
        body: {
          recipeName: recipe.name,
          recipeIngredients: recipe.ingredients,
          recipeTime: recipe.time,
          recipeDifficulty: recipe.difficulty,
        }
      });

      if (error) throw error;
      setRecipeDescription(data.description);
    } catch (error) {
      console.error('Error fetching description:', error);
      setRecipeDescription(null);
    } finally {
      setIsLoadingDescription(false);
    }
  };

  const [isHidden, setIsHidden] = useState(false);
  const hasDragged = useRef(false);

  const handleHide = () => {
    setIsHidden(true);
  };

  const handleCharacterClick = () => {
    if (hasDragged.current) return;
    playSound('pop');
  };

  const getMoodEmoji = (mood: MarcelaMood): string => {
    const emojis: Record<MarcelaMood, string> = {
      happy: '😊',
      excited: '🤩',
      thinking: '🤔',
      proud: '🥰',
      curious: '👀',
      loving: '💕'
    };
    return emojis[mood] || '😊';
  };

  const getAnimationClass = (animation: MarcelaAnimation): string => {
    const animations: Record<MarcelaAnimation, string> = {
      wave: 'animate-float',
      bounce: 'animate-bounce',
      sparkle: 'animate-pulse',
      nod: 'animate-[wiggle_0.5s_ease-in-out]',
      celebrate: 'animate-bounce',
      think: 'animate-[tilt_2s_ease-in-out_infinite]'
    };
    return animations[animation] || 'animate-float';
  };

  const renderMessage = () => {
    // Login required message - highest priority
    if (loginMessageIndex !== null) {
      const key: TranslationKey =
        loginMessageIndex === 0
          ? "marcelaLoginRequired1"
          : loginMessageIndex === 1
            ? "marcelaLoginRequired2"
            : "marcelaLoginRequired3";

      const message = format(tLocal(key), { feature: loginFeature ?? "" });

      return (
        <div className="space-y-3">
          <p className="text-foreground font-medium text-sm leading-relaxed flex items-start gap-2">
            <span className="text-lg">🔐</span>
            <span>{message}</span>
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            {tLocal("marcelaCreateAccountCta")} →
          </a>
        </div>
      );
    }

    // If we have an AI reaction, show it
    if (displayedReaction && !isLoading && !isSurpriseMode) {
      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed flex items-start gap-2">
            <span className="text-lg">{getMoodEmoji(currentMood)}</span>
            <span>{displayedReaction}</span>
          </p>
          {showTip && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg animate-fade-in">
              <Lightbulb className="w-3 h-3 flex-shrink-0" />
              <span>{showTip}</span>
            </div>
          )}
          {isAILoading && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}
        </div>
      );
    }

    // YouTube Channel section
    if (showingYouTubeChannel) {
      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed">{tLocal("marcelaYoutubeTitle")}</p>
          <p className="text-muted-foreground text-xs">{tLocal("marcelaYoutubeSubtitle")}</p>
        </div>
      );
    }

    // Weekly Calendar - AI generating
    if (weeklyCalendar?.isGeneratingAI) {
      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {tLocal("marcelaWeeklyGeneratingTitle")}
          </p>
          <p className="text-muted-foreground text-xs">{tLocal("marcelaWeeklyGeneratingSubtitle")}</p>
        </div>
      );
    }

    // Surprise mode loading
    if (isSurpriseMode) {
      const surpriseMessages = [
        tLocal("marcelaSurpriseLoading1"),
        tLocal("marcelaSurpriseLoading2"),
        tLocal("marcelaSurpriseLoading3"),
        tLocal("marcelaSurpriseLoading4"),
      ];
      const randomMessage = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];

      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {randomMessage}
          </p>
          <p className="text-muted-foreground text-xs animate-pulse">{tLocal("marcelaSurpriseLoadingSubtitle")}</p>
        </div>
      );
    }

    // Selected recipe with description
    if (selectedRecipe) {
      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed">
            {isLoadingDescription ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {tLocal("marcelaAnalyzing")}
              </span>
            ) : (
              recipeDescription || displayedReaction || tLocal("marcelaDeliciousOption")
            )}
          </p>
          <p className="text-muted-foreground text-xs">👩‍🍳 {selectedRecipe.name}</p>
        </div>
      );
    }

    // Loading recipes - Marcela shows rotating messages
    if (isLoading) {
      const loadingMessages = [
        { emoji: "🔍", text: tLocal("marcelaLoadingRecipes1") },
        { emoji: "🍳", text: tLocal("marcelaLoadingRecipes2") },
        { emoji: "✨", text: tLocal("marcelaLoadingRecipes3") },
        { emoji: "🥘", text: tLocal("marcelaLoadingRecipes4") },
        { emoji: "💡", text: tLocal("marcelaLoadingRecipes5") },
      ];
      const randomMsg = loadingMessages[Math.floor(Date.now() / 2000) % loadingMessages.length];

      return (
        <div className="space-y-2">
          <p className="text-foreground font-medium text-sm leading-relaxed flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {randomMsg.emoji} {randomMsg.text}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">{tLocal("marcelaLoadingRecipesSubtitle")}</p>
        </div>
      );
    }

    // Default welcome message
    return (
      <div className="space-y-2">
        <p className="text-foreground font-medium text-sm leading-relaxed">{tLocal("marcelaDefaultTitle")}</p>
        <p className="text-muted-foreground text-xs">{tLocal("marcelaDefaultSubtitle")}</p>
      </div>
    );
  };

  const shouldShowSparkles = currentMood === 'excited' || currentMood === 'proud' || currentAnimation === 'sparkle' || currentAnimation === 'celebrate';

  // Show button when hidden
  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="fixed bottom-6 right-4 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 animate-fade-in"
        title={tLocal("marcelaShowTitle")}
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 flex items-end gap-3 ${
        isDragging ? "cursor-grabbing" : "transition-opacity duration-300"
      } ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        bottom: `${24 - position.y}px`,
        right: `${-8 - position.x}px`,
        touchAction: 'none',
        willChange: isDragging ? 'bottom, right' : 'auto'
      }}
    >
      {/* Drag handle */}
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-10 bg-muted/80 rounded-l-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Dialog bubble */}
      <div className={`relative bg-card border border-border rounded-2xl shadow-xl p-4 max-w-[280px] animate-scale-in ${
        currentMood === 'excited' ? 'ring-2 ring-primary/30' : ''
      }`}>
        {/* Close/Hide button */}
        <button
          onClick={handleHide}
          className="absolute -top-2 -right-2 w-6 h-6 bg-muted rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title={tLocal("marcelaHideTitle")}
        >
          <X className="w-3 h-3" />
        </button>

        {/* Speech bubble tail */}
        <div className="absolute -right-2 bottom-6 w-4 h-4 bg-card border-r border-b border-border transform rotate-[-45deg]" />

        {renderMessage()}
      </div>

      {/* Marcela character */}
      <div 
        className="relative flex-shrink-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCharacterClick}
      >
        <div className={`w-32 h-36 md:w-40 md:h-44 ${isDragging ? '' : (isSurpriseMode || isCharacterAnimating) ? 'animate-bounce' : getAnimationClass(currentAnimation)}`}>
          <img
            src={marcelaImage}
            alt={tLocal("marcelaAlt")}
            className={`w-full h-full object-contain drop-shadow-lg ${(isSurpriseMode || isCharacterAnimating || shouldShowSparkles) ? 'animate-pulse' : ''}`}
          />
          
          {/* Sparkle effects */}
          {shouldShowSparkles && (
            <>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="absolute -top-1 -left-1 animate-bounce" style={{ animationDelay: '200ms' }}>
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
            </>
          )}
          
          {/* Thinking indicator */}
          {currentMood === 'thinking' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          
          {/* Love hearts */}
          {currentMood === 'loving' && (
            <div className="absolute -top-2 right-0 text-red-500 animate-bounce">
              💕
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
