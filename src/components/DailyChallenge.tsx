import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Clock, ChefHat, Sparkles, Check, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface DailyChallengeProps {
  onAcceptChallenge: (ingredients: string[]) => void;
  currentIngredients: string[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  difficulty: "fácil" | "medio" | "difícil";
  xp: number;
  timeLimit?: number;
  emoji: string;
}

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: "italiano",
    title: "Sabor Italiano",
    description: "Preparar algo con ingredientes de la cocina italiana",
    ingredients: ["tomate", "albahaca", "queso", "pasta"],
    difficulty: "fácil",
    xp: 50,
    emoji: "🇮🇹"
  },
  {
    id: "mexicano",
    title: "Fiesta Mexicana",
    description: "¡Picante y sabroso!",
    ingredients: ["chile", "aguacate", "cilantro", "limón"],
    difficulty: "medio",
    xp: 75,
    emoji: "🇲🇽"
  },
  {
    id: "rapido",
    title: "Contra Reloj",
    description: "Algo delicioso en 15 minutos",
    ingredients: ["huevo", "pan", "queso"],
    difficulty: "fácil",
    xp: 40,
    timeLimit: 15,
    emoji: "⚡"
  },
  {
    id: "saludable",
    title: "Nutrición Total",
    description: "Una receta llena de vitaminas",
    ingredients: ["espinaca", "zanahoria", "pollo", "limón"],
    difficulty: "medio",
    xp: 80,
    emoji: "💪"
  },
  {
    id: "chef",
    title: "Chef Estrella",
    description: "Desafío para cocineros expertos",
    ingredients: ["salmón", "espárragos", "limón", "mantequilla", "ajo"],
    difficulty: "difícil",
    xp: 120,
    emoji: "⭐"
  },
  {
    id: "economico",
    title: "Presupuesto Maestro",
    description: "Delicioso con pocos ingredientes",
    ingredients: ["arroz", "huevo", "cebolla"],
    difficulty: "fácil",
    xp: 45,
    emoji: "💰"
  }
];

export function DailyChallenge({ onAcceptChallenge, currentIngredients }: DailyChallengeProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [acceptedChallenges, setAcceptedChallenges] = useState<string[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const { play: playSound } = useSound();

  // Get today's challenges (rotate based on day)
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const todaysChallenges = [
    DAILY_CHALLENGES[(dayOfYear) % DAILY_CHALLENGES.length],
    DAILY_CHALLENGES[(dayOfYear + 2) % DAILY_CHALLENGES.length],
    DAILY_CHALLENGES[(dayOfYear + 4) % DAILY_CHALLENGES.length],
  ];

  const handleAcceptChallenge = (challenge: Challenge) => {
    playSound('magic');
    setAcceptedChallenges([...acceptedChallenges, challenge.id]);
    setTotalXP(totalXP + challenge.xp);
    onAcceptChallenge(challenge.ingredients);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "medio": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      case "difícil": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const hasAllIngredients = (challenge: Challenge) => {
    return challenge.ingredients.every(ing => 
      currentIngredients.some(curr => curr.toLowerCase().includes(ing.toLowerCase()))
    );
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/20 to-pink-light/10">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-pink-light/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-primary/20 to-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating sparkles */}
        <Sparkles className="absolute top-4 right-12 w-4 h-4 text-gold animate-sparkle" />
        <Sparkles className="absolute bottom-8 left-16 w-3 h-3 text-primary animate-sparkle" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Flame className="w-6 h-6 text-orange-500 animate-wiggle" />
              <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-md animate-pulse" />
            </div>
            <span className="text-lg font-display bg-gradient-to-r from-orange-500 via-pink-dark to-primary bg-clip-text text-transparent">
              Desafíos del Día
            </span>
          </div>
          {totalXP > 0 && (
            <Badge variant="outline" className="gap-1 bg-gradient-to-r from-amber-500/20 to-gold/20 text-amber-600 border-amber-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
              <Trophy className="w-3 h-3 animate-swing" />
              {totalXP} XP
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {todaysChallenges.map((challenge, index) => {
          const isAccepted = acceptedChallenges.includes(challenge.id);
          const hasIngredients = hasAllIngredients(challenge);

          return (
            <div
              key={challenge.id}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-500 backdrop-blur-sm",
                isAccepted 
                  ? "bg-gradient-to-r from-primary/20 to-pink-light/20 border-primary/40 shadow-lg shadow-primary/10" 
                  : "bg-card/80 border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.02]",
                selectedChallenge?.id === challenge.id && "ring-2 ring-primary/50"
              )}
              style={{ 
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl animate-float" style={{ animationDuration: `${2 + index * 0.5}s` }}>
                      {challenge.emoji}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                        {challenge.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {challenge.ingredients.map((ing, ingIndex) => {
                      const hasIt = currentIngredients.some(curr => 
                        curr.toLowerCase().includes(ing.toLowerCase())
                      );
                      return (
                        <Badge 
                          key={ing} 
                          variant="outline" 
                          className={cn(
                            "text-[10px] py-0.5 transition-all duration-300",
                            hasIt 
                              ? "bg-gradient-to-r from-green-500/30 to-emerald-500/20 border-green-500/50 shadow-sm animate-pop" 
                              : "hover:border-primary/50"
                          )}
                          style={{ animationDelay: `${ingIndex * 0.1}s` }}
                        >
                          {hasIt && <Check className="w-2 h-2 mr-0.5 text-green-600" />}
                          {ing}
                        </Badge>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-[10px] transition-transform hover:scale-105",
                      getDifficultyColor(challenge.difficulty)
                    )}>
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-0.5 bg-gradient-to-r from-gold/10 to-amber-500/10 border-gold/30">
                      <Gift className="w-2.5 h-2.5 text-gold" />
                      +{challenge.xp} XP
                    </Badge>
                    {challenge.timeLimit && (
                      <Badge variant="outline" className="text-[10px] gap-0.5 animate-pulse">
                        <Clock className="w-2.5 h-2.5" />
                        {challenge.timeLimit} min
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isAccepted ? "secondary" : "default"}
                  onClick={() => handleAcceptChallenge(challenge)}
                  disabled={isAccepted}
                  className={cn(
                    "shrink-0 transition-all duration-300",
                    !isAccepted && "bg-gradient-to-r from-primary to-pink-dark hover:from-primary/90 hover:to-pink-dark/90 shadow-lg hover:shadow-primary/30 hover:scale-105"
                  )}
                >
                  {isAccepted ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      Aceptado
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1 animate-sparkle" />
                      Aceptar
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-muted-foreground text-center pt-2 flex items-center justify-center gap-1">
          <ChefHat className="w-3 h-3 animate-wiggle" />
          Los desafíos se renuevan cada día. ¡Aceptá uno y cocinemos!
        </p>
      </CardContent>
    </Card>
  );
}
