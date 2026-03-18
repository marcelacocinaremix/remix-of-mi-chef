import { Crown, Flame, ChefHat, Sparkles, UtensilsCrossed, Dumbbell, Check, X, Moon } from "lucide-react";
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
  recipe:  { emoji: "🍳", label: "recetas",        limit: 3,  MainIcon: ChefHat,        color: "from-orange-500 to-rose-500" },
  tips:    { emoji: "💡", label: "trucos del chef", limit: 2,  MainIcon: Sparkles,       color: "from-amber-500 to-orange-500" },
  meals:   { emoji: "🥗", label: "comidas",         limit: 3,  MainIcon: UtensilsCrossed, color: "from-emerald-500 to-teal-500" },
  workout: { emoji: "💪", label: "entrenamientos",  limit: 1,  MainIcon: Dumbbell,       color: "from-blue-500 to-indigo-500" },
};

const planRows = [
  { label: "Recetas con IA",       free: "3/día",      premium: "Ilimitado" },
  { label: "Trucos del Chef",      free: "2/día",      premium: "Ilimitado" },
  { label: "Registro de comidas",  free: "3/día",      premium: "Ilimitado" },
  { label: "Entrenamientos",       free: "1/día",      premium: "Ilimitado" },
  { label: "Sin publicidad",       free: null,         premium: "✓" },
  { label: "Todo lo demás",        free: "✓",          premium: "✓" },
];

export function DailyLimitModal({ open, onOpenChange, type = "recipe" }: DailyLimitModalProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  const { emoji, label, limit, MainIcon, color } = CONFIG[type];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">

          {/* ── Header ── */}
          <div className={`bg-gradient-to-br ${color} px-6 pt-7 pb-5 text-white text-center relative`}>
            {/* icon */}
            <div className="flex justify-center mb-3">
              <div className="bg-white/25 rounded-full p-3.5 backdrop-blur-sm shadow-lg">
                <Flame className="w-9 h-9 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              ¡Límite diario alcanzado!
            </h2>
            <p className="text-sm font-medium mt-1 opacity-90">
              Usaste tus <strong>{limit} {label}</strong> de hoy
            </p>
          </div>

          {/* ── Body ── */}
          <div className="bg-background px-5 pt-4 pb-5 space-y-4">

            {/* Tomorrow pill */}
            <div className="flex items-center justify-center gap-2 bg-muted rounded-xl px-4 py-2.5">
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Tus usos se reinician mañana 🌙
              </span>
            </div>

            {/* Plan comparison */}
            <div className="rounded-xl border border-border overflow-hidden">
              {/* header row */}
              <div className="grid grid-cols-3 bg-muted/60 text-xs font-bold text-muted-foreground">
                <div className="px-3 py-2">Función</div>
                <div className="px-2 py-2 text-center border-l border-border">Gratis</div>
                <div className="px-2 py-2 text-center border-l border-border bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </div>
              </div>
              {/* data rows */}
              {planRows.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 text-xs border-t border-border ${i % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                >
                  <div className="px-3 py-2 text-foreground/80 font-medium leading-tight">{row.label}</div>
                  <div className="px-2 py-2 text-center border-l border-border text-muted-foreground">
                    {row.free === null
                      ? <X className="w-3.5 h-3.5 text-destructive mx-auto" />
                      : row.free === "✓"
                        ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        : <span className="text-orange-500 font-semibold">{row.free}</span>
                    }
                  </div>
                  <div className="px-2 py-2 text-center border-l border-border bg-amber-500/5">
                    {row.premium === "✓"
                      ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      : <span className="text-amber-600 dark:text-amber-400 font-bold">{row.premium}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={() => {
                onOpenChange(false);
                setShowSubscription(true);
              }}
              className={`w-full bg-gradient-to-r ${color} hover:opacity-90 text-white font-bold py-5 rounded-xl shadow-lg text-sm`}
            >
              <Crown className="mr-2 h-4 w-4" />
              Pasarme a Premium
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full text-xs text-muted-foreground"
            >
              Volver al plan gratuito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionManager open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  );
}
