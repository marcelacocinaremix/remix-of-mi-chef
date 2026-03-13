import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Check, X } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  { label: "10 recetas por día con IA", premium: true },
  { label: "Despensa completa (agregar/editar)", premium: true },
  { label: "Lista de súper completa", premium: true },
  { label: "Balance nutricional completo", premium: true },
  { label: "Trucos del Chef ilimitados", premium: true },
  { label: "Sin publicidad", premium: true },
  { label: "Calendario semanal/mensual", premium: true },
  { label: "Juego Chef Arena", premium: true },
  { label: "3 recetas por día (gratis)", premium: false },
  { label: "Funciones en modo lectura", premium: false },
];

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const handleSubscribe = () => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              <Crown className="w-7 h-7" />
              Mi Chef Premium
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-white/90 text-sm">
            Tu prueba gratuita terminó. ¡Activá Premium para seguir disfrutando sin límites!
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipe limit highlight */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border-2 border-border p-3 bg-muted/30">
              <p className="text-2xl font-black text-muted-foreground">3</p>
              <p className="text-xs text-muted-foreground font-medium">recetas / día</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">Plan Gratis</p>
            </div>
            <div className="rounded-xl border-2 border-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30">
              <p className="text-2xl font-black text-amber-500">10</p>
              <p className="text-xs text-amber-600 font-medium">recetas / día</p>
              <p className="text-[10px] text-amber-500/70 mt-0.5">✨ Premium</p>
            </div>
          </div>

          {/* Plan comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Free col */}
            <div className="rounded-xl border p-3 bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wide">Gratis</p>
              {benefits.filter(b => !b.premium).map(b => (
                <div key={b.label} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{b.label}</span>
                </div>
              ))}
              {benefits.filter(b => b.premium).map(b => (
                <div key={b.label} className="flex items-start gap-2">
                  <X className="w-3.5 h-3.5 text-destructive/60 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground/60 line-through">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Premium col */}
            <div className="rounded-xl border-2 border-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30 space-y-2">
              <p className="text-xs font-semibold text-amber-600 text-center uppercase tracking-wide flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" /> Premium
              </p>
              {benefits.map(b => (
                <div key={b.label} className="flex items-start gap-2">
                  <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${b.premium ? "text-amber-500" : "text-emerald-500"}`} />
                  <span className={`text-xs ${b.premium ? "text-foreground font-medium" : "text-muted-foreground"}`}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 text-base rounded-xl shadow-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Activar Premium
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Podés seguir usando las funciones básicas gratis
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
