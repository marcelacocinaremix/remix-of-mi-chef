import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dices, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

const WHEEL_INGREDIENTS = [
  "🍅 Tomate", "🥚 Huevo", "🧀 Queso", "🍗 Pollo", 
  "🥔 Papa", "🧅 Cebolla", "🥕 Zanahoria", "🌶️ Pimiento",
  "🥬 Lechuga", "🍚 Arroz", "🍝 Pasta", "🥩 Carne",
  "🐟 Pescado", "🥛 Leche", "🍞 Pan", "🍋 Limón"
];

interface IngredientWheelProps {
  open: boolean;
  onClose: () => void;
  onIngredientSelected: (ingredient: string) => void;
  currentIngredients: string[];
}

export function IngredientWheel({ open, onClose, onIngredientSelected, currentIngredients }: IngredientWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { play: playSound } = useSound();
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    
    playSound('pop');
    setIsSpinning(true);
    setShowResult(false);
    setSelectedIndex(null);

    // Random spins (3-5 full rotations + random position)
    const spins = 3 + Math.random() * 2;
    const randomAngle = Math.random() * 360;
    const newRotation = rotation + (spins * 360) + randomAngle;
    
    setRotation(newRotation);

    // Calculate which ingredient is selected
    const segmentAngle = 360 / WHEEL_INGREDIENTS.length;
    const normalizedAngle = newRotation % 360;
    const index = Math.floor((360 - normalizedAngle + segmentAngle / 2) / segmentAngle) % WHEEL_INGREDIENTS.length;

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedIndex(index);
      setShowResult(true);
      playSound('magic');
    }, 3000);
  };

  const handleAddIngredient = () => {
    if (selectedIndex !== null) {
      const ingredient = WHEEL_INGREDIENTS[selectedIndex].split(" ")[1].toLowerCase();
      onIngredientSelected(ingredient);
      playSound('pop');
      setShowResult(false);
      setSelectedIndex(null);
    }
  };

  const resetWheel = () => {
    setRotation(0);
    setSelectedIndex(null);
    setShowResult(false);
  };

  const segmentAngle = 360 / WHEEL_INGREDIENTS.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dices className="w-6 h-6 text-primary" />
            Ruleta de Ingredientes
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-6">
          {/* Wheel Container */}
          <div className="relative w-64 h-64">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-primary drop-shadow-lg" />
            </div>
            
            {/* Wheel */}
            <div
              ref={wheelRef}
              className={cn(
                "w-64 h-64 rounded-full relative border-4 border-primary shadow-xl overflow-hidden",
                isSpinning && "transition-transform duration-[3000ms] ease-out"
              )}
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
              }}
            >
              {WHEEL_INGREDIENTS.map((ingredient, index) => {
                const startAngle = index * segmentAngle;
                const isSelected = selectedIndex === index && showResult;
                
                return (
                  <div
                    key={ingredient}
                    className={cn(
                      "absolute w-full h-full flex items-center justify-end pr-2 text-xs font-medium",
                      index % 2 === 0 ? "bg-primary/20" : "bg-secondary/40",
                      isSelected && "bg-primary/50"
                    )}
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      clipPath: `polygon(50% 50%, 100% 0, 100% ${100 / WHEEL_INGREDIENTS.length * 2}%)`
                    }}
                  >
                    <span 
                      className="absolute text-[10px] whitespace-nowrap"
                      style={{
                        transform: `rotate(${segmentAngle / 2}deg) translateX(-20px)`,
                        transformOrigin: 'left center'
                      }}
                    >
                      {ingredient.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
              
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-4 border-primary shadow-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Result Display */}
          {showResult && selectedIndex !== null && (
            <div className="text-center space-y-3 animate-fade-in">
              <div className="text-4xl animate-bounce">
                {WHEEL_INGREDIENTS[selectedIndex].split(" ")[0]}
              </div>
              <p className="text-lg font-semibold text-foreground">
                ¡{WHEEL_INGREDIENTS[selectedIndex].split(" ")[1]}!
              </p>
              {currentIngredients.includes(WHEEL_INGREDIENTS[selectedIndex].split(" ")[1].toLowerCase()) ? (
                <p className="text-sm text-muted-foreground">Ya tenés este ingrediente</p>
              ) : (
                <Button onClick={handleAddIngredient} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Agregar ingrediente
                </Button>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              size="lg"
              className={cn(
                "gap-2 bg-gradient-to-r from-primary to-primary/80",
                isSpinning && "animate-pulse"
              )}
            >
              <Dices className={cn("w-5 h-5", isSpinning && "animate-spin")} />
              {isSpinning ? "Girando..." : "¡Girar!"}
            </Button>
            
            <Button
              onClick={resetWheel}
              variant="outline"
              size="lg"
              disabled={isSpinning}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ¡Girá la ruleta para obtener ingredientes al azar!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
