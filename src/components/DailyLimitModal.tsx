import { Crown, Flame, ChefHat, Sparkles, UtensilsCrossed, Dumbbell } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { useState } from "react";

interface DailyLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "recipe" | "tips" | "meals" | "workout";
}

const CONFIG = {
  recipe:  { emoji: "🍳", noun: "recetas",       limit: "3", MainIcon: ChefHat },
  tips:    { emoji: "💡", noun: "trucos",         limit: "2", MainIcon: Sparkles },
  meals:   { emoji: "🥗", noun: "comidas",        limit: "3", MainIcon: UtensilsCrossed },
  workout: { emoji: "💪", noun: "entrenamientos", limit: "1", MainIcon: Dumbbell },
};

export function DailyLimitModal({ open, onOpenChange, type = "recipe" }: DailyLimitModalProps) {
  const [showSubscription, setShowSubscription] = useState(false);

  const { emoji, noun, limit, MainIcon } = CONFIG[type];

  const benefits = [
    { Icon: MainIcon,   text: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ilimitados` },
    { Icon: UtensilsCrossed, text: "Comidas ilimitadas" },
    { Icon: Crown,      text: "Sin publicidad" },
    { Icon: ChefHat,    text: "Todo sin límites" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs p-0 overflow-hidden border-0 shadow-2xl">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-8 pb-6 text-white text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                <Flame className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              {emoji} ¡Se acabaron
            </h2>
            <p className="text-lg font-bold opacity-90">por hoy!</p>
          </div>

          <div className="p-5 space-y-4 bg-background">
            {/* Info */}
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground leading-snug">
                Llegaste al límite de{" "}
                <span className="font-bold text-foreground">{limit} {noun}</span> por día del plan gratuito.
              </p>
              <p className="text-xs text-muted-foreground">
                Volvé mañana o actualizá para tener acceso ilimitado.
              </p>
            </div>

            {/* Benefits highlight */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Con Premium tenés:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {benefits.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-foreground/80">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => {
                onOpenChange(false);
                setShowSubscription(true);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-5 rounded-xl shadow-lg text-sm"
            >
              <Crown className="mr-2 h-4 w-4" />
              Actualizar a Premium
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full text-xs text-muted-foreground"
            >
              Seguir con el plan gratuito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionManager open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  );
}
