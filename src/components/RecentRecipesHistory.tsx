import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronDown, ChevronUp, Clock, ChefHat, Flame } from "lucide-react";
import { Recipe } from "@/components/RecipeList";
import { useCookedRecipes } from "@/hooks/useCookedRecipes";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RecentRecipesHistoryProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export function RecentRecipesHistory({ onSelectRecipe }: RecentRecipesHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { cookedRecipes, isLoading } = useCookedRecipes();
  const { t } = useLanguage();

  // Get only the last 10 recipes
  const recentRecipes = cookedRecipes?.slice(0, 10) || [];

  if (isLoading || recentRecipes.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">
                Historial de recetas
              </h3>
              <p className="text-sm text-muted-foreground">
                {recentRecipes.length} recetas generadas recientemente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {recentRecipes.length}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border/50 animate-fade-in">
            <ScrollArea className="max-h-[400px]">
              <div className="p-3 space-y-2">
                {recentRecipes.map((item, index) => {
                  const recipe = item.recipe_data as Recipe;
                  const cookedDate = new Date(item.cooked_at);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectRecipe(recipe)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 overflow-hidden",
                        "bg-background hover:bg-accent/50 border border-transparent hover:border-primary/20",
                        "hover:shadow-md hover:scale-[1.01]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Recipe Number */}
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>

                        {/* Recipe Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate mb-1">
                            {recipe.name}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {recipe.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {recipe.time}
                              </span>
                            )}
                            {recipe.nutrition?.calories && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {recipe.nutrition.calories} kcal
                              </span>
                            )}
                            <span className="text-muted-foreground/60">
                              {format(cookedDate, "dd MMM, HH:mm", { locale: es })}
                            </span>
                          </div>

                          {/* Tags */}
                          {recipe.tags && recipe.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {recipe.tags.slice(0, 3).map((tag, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 bg-secondary/50"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Arrow indicator */}
                        <ChefHat className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
