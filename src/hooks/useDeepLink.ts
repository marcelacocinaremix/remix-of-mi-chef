import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Escucha deep links nativos (Capacitor) y redirige al flujo
 * de recuperación de contraseña pasando el token por URL params
 * para que la página /reset-password lo procese.
 */
export function useDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const handleDeepLinkUrl = (url: string) => {
      console.log("[DeepLink] URL recibida:", url);

      try {
        // Para custom schemes, new URL puede fallar en algunos entornos.
        // Intentamos parsear manualmente como fallback.
        let tokenHash: string | null = null;
        let type: string = "recovery";

        try {
          const urlObj = new URL(url);
          tokenHash = urlObj.searchParams.get("token_hash") || urlObj.searchParams.get("token");
          type = urlObj.searchParams.get("type") || "recovery";

          // También revisar en el hash (por si viene como #token_hash=...)
          if (!tokenHash && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.replace(/^#/, ""));
            tokenHash = hashParams.get("token_hash") || hashParams.get("token");
            type = hashParams.get("type") || type;
          }
        } catch {
          // Fallback: parsear manualmente
          console.log("[DeepLink] URL no parseable con new URL, intentando manualmente");
          const queryStart = url.indexOf("?");
          const hashStart = url.indexOf("#");
          
          let paramString = "";
          if (queryStart !== -1) {
            paramString = url.slice(queryStart + 1);
          } else if (hashStart !== -1) {
            paramString = url.slice(hashStart + 1);
          }

          if (paramString) {
            const params = new URLSearchParams(paramString);
            tokenHash = params.get("token_hash") || params.get("token");
            type = params.get("type") || "recovery";
          }
        }

        console.log("[DeepLink] Parsed:", { tokenHash: !!tokenHash, type });

        if (tokenHash) {
          // NO verificamos OTP acá. Navegamos directamente a /reset-password
          // con los params, y esa página se encarga de verificar.
          console.log("[DeepLink] Navegando a /reset-password con token...");
          navigate(`/reset-password?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(tokenHash)}`, { replace: true });
        } else {
          console.warn("[DeepLink] No se encontró token en la URL");
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
        console.log("[DeepLink] getLaunchUrl:", launchUrl);
        if (launchUrl?.url) {
          handleDeepLinkUrl(launchUrl.url);
        }

        // Warm start: la app ya estaba abierta
        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          console.log("[DeepLink] appUrlOpen:", url);
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
