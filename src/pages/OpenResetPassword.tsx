import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

function getParams(): URLSearchParams {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  if (hashParams.toString().length) return hashParams;
  return new URLSearchParams(window.location.search);
}

export default function OpenResetPassword() {
  const params = useMemo(() => getParams(), []);

  const tokenHash = params.get("token_hash") || params.get("token");
  const type = params.get("type") || "recovery";

  const deepLink = useMemo(() => {
    if (!tokenHash) return null;
    // Usamos query params (no #hash) porque en Android algunos handlers pierden el fragment.
    return `app.marcelacocina.michef://reset-password?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(tokenHash)}`;
  }, [tokenHash, type]);

  const webResetLink = useMemo(() => {
    if (!tokenHash) return null;
    return `${window.location.origin}/reset-password?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(tokenHash)}`;
  }, [tokenHash, type]);

  useEffect(() => {
    if (!deepLink) return;

    // Intentamos abrir la app automáticamente.
    // Si el cliente de email/navegador lo bloquea, quedan los botones manuales.
    window.location.href = deepLink;
  }, [deepLink]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold text-foreground">Abrir la app</h1>
          <p className="text-muted-foreground mt-2">
            {deepLink
              ? "Si no se abrió automáticamente, tocá el botón de abajo."
              : "Este link es inválido o expiró. Volvé a solicitar la recuperación desde la app."}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50 space-y-4">
          <Button
            className="w-full"
            size="lg"
            disabled={!deepLink}
            onClick={() => {
              if (deepLink) window.location.href = deepLink;
            }}
          >
            Abrir Mi Chef Personal
          </Button>

          <Button
            className="w-full"
            size="lg"
            variant="outline"
            disabled={!webResetLink}
            onClick={() => {
              if (webResetLink) window.location.href = webResetLink;
            }}
          >
            Cambiar contraseña en el navegador
          </Button>

          <p className="text-sm text-muted-foreground">
            Tip: en algunos clientes de correo, los links a apps se abren mejor tocando “Abrir en Chrome” y luego “Abrir en la app”.
          </p>
        </div>
      </div>
    </div>
  );
}
