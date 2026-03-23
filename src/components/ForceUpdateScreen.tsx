import { RefreshCw, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface Props {
  storeUrl: string;
}

export function ForceUpdateScreen({ storeUrl }: Props) {
  const handleUpdate = async () => {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: storeUrl });
    } else {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <ArrowUpCircle className="h-12 w-12 text-primary" />
      </div>

      {/* Title */}
      <h1 className="mb-3 text-2xl font-bold text-foreground">
        Nueva versión disponible
      </h1>

      {/* Message */}
      <p className="mb-8 max-w-xs text-base text-muted-foreground leading-relaxed">
        Necesitás actualizar la app para continuar disfrutando de todas las
        funciones de Mi Chef.
      </p>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full max-w-xs gap-2"
        onClick={handleUpdate}
      >
        <RefreshCw className="h-5 w-5" />
        Actualizar ahora
      </Button>

      {/* Sub-text */}
      <p className="mt-4 text-xs text-muted-foreground">
        La actualización es obligatoria para continuar.
      </p>
    </div>
  );
}
