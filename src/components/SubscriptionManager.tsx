import { Crown, Sparkles, Clock, AlertCircle, XCircle } from "lucide-react";
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
  const {
    isPremium, isTrialActive, isTrialExpired,
    trialDaysRemaining, isCancelled, daysRemaining,
    subscriptionEnd, planType,
  } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  // Determine state label + badge
  const isFullyFree = !isPremium && !isTrialActive && !isCancelled;
  const isCancelledButActive = isCancelled && isPremium;

  const stateLabel = isPremium
    ? isCancelledButActive ? "Premium (cancelado)" : "Premium Activo"
    : isTrialActive ? "Prueba gratuita"
    : "Plan gratuito";

  const badgeColor = isPremium
    ? "bg-amber-500 text-white"
    : isTrialActive ? "bg-emerald-500 text-white"
    : "bg-muted text-muted-foreground";

  const badgeText = isPremium
    ? isCancelledButActive ? `${daysRemaining}d restantes` : "✨ Activo"
    : isTrialActive ? `${trialDaysRemaining} días`
    : isTrialExpired ? "Expirada" : "Gratis";

  const cardGradient = isPremium
    ? "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800"
    : isTrialActive
      ? "from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800"
      : "from-muted to-muted border-border";

  const StatusIcon = isPremium ? Crown : isTrialActive ? Clock : isTrialExpired ? XCircle : Sparkles;
  const iconColor = isPremium ? "text-amber-500" : isTrialActive ? "text-emerald-500" : "text-muted-foreground";

  const endDateFormatted = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const trialEndFormatted = isTrialActive && trialDaysRemaining > 0
    ? `Tu prueba vence en ${trialDaysRemaining} día${trialDaysRemaining !== 1 ? "s" : ""}.`
    : null;

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
            <div className={`p-4 rounded-xl border-2 bg-gradient-to-br ${cardGradient}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-6 h-6 ${iconColor}`} />
                  <span className="font-semibold text-lg">{stateLabel}</span>
                </div>
                <Badge variant="default" className={badgeColor}>
                  {badgeText}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {isPremium
                  ? isCancelledButActive
                    ? `Cancelaste la renovación. Seguís con Premium hasta el ${endDateFormatted}.`
                    : "¡Felicidades! Disfrutás de todas las funciones de Mi Chef sin límites ni publicidad."
                  : isTrialActive
                    ? trialEndFormatted ?? `Estás en período de prueba gratuita.`
                    : isTrialExpired
                      ? "Tu prueba terminó. Algunas funciones están limitadas."
                      : "Estás en el plan gratuito con funciones básicas."}
              </p>

              {/* Cancellation notice */}
              {isCancelledButActive && endDateFormatted && (
                <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Después del {endDateFormatted} la cuenta pasará automáticamente al plan gratuito.
                  </p>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="font-semibold">
                {isPremium ? "🎉 Tus beneficios Premium:" : "✨ Comparativa de planes:"}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className={isPremium ? "text-amber-500" : isTrialActive ? "text-emerald-500" : "text-muted-foreground"}>
                    {isPremium || isTrialActive ? "✓" : "–"}
                  </span>
                  {isPremium ? "10 recetas por día" : isTrialActive ? "3 recetas por día (prueba)" : "3 recetas por día"}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Calendario mensual / semanal
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium || isTrialActive ? "text-green-500" : "text-destructive"}>
                    {isPremium || isTrialActive ? "✓" : "✗"}
                  </span>
                  Despensa {isFullyFree && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium || isTrialActive ? "text-green-500" : "text-destructive"}>
                    {isPremium || isTrialActive ? "✓" : "✗"}
                  </span>
                  Lista de supermercado {isFullyFree && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium || isTrialActive ? "text-green-500" : "text-destructive"}>
                    {isPremium || isTrialActive ? "✓" : "✗"}
                  </span>
                  Balance nutricional {isFullyFree && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Curso de cocina y tips
                </li>
                <li className="flex items-center gap-2">
                  <span className={isPremium || isTrialActive ? "text-green-500" : "text-destructive"}>
                    {isPremium || isTrialActive ? "✓" : "✗"}
                  </span>
                  Trucos del Chef {isFullyFree && <Badge variant="outline" className="text-[10px] px-1">Solo lectura</Badge>}
                </li>
                {isPremium && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span>
                    Sin publicidad
                  </li>
                )}
              </ul>
            </div>

            {/* Upgrade CTA — show when not on paid premium */}
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
                {isTrialActive ? "Activar Premium" : "Actualizar a Premium"}
              </Button>
            )}

            {/* Renew CTA — cancelled but still active */}
            {isCancelledButActive && (
              <Button
                variant="outline"
                onClick={() => {
                  if ((window as any).AndroidInterface) {
                    try {
                      (window as any).AndroidInterface.iniciarCompra();
                    } catch (error) {
                      console.error("Error al llamar a la interfaz nativa:", error);
                    }
                  } else {
                    alert("La renovación está disponible en la App instalada en Android.");
                  }
                  onOpenChange(false);
                }}
                className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              >
                <Crown className="mr-2 h-4 w-4" />
                Renovar suscripción
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
