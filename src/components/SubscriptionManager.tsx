import { Crown, Sparkles, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";
import { useState } from "react";

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionManager({ open, onOpenChange }: SubscriptionManagerProps) {
  const { isPremium, isTrialActive, isTrialExpired, trialDaysRemaining, isCancelled, daysRemaining } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Mi Chef
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-4 rounded-xl border-2 bg-gradient-to-br ${
              isPremium 
                ? "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800"
                : isTrialActive
                  ? "from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800"
                  : "from-muted to-muted border-border"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <Crown className="w-6 h-6 text-amber-500" />
                  ) : isTrialActive ? (
                    <Clock className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-lg">
                    {isPremium ? "Premium Activo" : isTrialActive ? "Prueba gratuita" : "Plan Free"}
                  </span>
                </div>
                <Badge variant="default" className={
                  isPremium ? "bg-amber-500" : isTrialActive ? "bg-emerald-500" : "bg-muted-foreground"
                }>
                  {isPremium ? (isCancelled ? `${daysRemaining} días restantes` : "✨ Activo") : isTrialActive ? `${trialDaysRemaining} días` : "Expirada"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {isPremium 
                  ? isCancelled
                    ? `Cancelaste la renovación. Seguís con Premium hasta que se cumplan tus ${daysRemaining} días restantes.`
                    : "¡Felicidades! Disfrutás de todas las funciones de Mi Chef sin límites ni publicidad."
                  : isTrialActive 
                    ? `Te quedan ${trialDaysRemaining} días de prueba gratuita con acceso completo.`
                    : "Tu prueba terminó. Algunas funciones están limitadas."
                }
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="font-semibold">
                {isPremium ? "🎉 Tus beneficios Premium:" : "✨ Funciones incluidas:"}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  {isPremium ? "10 recetas por día" : "3 recetas por día"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Calendario semanal {isPremium ? "completo" : ""} {!isPremium && isTrialExpired && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Despensa {!isPremium && isTrialExpired && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Lista de supermercado {!isPremium && isTrialExpired && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Balance nutricional {isPremium ? "completo" : ""} {!isPremium && isTrialExpired && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Curso de cocina y tips
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : "text-green-500"}>✓</span>
                  Guía de Alimentos {isPremium ? "completa" : ""} {!isPremium && isTrialExpired && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                {isPremium && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    Sin publicidad
                  </li>
                )}
              </ul>
            </div>

            {/* Upgrade CTA */}
            {!isPremium && (
              <Button 
                onClick={() => {
                  if ((window as any).AndroidInterface) {
                    try {
                      (window as any).AndroidInterface.iniciarCompra();
                    } catch (error) {
                      console.error("Error al llamar a la interfaz nativa:", error);
                    }
                  } else {
                    alert("La pasarela de pago solo está disponible en la App instalada en Android.");
                  }
                  onOpenChange(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-5"
              >
                <Crown className="mr-2 h-4 w-4" />
                Actualizar a Premium
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
