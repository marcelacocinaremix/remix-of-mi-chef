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

    const handleDeepLinkUrl = async (url: string) => {
      console.log("[DeepLink] Procesando URL:", url);
      try {
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
            navigate("/reset-password", { replace: true });
            return;
          }

          if (data.session) {
            console.log("[DeepLink] Sesión de recuperación establecida, navegando a /reset-password");
            navigate("/reset-password", { replace: true });
          }
        }
      } catch (err) {
        console.error("[DeepLink] Error procesando URL:", err);
      }
    };

    const setup = async () => {
      try {
        const { App } = await import("@capacitor/app");
        console.log("[DeepLink] Plugin cargado, registrando listener...");

        // Cold start: la app fue abierta desde el deep link
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) {
          console.log("[DeepLink] Cold start URL:", launchUrl.url);
          handleDeepLinkUrl(launchUrl.url);
        }

        // Warm start: la app ya estaba abierta
        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          handleDeepLinkUrl(url);
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
