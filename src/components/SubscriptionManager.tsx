import { Crown, Sparkles, AlertCircle, XCircle, Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    label: "Generar recetas con IA",
    free: "3/día",
    premium: "Ilimitado",
    freeOk: true,
    premiumOk: true,
  },
  {
    label: "Calendario semanal/mensual",
    free: "✓",
    premium: "✓",
    freeOk: true,
    premiumOk: true,
  },
  {
    label: "Juego Chef Arena",
    free: "✓",
    premium: "✓",
    freeOk: true,
    premiumOk: true,
  },
  {
    label: "Asistente Marcela",
    free: "✓",
    premium: "✓",
    freeOk: true,
    premiumOk: true,
  },
  {
    label: "Despensa",
    free: "Solo lectura",
    premium: "✓",
    freeOk: false,
    premiumOk: true,
  },
  {
    label: "Lista de súper",
    free: "Solo lectura",
    premium: "✓",
    freeOk: false,
    premiumOk: true,
  },
  {
    label: "Balance nutricional",
    free: "Solo lectura",
    premium: "✓",
    freeOk: false,
    premiumOk: true,
  },
  {
    label: "Trucos del Chef",
    free: "Solo lectura",
    premium: "✓",
    freeOk: false,
    premiumOk: true,
  },
  {
    label: "Sin publicidad",
    free: "✗",
    premium: "✓",
    freeOk: false,
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
  return (
    <span className={`text-xs font-semibold text-center block ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function SubscriptionManager({ open, onOpenChange }: SubscriptionManagerProps) {
  const {
    isPremium, isCancelled, daysRemaining,
    subscriptionEnd, refetch,
  } = usePremium();

  const [isRestoring, setIsRestoring] = useState(false);

  const isCancelledButActive = isCancelled && isPremium;

  const stateLabel = isPremium
    ? isCancelledButActive ? "Premium (cancelado)" : "Premium Activo"
    : "Plan gratuito";

  const badgeColor = isPremium
    ? "bg-amber-500 text-white"
    : "bg-muted text-muted-foreground";

  const badgeText = isPremium
    ? isCancelledButActive ? `${daysRemaining}d restantes` : "✨ Activo"
    : "Gratis";

  const cardGradient = isPremium
    ? "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800"
    : "from-muted/50 to-muted/30 border-border";

  const StatusIcon = isPremium ? Crown : Sparkles;
  const iconColor = isPremium ? "text-amber-500" : "text-muted-foreground";

  const endDateFormatted = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleSubscribe = () => {
    const androidBridge =
      (window as any).AndroidInterface ||
      (window as any).Android ||
      (window as any).MiChefBridge ||
      (window as any).JSBridge;

    if (androidBridge) {
      try {
        if (typeof androidBridge.iniciarCompra === "function") {
          androidBridge.iniciarCompra("premium_mensual");
        } else {
          const methods = Object.getOwnPropertyNames(androidBridge).join(", ");
          console.error("[Purchase] iniciarCompra not found. Available:", methods);
          toast.error(`Método de pago no encontrado. Métodos disponibles: ${methods || "ninguno"}`);
        }
      } catch (error) {
        console.error("Error al llamar a la interfaz nativa:", error);
        toast.error("Error al iniciar la compra. Intentá de nuevo.");
      }
    } else {
      const isAndroid = /android/i.test(navigator.userAgent);
      if (isAndroid) {
        toast.error("No se encontró el puente nativo. Verificá que AndroidInterface esté registrado en el WebView.", {
          duration: 6000,
        });
      } else {
        toast.info("El pago se procesa desde la App instalada en tu dispositivo Android.", {
          duration: 5000,
        });
      }
    }
    onOpenChange(false);
  };

  const activeCol = isPremium ? "premium" : "free";

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

          {/* Plan comparison table — 3 cols: Función / Gratis / Premium */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Comparativa de planes</h4>
            <div className="rounded-xl border overflow-hidden text-sm">
              {/* Header */}
              <div className="grid grid-cols-3 bg-muted/50">
                <div className="p-2 text-xs text-muted-foreground font-medium">Función</div>
                <div className={`p-2 text-center text-xs font-semibold ${activeCol === "free" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  Gratis
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
                  className={`grid grid-cols-3 border-t ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <div className="p-2 text-xs text-foreground leading-tight flex items-center">{f.label}</div>
                  <div className={`p-2 flex items-center justify-center ${activeCol === "free" ? "bg-primary/5" : ""}`}>
                    <CellIcon ok={f.freeOk} value={f.free} />
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
              Actualizar a Premium
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

          {/* Restore purchase */}
          {!isPremium && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setIsRestoring(true);
                const androidBridge =
                  (window as any).AndroidInterface ||
                  (window as any).Android ||
                  (window as any).MiChefBridge ||
                  (window as any).JSBridge;

                if (androidBridge && typeof androidBridge.restaurarCompra === "function") {
                  androidBridge.restaurarCompra();
                  toast.info("Verificando compra existente...");
                  setIsRestoring(false);
                  onOpenChange(false);
                  return;
                }

                try {
                  const { data, error } = await supabase.functions.invoke("sync-subscription", {});
                  if (!error && data?.success) {
                    await refetch();
                    if (data.is_premium) {
                      toast.success("🎉 ¡Suscripción Premium restaurada!", { duration: 5000 });
                    } else {
                      toast.info("No se encontró una suscripción activa. Si acabás de comprar, esperá un momento e intentá de nuevo.", {
                        duration: 6000,
                      });
                    }
                    if (data.is_premium) onOpenChange(false);
                  } else {
                    toast.info("No se encontró una suscripción activa. Si acabás de comprar, esperá un momento e intentá de nuevo.", {
                      duration: 6000,
                    });
                  }
                } catch {
                  toast.error("No se pudo verificar la compra. Intentá de nuevo.");
                } finally {
                  setIsRestoring(false);
                }
              }}
              disabled={isRestoring}
              className="w-full text-muted-foreground hover:text-foreground text-xs"
            >
              <RotateCcw className={`mr-1.5 h-3.5 w-3.5 ${isRestoring ? "animate-spin" : ""}`} />
              {isRestoring ? "Verificando..." : "¿Ya compraste? Restaurar compra"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
