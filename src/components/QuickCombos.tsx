import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Zap, ChefHat, Clock, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface QuickCombosProps {
  onSelectCombo: (ingredients: string[]) => void;
  currentIngredients: string[];
}

interface Combo {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  time: number;
  servings: number;
  tags: string[];
}

const QUICK_COMBOS: Combo[] = [
  {
    id: "pasta-clasica",
    name: "Pasta Clásica",
    emoji: "🍝",
    ingredients: ["pasta", "tomate", "ajo", "aceite de oliva", "albahaca"],
    time: 20,
    servings: 2,
    tags: ["italiano", "rápido"]
  },
  {
    id: "omelette",
    name: "Omelette Perfecto",
    emoji: "🍳",
    ingredients: ["huevo", "queso", "jamón", "mantequilla"],
    time: 10,
    servings: 1,
    tags: ["desayuno", "fácil"]
  },
  {
    id: "tacos",
    name: "Tacos Mexicanos",
    emoji: "🌮",
    ingredients: ["carne picada", "tortilla", "cebolla", "cilantro", "limón"],
    time: 25,
    servings: 4,
    tags: ["mexicano", "fiesta"]
  },
  {
    id: "ensalada-caesar",
    name: "Ensalada César",
    emoji: "🥗",
    ingredients: ["lechuga", "pollo", "queso parmesano", "pan", "ajo"],
    time: 15,
    servings: 2,
    tags: ["saludable", "ligero"]
  },
  {
    id: "arroz-con-pollo",
    name: "Arroz con Pollo",
    emoji: "🍗",
    ingredients: ["arroz", "pollo", "cebolla", "pimiento", "ajo"],
    time: 35,
    servings: 4,
    tags: ["casero", "abundante"]
  },
  {
    id: "pizza-casera",
    name: "Pizza Casera",
    emoji: "🍕",
    ingredients: ["harina", "tomate", "mozzarella", "aceite de oliva", "albahaca"],
    time: 40,
    servings: 4,
    tags: ["italiano", "familia"]
  },
  {
    id: "sopa-verduras",
    name: "Sopa de Verduras",
    emoji: "🍲",
    ingredients: ["zanahoria", "papa", "cebolla", "apio", "caldo"],
    time: 30,
    servings: 6,
    tags: ["saludable", "reconfortante"]
  },
  {
    id: "sandwich-gourmet",
    name: "Sándwich Gourmet",
    emoji: "🥪",
    ingredients: ["pan", "jamón", "queso", "lechuga", "tomate", "mayonesa"],
    time: 10,
    servings: 1,
    tags: ["rápido", "almuerzo"]
  },
  {
    id: "stir-fry",
    name: "Salteado Asiático",
    emoji: "🥡",
    ingredients: ["fideos", "pollo", "brócoli", "salsa de soja", "jengibre"],
    time: 20,
    servings: 2,
    tags: ["asiático", "rápido"]
  },
  {
    id: "milanesas",
    name: "Milanesas con Puré",
    emoji: "🥩",
    ingredients: ["carne", "pan rallado", "huevo", "papa", "leche"],
    time: 45,
    servings: 4,
    tags: ["argentino", "clásico"]
  }
];

export function QuickCombos({ onSelectCombo, currentIngredients }: QuickCombosProps) {
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const { play: playSound } = useSound();

  const handleSelectCombo = (combo: Combo) => {
    playSound('pop');
    setSelectedCombo(combo.id);
    
    // Add only ingredients not already present
    const newIngredients = combo.ingredients.filter(
      ing => !currentIngredients.some(curr => curr.toLowerCase() === ing.toLowerCase())
    );
    
    if (newIngredients.length > 0 || currentIngredients.length === 0) {
      onSelectCombo(combo.ingredients);
    }
    
    setTimeout(() => setSelectedCombo(null), 300);
  };

  const getMatchingIngredients = (combo: Combo) => {
    return combo.ingredients.filter(ing => 
      currentIngredients.some(curr => curr.toLowerCase() === ing.toLowerCase())
    ).length;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Zap className="w-5 h-5 text-amber-500 animate-wiggle" />
          <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-md animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Combos Rápidos
        </h3>
        <span className="text-xs text-muted-foreground">
          ¡Un toque para agregar todos los ingredientes!
        </span>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-3">
          {QUICK_COMBOS.map((combo, index) => {
            const matchingCount = getMatchingIngredients(combo);
            const isFullMatch = matchingCount === combo.ingredients.length;
            
            return (
              <button
                key={combo.id}
                onClick={() => handleSelectCombo(combo)}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-300 min-w-[170px] text-left overflow-hidden group",
                  "hover:shadow-lg hover:scale-[1.02] active:scale-95",
                  selectedCombo === combo.id && "scale-95 border-primary",
                  isFullMatch 
                    ? "border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-lg shadow-green-500/10" 
                    : "bg-card border-border hover:border-primary/50"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-accent/5 group-hover:to-pink-light/5 transition-all duration-500" />
                
                <div className="relative z-10 flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-3xl transition-transform duration-300 group-hover:scale-110",
                    selectedCombo === combo.id && "animate-bounce"
                  )} style={{ animationDuration: '0.5s' }}>
                    {combo.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {combo.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {combo.time}'
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-3 h-3" />
                        {combo.servings}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-wrap gap-1 mb-2">
                  {combo.tags.map((tag, tagIndex) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className={cn(
                        "text-[9px] py-0 px-1.5 transition-all duration-300",
                        "group-hover:border-primary/30 group-hover:bg-primary/5"
                      )}
                      style={{ animationDelay: `${tagIndex * 0.1}s` }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {matchingCount > 0 && (
                  <div className="relative z-10 w-full animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Ingredientes</span>
                      <span className={cn(
                        "font-bold",
                        isFullMatch ? "text-green-600" : "text-amber-600"
                      )}>
                        {matchingCount}/{combo.ingredients.length} ✓
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isFullMatch 
                            ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/30" 
                            : "bg-gradient-to-r from-amber-500 to-orange-400 shadow-lg shadow-amber-500/30"
                        )}
                        style={{ width: `${(matchingCount / combo.ingredients.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sparkle effect on hover */}
                <Sparkles className={cn(
                  "absolute top-2 right-2 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300",
                  "animate-sparkle"
                )} />
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
