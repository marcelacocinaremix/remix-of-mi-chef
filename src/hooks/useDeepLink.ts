import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Escucha deep links nativos (Capacitor) y maneja el flujo de
 * recuperación de contraseña extrayendo token_hash de la URL
 * y verificando el OTP con Supabase.
 */
export function useDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        // Solo importar en entorno nativo
        const { App } = await import("@capacitor/app");
        console.log("[DeepLink] Plugin @capacitor/app cargado, registrando listener...");

        const listener = await App.addListener("appUrlOpen", async ({ url }) => {
          console.log("[DeepLink] URL recibida:", url);

          try {
            // Parsear la URL del deep link
            // Formato: app.marcelacocina.michef://reset-password?type=recovery&token_hash=xxx
            const urlObj = new URL(url);
            const params = urlObj.searchParams;

            const tokenHash = params.get("token_hash") || params.get("token");
            const type = params.get("type") || "recovery";

            if (tokenHash && (type === "recovery" || urlObj.pathname?.includes("reset-password") || urlObj.host?.includes("reset-password"))) {
              console.log("[DeepLink] Token de recuperación detectado, verificando OTP...");

              const { data, error } = await supabase.auth.verifyOtp({
                type: type as any,
                token_hash: tokenHash,
              });

              if (error) {
                console.error("[DeepLink] Error verificando OTP:", error);
                // Navegar igualmente al reset para mostrar el error
                navigate("/reset-password", { replace: true });
                return;
              }

              if (data.session) {
                console.log("[DeepLink] Sesión de recuperación establecida, navegando a /reset-password");
                // La navegación la puede hacer el onAuthStateChange (PASSWORD_RECOVERY)
                // pero también forzamos por si acaso
                navigate("/reset-password", { replace: true });
              }
            }
          } catch (err) {
            console.error("[DeepLink] Error procesando URL:", err);
          }
        });

        cleanup = () => listener.remove();
      } catch {
        // No estamos en entorno nativo (web), ignorar
      }
    };

    setup();

    return () => {
      if (cleanup) cleanup();
    };
  }, [navigate]);
}
