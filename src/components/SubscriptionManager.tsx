import { Crown, Sparkles, Clock, AlertCircle, XCircle, Check, X, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    label: "Generar recetas con IA",
    free: "3/día",
    trial: "3/día",
    premium: "10/día",
    freeOk: true,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Calendario semanal/mensual",
    free: "✓",
    trial: "✓",
    premium: "✓",
    freeOk: true,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Juego Chef Arena",
    free: "✓",
    trial: "✓",
    premium: "✓",
    freeOk: true,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Asistente Marcela",
    free: "✓",
    trial: "✓",
    premium: "✓",
    freeOk: true,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Despensa",
    free: "Solo lectura",
    trial: "✓",
    premium: "✓",
    freeOk: false,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Lista de súper",
    free: "Solo lectura",
    trial: "✓",
    premium: "✓",
    freeOk: false,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Balance nutricional",
    free: "Solo lectura",
    trial: "✓",
    premium: "✓",
    freeOk: false,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Trucos del Chef",
    free: "Solo lectura",
    trial: "✓",
    premium: "✓",
    freeOk: false,
    trialOk: true,
    premiumOk: true,
  },
  {
    label: "Sin publicidad",
    free: "✗",
    trial: "✗",
    premium: "✓",
    freeOk: false,
    trialOk: false,
    premiumOk: true,
  },
];

function CellIcon({ ok, value }: { ok: boolean; value: string }) {
  if (value === "✓") {
    return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  }
  if (value === "✗") {
    return <X className="w-4 h-4 text-destructive mx-auto" />;
  }
  if (value === "Solo lectura") {
    return <span className="text-[10px] text-muted-foreground text-center block leading-tight">Solo<br/>lectura</span>;
  }
  // Numeric/text values (e.g. "3/día", "10/día")
  return (
    <span className={`text-xs font-semibold text-center block ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function SubscriptionManager({ open, onOpenChange }: SubscriptionManagerProps) {
  const {
    isPremium, isTrialActive, isTrialExpired,
    trialDaysRemaining, isCancelled, daysRemaining,
    subscriptionEnd,
  } = usePremium();

  const isCancelledButActive = isCancelled && isPremium;

  const stateLabel = isPremium
    ? isCancelledButActive ? "Premium (cancelado)" : "Premium Activo"
    : isTrialActive ? "Prueba gratuita (15 días)"
    : isTrialExpired ? "Prueba finalizada"
    : "Plan gratuito";

  const badgeColor = isPremium
    ? "bg-amber-500 text-white"
    : isTrialActive ? "bg-emerald-500 text-white"
    : "bg-muted text-muted-foreground";

  const badgeText = isPremium
    ? isCancelledButActive ? `${daysRemaining}d restantes` : "✨ Activo"
    : isTrialActive ? `${trialDaysRemaining} día${trialDaysRemaining !== 1 ? "s" : ""} restantes`
    : isTrialExpired ? "Expirada" : "Gratis";

  const cardGradient = isPremium
    ? "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800"
    : isTrialActive
      ? "from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800"
      : "from-muted/50 to-muted/30 border-border";

  const StatusIcon = isPremium ? Crown : isTrialActive ? Clock : isTrialExpired ? XCircle : Sparkles;
  const iconColor = isPremium ? "text-amber-500" : isTrialActive ? "text-emerald-500" : "text-muted-foreground";

  const endDateFormatted = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleSubscribe = () => {
    if ((window as any).AndroidInterface) {
      try {
        (window as any).AndroidInterface.iniciarCompra();
      } catch (error) {
        console.error("Error al llamar a la interfaz nativa:", error);
        toast.error("Error al iniciar la compra. Intentá de nuevo.");
      }
    } else {
      toast.info("El pago se procesa desde la App instalada en tu dispositivo Android.", {
        duration: 4000,
      });
    }
    onOpenChange(false);
  };

  // Highlight active column
  const activeCol = isPremium ? "premium" : isTrialActive ? "trial" : "free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Mi Chef
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status Card */}
          <div className={`p-4 rounded-xl border-2 bg-gradient-to-br ${cardGradient}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-6 h-6 ${iconColor}`} />
                <span className="font-semibold">{stateLabel}</span>
              </div>
              <Badge variant="default" className={badgeColor}>
                {badgeText}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {isPremium
                ? isCancelledButActive
                  ? `Cancelaste la renovación. Seguís con Premium hasta el ${endDateFormatted}.`
                  : "¡Disfrutás todas las funciones sin límites ni publicidad!"
                : isTrialActive
                  ? `Estás en la prueba gratuita. Te quedan ${trialDaysRemaining} día${trialDaysRemaining !== 1 ? "s" : ""} para disfrutar Premium.`
                  : isTrialExpired
                    ? "Tu prueba de 15 días terminó. Activá Premium para seguir usando todo."
                    : "Usás el plan gratuito con funciones básicas."}
            </p>

            {isCancelledButActive && endDateFormatted && (
              <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Después del {endDateFormatted} la cuenta pasará automáticamente al plan gratuito.
                </p>
              </div>
            )}
          </div>

          {/* Plan comparison table */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Comparativa de planes</h4>
            <div className="rounded-xl border overflow-hidden text-sm">
              {/* Header */}
              <div className="grid grid-cols-4 bg-muted/50">
                <div className="p-2 text-xs text-muted-foreground font-medium">Función</div>
                <div className={`p-2 text-center text-xs font-semibold ${activeCol === "free" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  Gratis
                </div>
                <div className={`p-2 text-center text-xs font-semibold ${activeCol === "trial" ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground"}`}>
                  Prueba
                  <div className="text-[10px] font-normal opacity-70">15 días</div>
                </div>
                <div className={`p-2 text-center text-xs font-semibold ${activeCol === "premium" ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground"}`}>
                  Premium
                  <div className="text-[10px] font-normal opacity-70">💎</div>
                </div>
              </div>

              {/* Rows */}
              {features.map((f, i) => (
                <div
                  key={f.label}
                  className={`grid grid-cols-4 border-t ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <div className="p-2 text-xs text-foreground leading-tight flex items-center">{f.label}</div>
                  <div className={`p-2 flex items-center justify-center ${activeCol === "free" ? "bg-primary/5" : ""}`}>
                    <CellIcon ok={f.freeOk} value={f.free} />
                  </div>
                  <div className={`p-2 flex items-center justify-center ${activeCol === "trial" ? "bg-emerald-500/5" : ""}`}>
                    <CellIcon ok={f.trialOk} value={f.trial} />
                  </div>
                  <div className={`p-2 flex items-center justify-center ${activeCol === "premium" ? "bg-amber-500/5" : ""}`}>
                    <CellIcon ok={f.premiumOk} value={f.premium} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isPremium && (
            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-5"
            >
              <Crown className="mr-2 h-4 w-4" />
              {isTrialActive ? "Activar Premium ahora" : "Actualizar a Premium"}
            </Button>
          )}

          {isCancelledButActive && (
            <Button
              variant="outline"
              onClick={handleSubscribe}
              className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              <Crown className="mr-2 h-4 w-4" />
              Renovar suscripción
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
