import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const params = useMemo(() => getParams(), []);

  const tokenHash = params.get("token_hash") || params.get("token");
  const type = params.get("type") || "recovery";

  const webResetLink = useMemo(() => {
    if (!tokenHash) return null;
    return `${window.location.origin}/reset-password?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(tokenHash)}`;
  }, [tokenHash, type]);

  const handleCopy = async () => {
    if (!webResetLink) return;
    try {
      await navigator.clipboard.writeText(webResetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = webResetLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <img src={logo} alt="Mi Chef Personal" className="w-32 h-32 mx-auto mb-6" />
          <h1 className="font-display text-4xl font-semibold text-foreground">
            Restablecer contraseña
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            {webResetLink
              ? "Tocá el botón para ir a cambiar tu contraseña."
              : "Este link es inválido o expiró. Volvé a solicitar la recuperación desde la app."}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border/50 space-y-5">
          <Button
            className="w-full"
            size="lg"
            disabled={!webResetLink}
            onClick={() => {
              if (webResetLink) window.location.href = webResetLink;
            }}
          >
            Cambiar contraseña
          </Button>

          {webResetLink && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o copiá el link</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ¡Link copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar link al portapapeles
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Si el botón no funciona, copiá el link y pegalo en el navegador Chrome.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
