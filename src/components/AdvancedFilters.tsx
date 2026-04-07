import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, X, Filter, Users, Thermometer, Lock, Crown, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FiltersState {
  difficulty: string | null;
  diet: string[];
  excludeIngredients: string[];
  servings: number | null;
  cookingMethod: string | null;
  budget: string | null;
  maxTime: number | null;
  forFreezing?: boolean;
}

interface AdvancedFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  disabled?: boolean;
  onUpgradeClick?: () => void;
}

const servingsOptions = [1, 2, 4, 6, 8];

export function AdvancedFilters({ filters, onChange, disabled = false, onUpgradeClick }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [excludeInput, setExcludeInput] = useState("");
  const { t } = useLanguage();

  const difficultyOptions = [
    { id: "facil", label: t('easy'), description: t('beginner') },
    { id: "medio", label: t('medium'), description: t('intermediate') },
    { id: "dificil", label: t('hard'), description: t('advanced') },
  ];

  const cookingMethodOptions = [
    { id: "horno", label: t('oven'), emoji: "🔥" },
    { id: "sarten", label: t('pan'), emoji: "🍳" },
    { id: "olla", label: t('pot'), emoji: "🍲" },
    { id: "airfryer", label: t('airfryer'), emoji: "💨" },
    { id: "sin-coccion", label: t('noCooking'), emoji: "🥗" },
    { id: "microondas", label: t('microwave'), emoji: "📡" },
  ];

  const handleToggleExpand = () => {
    if (disabled) {
      onUpgradeClick?.();
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleDifficultyChange = (difficulty: string) => {
    onChange({ ...filters, difficulty: filters.difficulty === difficulty ? null : difficulty });
  };

  const handleServingsChange = (servings: number) => {
    onChange({ ...filters, servings: filters.servings === servings ? null : servings });
  };

  const handleCookingMethodChange = (method: string) => {
    onChange({ ...filters, cookingMethod: filters.cookingMethod === method ? null : method });
  };

  const handleAddExclude = () => {
    const trimmed = excludeInput.trim().toLowerCase();
    if (trimmed && !filters.excludeIngredients.includes(trimmed)) {
      onChange({ ...filters, excludeIngredients: [...filters.excludeIngredients, trimmed] });
      setExcludeInput("");
    }
  };

  const handleRemoveExclude = (ingredient: string) => {
    onChange({ ...filters, excludeIngredients: filters.excludeIngredients.filter((i) => i !== ingredient) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExclude();
    }
  };

  const activeFiltersCount =
    (filters.difficulty ? 1 : 0) +
    filters.excludeIngredients.length +
    (filters.servings ? 1 : 0) +
    (filters.cookingMethod ? 1 : 0) +
    (filters.forFreezing ? 1 : 0);

  const clearAllFilters = () => {
    onChange({
      ...filters,
      difficulty: null,
      excludeIngredients: [],
      servings: null,
      cookingMethod: null,
      budget: null,
      maxTime: null,
      forFreezing: false,
    });
  };

  return (
    <div className="animate-slide-up">
      <button
        onClick={handleToggleExpand}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl",
          "border-2 transition-all duration-300",
          disabled
            ? "border-amber-300/50 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/30 cursor-pointer"
            : isExpanded
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/50"
        )}
      >
        <div className="flex items-center gap-2">
          <Filter className={cn("w-4 h-4", isExpanded ? "text-primary" : "text-muted-foreground")} />
          <span className="font-medium text-sm">
            {t('advancedFilters')}
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6 p-4 bg-card/50 rounded-xl border border-border">
          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3 mr-1" />
                {t('clearFilters')}
              </Button>
            </div>
          )}

          {/* Servings */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('numberOfPeople')}
            </label>
            <div className="flex flex-wrap gap-2">
              {servingsOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => handleServingsChange(num)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "border-2 transition-all duration-300 font-medium",
                    filters.servings === num
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              {t('cookingType')}
            </label>
            <div className="flex flex-wrap gap-2">
              {cookingMethodOptions.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleCookingMethodChange(method.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full",
                    "border-2 transition-all duration-300 text-sm",
                    filters.cookingMethod === method.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <span>{method.emoji}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              🎯 {t('difficulty')}
            </label>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleDifficultyChange(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg",
                    "border-2 transition-all duration-300 min-w-[90px]",
                    filters.difficulty === option.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exclude ingredients */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              🚫 {t('excludeIngredients')}
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t('excludePlaceholder')}
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleAddExclude} disabled={!excludeInput.trim()}>
                {t('add')}
              </Button>
            </div>
            {filters.excludeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.excludeIngredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="secondary"
                    className="bg-destructive/10 text-destructive gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveExclude(ingredient)}
                  >
                    {ingredient}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
