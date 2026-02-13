import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Ban, BarChart3, Calendar, Zap, Check } from "lucide-react";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  { icon: Ban, label: "Sin publicidad", description: "Disfrutá sin interrupciones" },
  { icon: BarChart3, label: "Balance ilimitado", description: "Registrá comidas sin límite" },
  { icon: Calendar, label: "Planificador desbloqueado", description: "Organizá tu semana entera" },
  { icon: Zap, label: "Acceso completo", description: "Todas las funciones premium" },
];

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const handleSubscribe = () => {
    toast.info("Próximamente: la suscripción estará disponible a través de Google Play");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              <Crown className="w-7 h-7" />
              Mi Chef Premium
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-white/90 text-sm">
            Tu prueba gratuita terminó. ¡Actualizá para seguir disfrutando!
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit.label} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2">
                  <benefit.icon className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{benefit.label}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-base rounded-xl shadow-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Actualizar a Premium
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Podés seguir usando las funciones básicas gratis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
