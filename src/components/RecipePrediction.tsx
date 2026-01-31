import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChefHat, Clock, Star, TrendingUp, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recipe } from "@/components/RecipeList";

interface RecipePredictionProps {
  ingredients: string[];
  onSelectRecipe?: (recipe: Recipe) => void;
}

interface PredictedRecipe {
  name: string;
  emoji: string;
  requiredIngredients: string[];
  optionalIngredients: string[];
  difficulty: "fácil" | "medio" | "difícil";
  time: number;
  matchScore: number;
}

const RECIPE_DATABASE: Omit<PredictedRecipe, "matchScore">[] = [
  {
    name: "Huevos Revueltos",
    emoji: "🍳",
    requiredIngredients: ["huevo"],
    optionalIngredients: ["mantequilla", "queso", "sal"],
    difficulty: "fácil",
    time: 5
  },
  {
    name: "Tostadas Francesas",
    emoji: "🍞",
    requiredIngredients: ["pan", "huevo", "leche"],
    optionalIngredients: ["canela", "azúcar", "miel"],
    difficulty: "fácil",
    time: 15
  },
  {
    name: "Pasta con Tomate",
    emoji: "🍝",
    requiredIngredients: ["pasta", "tomate"],
    optionalIngredients: ["ajo", "albahaca", "aceite de oliva", "queso"],
    difficulty: "fácil",
    time: 20
  },
  {
    name: "Ensalada César",
    emoji: "🥗",
    requiredIngredients: ["lechuga", "pollo"],
    optionalIngredients: ["queso parmesano", "pan", "ajo"],
    difficulty: "fácil",
    time: 15
  },
  {
    name: "Arroz con Pollo",
    emoji: "🍗",
    requiredIngredients: ["arroz", "pollo"],
    optionalIngredients: ["cebolla", "pimiento", "ajo", "zanahoria"],
    difficulty: "medio",
    time: 35
  },
  {
    name: "Omelette de Queso",
    emoji: "🧀",
    requiredIngredients: ["huevo", "queso"],
    optionalIngredients: ["jamón", "mantequilla", "cebolla"],
    difficulty: "fácil",
    time: 10
  },
  {
    name: "Sopa de Verduras",
    emoji: "🍲",
    requiredIngredients: ["zanahoria", "papa"],
    optionalIngredients: ["cebolla", "apio", "caldo"],
    difficulty: "fácil",
    time: 30
  },
  {
    name: "Tacos Caseros",
    emoji: "🌮",
    requiredIngredients: ["carne", "tortilla"],
    optionalIngredients: ["cebolla", "cilantro", "limón", "aguacate"],
    difficulty: "medio",
    time: 25
  },
  {
    name: "Guacamole",
    emoji: "🥑",
    requiredIngredients: ["aguacate", "limón"],
    optionalIngredients: ["tomate", "cebolla", "cilantro", "ajo"],
    difficulty: "fácil",
    time: 10
  },
  {
    name: "Pescado al Limón",
    emoji: "🐟",
    requiredIngredients: ["pescado", "limón"],
    optionalIngredients: ["ajo", "mantequilla", "perejil"],
    difficulty: "medio",
    time: 20
  },
  {
    name: "Milanesas",
    emoji: "🥩",
    requiredIngredients: ["carne", "pan rallado", "huevo"],
    optionalIngredients: ["ajo", "perejil"],
    difficulty: "medio",
    time: 30
  },
  {
    name: "Pizza Casera",
    emoji: "🍕",
    requiredIngredients: ["harina", "tomate", "queso"],
    optionalIngredients: ["aceite de oliva", "albahaca", "jamón"],
    difficulty: "difícil",
    time: 45
  },
  {
    name: "Banana Split",
    emoji: "🍌",
    requiredIngredients: ["banana", "helado"],
    optionalIngredients: ["chocolate", "crema", "frutilla"],
    difficulty: "fácil",
    time: 5
  },
  {
    name: "Salteado de Verduras",
    emoji: "🥦",
    requiredIngredients: ["brócoli", "zanahoria"],
    optionalIngredients: ["ajo", "salsa de soja", "jengibre"],
    difficulty: "fácil",
    time: 15
  }
];

export function RecipePrediction({ ingredients, onSelectRecipe }: RecipePredictionProps) {
  const [showAll, setShowAll] = useState(false);

  // Calculate match scores for all recipes
  const predictedRecipes = useMemo(() => {
    if (ingredients.length === 0) return [];

    return RECIPE_DATABASE.map(recipe => {
      const lowerIngredients = ingredients.map(i => i.toLowerCase());
      
      // Count required ingredients matched
      const requiredMatched = recipe.requiredIngredients.filter(req =>
        lowerIngredients.some(ing => ing.includes(req) || req.includes(ing))
      ).length;
      
      // Count optional ingredients matched
      const optionalMatched = recipe.optionalIngredients.filter(opt =>
        lowerIngredients.some(ing => ing.includes(opt) || opt.includes(ing))
      ).length;
      
      // Calculate score (required are worth more)
      const requiredScore = (requiredMatched / recipe.requiredIngredients.length) * 70;
      const optionalScore = recipe.optionalIngredients.length > 0 
        ? (optionalMatched / recipe.optionalIngredients.length) * 30 
        : 30;
      
      const matchScore = requiredScore + optionalScore;

      return {
        ...recipe,
        matchScore: Math.round(matchScore)
      };
    })
    .filter(r => r.matchScore >= 35) // Only show recipes with at least 35% match
    .sort((a, b) => b.matchScore - a.matchScore);
  }, [ingredients]);

  const displayedRecipes = showAll ? predictedRecipes : predictedRecipes.slice(0, 4);

  if (ingredients.length < 1 || predictedRecipes.length === 0) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "medio": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "difícil": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Recetas que podés hacer
          <Badge variant="outline" className="ml-auto text-[10px]">
            {predictedRecipes.length} opciones
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {displayedRecipes.map((recipe, index) => (
              <div
                key={recipe.name}
                className={cn(
                  "flex flex-col p-3 rounded-xl border-2 min-w-[140px] transition-all duration-200",
                  "bg-card hover:bg-secondary/30",
                  recipe.matchScore >= 80 
                    ? "border-green-500/50" 
                    : recipe.matchScore >= 60 
                      ? "border-amber-500/50" 
                      : "border-border",
                  index === 0 && recipe.matchScore >= 80 && "ring-2 ring-green-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{recipe.emoji}</span>
                  <div className={cn("text-sm font-bold", getScoreColor(recipe.matchScore))}>
                    {recipe.matchScore}%
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-1 line-clamp-2">{recipe.name}</h4>
                
                <div className="flex items-center gap-1.5 mt-auto">
                  <Badge className={cn("text-[9px] py-0", getDifficultyColor(recipe.difficulty))}>
                    {recipe.difficulty}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {recipe.time}'
                  </span>
                </div>

                {recipe.matchScore >= 100 && (
                  <Badge className="mt-2 text-[9px] bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    ¡Tenés todo!
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {predictedRecipes.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            {showAll ? "Ver menos" : `Ver ${predictedRecipes.length - 4} más`}
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Las recetas se actualizan según los ingredientes que agregás
        </p>
      </CardContent>
    </Card>
  );
}
