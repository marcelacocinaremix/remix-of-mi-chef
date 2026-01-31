import { Crown, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionManager({ open, onOpenChange }: SubscriptionManagerProps) {
  return (
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
          <div className="p-4 rounded-xl border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-lg">
                  ¡App Gratuita!
                </span>
              </div>
              <Badge variant="default" className="bg-emerald-500">
                Activo
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Disfrutá de todas las funciones de Mi Chef sin costo.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold">✨ Tus beneficios:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                3 recetas por día
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Calendario semanal
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Lista de supermercado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Guardar favoritos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Despensa y escáner
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
