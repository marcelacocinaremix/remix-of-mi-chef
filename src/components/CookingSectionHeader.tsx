import { useState, useEffect } from "react";
import { ChefHat, Sparkles, Flame, Heart, Star, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import marcelaCharacter from "@/assets/marcela-character.png";

const floatingEmojis = ["🥕", "🍳", "🧅", "🍅", "🥩", "🧀", "🌶️", "🥬"];
const cookingTips = [
  "¡Hoy cocinamos algo rico!",
  "¿Qué ingredientes tenés?",
  "¡Vamos a crear magia!",
  "¡Cocinar es arte! ✨",
];

export function CookingSectionHeader() {
  const [currentTip, setCurrentTip] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % cookingTips.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-pink-light/20 to-accent/30 border border-primary/20 p-6 mb-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-pink-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-accent/30 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating emojis */}
        {floatingEmojis.map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-float opacity-40"
            style={{
              left: `${5 + i * 12}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.3}s`,
            }}
          >
            {emoji}
          </span>
        ))}
        
        {/* Sparkle effects */}
        <div className="absolute top-4 right-12 animate-sparkle">
          <Star className="w-4 h-4 text-gold fill-gold" />
        </div>
        <div className="absolute bottom-8 right-24 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="absolute top-12 left-20 animate-sparkle" style={{ animationDelay: '1s' }}>
          <Star className="w-3 h-3 text-pink-light fill-pink-light" />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Marcela Character with animated ring */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-pink-light to-accent rounded-full blur-md animate-pulse" style={{ scale: 1.1 }} />
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/80 shadow-xl animate-float" style={{ animationDuration: '4s' }}>
            <img 
              src={marcelaCharacter} 
              alt="Marcela" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Chef hat badge */}
          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-primary to-pink-light rounded-full p-1.5 shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
            <ChefHat className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary via-pink-dark to-accent bg-clip-text text-transparent">
              ¡Cocinemos juntos!
            </h2>
            <Flame className="w-5 h-5 text-orange-500 animate-wiggle" />
          </div>
          
          {/* Animated tip */}
          <p className={cn(
            "text-sm text-muted-foreground transition-all duration-300 flex items-center gap-2",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}>
            <Heart className="w-4 h-4 text-pink-light animate-pulse" />
            <span>{cookingTips[currentTip]}</span>
          </p>
        </div>

        {/* Decorative cooking icon */}
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-accent/50 to-primary/30 border border-primary/20 animate-spin-slow" style={{ animationDuration: '20s' }}>
          <Utensils className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
}