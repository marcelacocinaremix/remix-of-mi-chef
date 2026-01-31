import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Sparkles, ChefHat, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarcelaReactiveTipsProps {
  ingredients: string[];
  lastAddedIngredient?: string;
}

interface Tip {
  trigger: string[];
  message: string;
  emoji: string;
  type: "pairing" | "technique" | "fun" | "health";
}

const INGREDIENT_TIPS: Tip[] = [
  { trigger: ["tomate"], message: "¡Un toque de sal realza el sabor del tomate!", emoji: "🍅", type: "technique" },
  { trigger: ["cebolla"], message: "Caramelizala a fuego lento para un sabor dulce increíble", emoji: "🧅", type: "technique" },
  { trigger: ["ajo"], message: "El ajo picado libera más sabor que en rodajas", emoji: "🧄", type: "technique" },
  { trigger: ["limón"], message: "Unas gotas de limón levantan cualquier plato", emoji: "🍋", type: "technique" },
  { trigger: ["huevo"], message: "Para huevos cremosos, cocinálos a fuego bajo", emoji: "🥚", type: "technique" },
  { trigger: ["queso"], message: "¡El queso gratinado es magia pura!", emoji: "🧀", type: "fun" },
  { trigger: ["pollo"], message: "Marinalo 30 min para un sabor espectacular", emoji: "🍗", type: "technique" },
  { trigger: ["pasta"], message: "Guardá un poco del agua de cocción para la salsa", emoji: "🍝", type: "technique" },
  { trigger: ["arroz"], message: "No lo revuelvas mientras se cocina para que quede suelto", emoji: "🍚", type: "technique" },
  { trigger: ["espinaca"], message: "¡Rica en hierro! Perfecta con un toque de limón", emoji: "🥬", type: "health" },
  
  // Pairings
  { trigger: ["tomate", "albahaca"], message: "¡Combo italiano clásico! Agregá un poco de aceite de oliva", emoji: "🇮🇹", type: "pairing" },
  { trigger: ["limón", "pescado"], message: "¡Perfecta combinación! El ácido realza el pescado", emoji: "🐟", type: "pairing" },
  { trigger: ["ajo", "mantequilla"], message: "¡Uff! Esa combinación es irresistible", emoji: "🤤", type: "pairing" },
  { trigger: ["chocolate", "frutilla"], message: "¡Postre romántico asegurado!", emoji: "💕", type: "pairing" },
  { trigger: ["aguacate", "limón"], message: "El limón evita que se oxide y suma frescura", emoji: "🥑", type: "pairing" },
  { trigger: ["carne", "cebolla"], message: "¡Base perfecta para un estofado!", emoji: "🍖", type: "pairing" },
  { trigger: ["huevo", "queso"], message: "Clásico desayuno que nunca falla", emoji: "🍳", type: "pairing" },
  { trigger: ["pollo", "limón"], message: "Pollo al limón: simple y delicioso", emoji: "🍗", type: "pairing" },
  
  // Fun facts
  { trigger: ["zanahoria"], message: "¿Sabías que mejora la vista? ¡Y el color de tus platos!", emoji: "🥕", type: "fun" },
  { trigger: ["banana"], message: "¡Energía instantánea para el día!", emoji: "🍌", type: "health" },
  { trigger: ["miel"], message: "Endulzante natural que nunca caduca", emoji: "🍯", type: "fun" },
];

const COMPATIBILITY_MESSAGES = [
  { min: 0, max: 2, message: "Agregá más ingredientes para ver la magia", emoji: "🔮" },
  { min: 3, max: 4, message: "¡Buen comienzo! Hay potencial aquí", emoji: "✨" },
  { min: 5, max: 6, message: "¡Excelente variedad! Muchas opciones", emoji: "🌟" },
  { min: 7, max: 10, message: "¡Wow! Podemos hacer un festín", emoji: "🎉" },
  { min: 11, max: 100, message: "¡Tenés un supermercado ahí!", emoji: "🛒" },
];

export function MarcelaReactiveTips({ ingredients, lastAddedIngredient }: MarcelaReactiveTipsProps) {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [showTip, setShowTip] = useState(false);

  // Find matching tips based on current ingredients
  const matchingTips = useMemo(() => {
    return INGREDIENT_TIPS.filter(tip => 
      tip.trigger.every(t => 
        ingredients.some(ing => ing.toLowerCase().includes(t.toLowerCase()))
      )
    ).sort((a, b) => b.trigger.length - a.trigger.length); // Prioritize more specific matches
  }, [ingredients]);

  // Show tip when ingredient is added
  useEffect(() => {
    if (lastAddedIngredient && ingredients.length > 0) {
      const relevantTip = matchingTips.find(tip => 
        tip.trigger.some(t => lastAddedIngredient.toLowerCase().includes(t.toLowerCase()))
      );
      
      if (relevantTip) {
        setCurrentTip(relevantTip);
        setShowTip(true);
        
        const timer = setTimeout(() => setShowTip(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastAddedIngredient, matchingTips, ingredients.length]);

  // Get compatibility message
  const compatibilityMessage = COMPATIBILITY_MESSAGES.find(
    c => ingredients.length >= c.min && ingredients.length <= c.max
  );

  // Calculate a "compatibility score" based on matching pairing tips
  const pairingScore = useMemo(() => {
    const pairingTips = matchingTips.filter(t => t.type === "pairing");
    const maxScore = 5;
    return Math.min(pairingTips.length * 2, maxScore);
  }, [matchingTips]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pairing": return "bg-pink-500/20 text-pink-600 border-pink-500/30";
      case "technique": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "health": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "fun": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      default: return "";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "pairing": return "Combinación";
      case "technique": return "Técnica";
      case "health": return "Salud";
      case "fun": return "Dato";
      default: return "";
    }
  };

  if (ingredients.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Reactive Tip */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500",
          showTip && currentTip ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {currentTip && (
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/10 animate-fade-in">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl shrink-0">
                  {currentTip.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <Badge className={cn("text-[10px]", getTypeColor(currentTip.type))}>
                      {getTypeLabel(currentTip.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{currentTip.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Compatibility Score */}
      {ingredients.length >= 2 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart 
                key={i} 
                className={cn(
                  "w-4 h-4 transition-all duration-300",
                  i < pairingScore 
                    ? "text-pink-500 fill-pink-500" 
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">
              Compatibilidad de ingredientes
            </p>
            <p className="text-[10px] text-muted-foreground">
              {pairingScore >= 4 
                ? "¡Combinaciones perfectas!" 
                : pairingScore >= 2 
                  ? "Buenos ingredientes juntos" 
                  : "Probá agregar ingredientes complementarios"}
            </p>
          </div>
          <span className="text-xl">{compatibilityMessage?.emoji}</span>
        </div>
      )}

      {/* Active Pairings Preview */}
      {matchingTips.filter(t => t.type === "pairing").length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchingTips
            .filter(t => t.type === "pairing")
            .slice(0, 3)
            .map((tip, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-[10px] gap-1 bg-pink-500/10 border-pink-500/30 text-pink-600"
              >
                <Star className="w-2.5 h-2.5" />
                {tip.trigger.join(" + ")}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
