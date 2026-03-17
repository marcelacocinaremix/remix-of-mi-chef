import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";
import confetti from "canvas-confetti";

/**
 * Hook that listens for Android Google Play purchase callbacks.
 *
 * Supported entry points:
 *  1. window.onPurchaseSuccess(token)        – called by native bridge after purchase
 *  2. CustomEvent "purchaseSuccess"          – fallback dispatched by some bridge variants
 *  3. CustomEvent "purchase_completed"       – snake_case variant (enviarTokenALovable in Java)
 *  4. window.onPurchaseError(code, token?)   – ITEM_ALREADY_OWNED triggers restore
 *  5. window.onSubscriptionCancelled(token)  – grace-period sync
 *  6. window.onPurchaseSync(token)           – app-start sync of existing subscription
 *
 * ALL paths use supabase.functions.invoke so the JWT is always sent.
 */
export function useAndroidPurchase() {
  const { user } = useAuth();
  const { refetch } = usePremium();

  useEffect(() => {
    if (!user) return;

    // ── Confetti celebration ───────────────────────────────────────────────
    const triggerConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#f59e0b", "#f97316", "#eab308", "#fbbf24", "#ffffff"];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    };

    // ── Core: validate token with Google Play via sync-subscription ────────
    const syncSubscription = async (
      purchaseToken?: string,
      options?: { silent?: boolean; isNewPurchase?: boolean }
    ) => {
      const { silent = false, isNewPurchase = false } = options ?? {};
      const tokenSnippet = purchaseToken ? `"${purchaseToken.substring(0, 40)}..."` : "NONE";
      console.log(`[AndroidPurchase] syncSubscription — token: ${tokenSnippet}, isNew: ${isNewPurchase}`);

      try {
        const bodyPayload = purchaseToken
          ? { purchaseToken: purchaseToken.trim() }
          : {};

        console.log("[AndroidPurchase] Invoking sync-subscription with body keys:", Object.keys(bodyPayload));

        const { data, error } = await supabase.functions.invoke("sync-subscription", {
          body: bodyPayload,
        });

        console.log("[AndroidPurchase] sync-subscription response:", JSON.stringify({ data, error }));

        if (error) {
          console.error("[AndroidPurchase] sync-subscription error:", error);
          if (!silent) toast.error("No se pudo verificar la suscripción. Intentá de nuevo.");
          return false;
        }

        if (data?.success) {
          // Wait for refetch to complete before triggering UI/confetti
          await refetch();
          if (data.is_premium) {
            triggerConfetti();
            const msg = isNewPurchase
              ? "🎉 ¡Premium activado! Disfrutá de todas las funciones."
              : "🎉 ¡Premium restaurado! Disfrutá de todas las funciones.";
            toast.success(msg, { duration: 6000 });
          } else if (!silent) {
            toast.info("No se encontró una suscripción activa para esta cuenta.");
          }
          return true;
        }

        // data.success === false
        console.warn("[AndroidPurchase] sync-subscription returned success=false:", data);
        if (!silent) toast.error("No se pudo activar el Premium. Si completaste el pago, usá 'Restaurar compra'.");
        return false;

      } catch (err) {
        console.error("[AndroidPurchase] Exception in syncSubscription:", err);
        if (!silent) toast.error("Error al verificar la suscripción.");
        return false;
      }
    };

    // ── Handle a new/restored purchase ────────────────────────────────────
    const handlePurchaseSuccess = async (rawToken?: string | Record<string, any>) => {
      // Normalize: Android bridges sometimes pass an object instead of a string
      let token: string | undefined;
      if (typeof rawToken === "string") {
        token = rawToken.trim() || undefined;
      } else if (rawToken && typeof rawToken === "object") {
        // e.g. { purchaseToken: "...", ... } passed directly as the argument
        token = (rawToken as any).purchaseToken || (rawToken as any).token || undefined;
        if (token) token = String(token).trim();
      }

      console.log("[AndroidPurchase] handlePurchaseSuccess — token:", token ? `"${token.substring(0, 40)}..."` : "EMPTY");

      if (!token) {
        console.warn("[AndroidPurchase] No token — syncing from DB only.");
        const synced = await syncSubscription(undefined, { isNewPurchase: true });
        if (!synced) await refetch();
        return;
      }

      await syncSubscription(token, { isNewPurchase: true });
    };

    // ── Subscription cancelled (grace period) ─────────────────────────────
    const handleSubscriptionCancelled = async (purchaseToken?: string) => {
      console.log("[AndroidPurchase] handleSubscriptionCancelled — token:", JSON.stringify(purchaseToken));
      try {
        const { data, error } = await supabase.functions.invoke("sync-subscription", {
          body: purchaseToken ? { purchaseToken } : {},
        });
        if (!error && data?.success) {
          await refetch();
          if (data.cancelled_active) {
            toast.info("Renovación cancelada. Tu acceso Premium continúa hasta el final del período.");
          }
        }
      } catch (err) {
        console.error("[AndroidPurchase] Error syncing cancellation:", err);
      }
    };

    // ── App-start sync ─────────────────────────────────────────────────────
    const handlePurchaseSync = async (purchaseToken?: string) => {
      console.log("[AndroidPurchase] handlePurchaseSync — token:", JSON.stringify(purchaseToken));
      await syncSubscription(purchaseToken, { silent: true });
    };

    // ── Register global window callbacks (called by native Java/Kotlin) ────
    (window as any).onPurchaseSuccess = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] window.onPurchaseSuccess — token:", JSON.stringify(purchaseToken));
      handlePurchaseSuccess(purchaseToken);
    };

    (window as any).onPurchaseCancelled = () => {
      console.log("[AndroidPurchase] window.onPurchaseCancelled — user cancelled");
    };

    (window as any).onPurchaseError = (errorCode?: string, purchaseToken?: string) => {
      console.error("[AndroidPurchase] window.onPurchaseError:", JSON.stringify({ errorCode, purchaseToken }));
      const alreadyOwned = errorCode === "ITEM_ALREADY_OWNED" || errorCode === "itemAlreadyOwned";
      if (alreadyOwned) {
        console.log("[AndroidPurchase] ITEM_ALREADY_OWNED — restoring...");
        syncSubscription(purchaseToken, { silent: false, isNewPurchase: false });
      } else {
        toast.error(`Error de compra (${errorCode ?? "desconocido"}). Si ya compraste, usá "Restaurar compra".`);
      }
    };

    (window as any).onSubscriptionCancelled = (purchaseToken?: string) => {
      handleSubscriptionCancelled(purchaseToken);
    };

    (window as any).onPurchaseSync = (purchaseToken?: string) => {
      handlePurchaseSync(purchaseToken);
    };

    // ── CustomEvent "purchaseSuccess" (camelCase) ─────────────────────────
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const token = detail?.purchaseToken || detail?.token;
      console.log("[AndroidPurchase] CustomEvent 'purchaseSuccess' — token:", JSON.stringify(token));
      handlePurchaseSuccess(token);
    };
    window.addEventListener("purchaseSuccess", handleCustomEvent);

    // ── CustomEvent "purchase_completed" (snake_case, Java bridge variant) ─
    const handleCustomEventAlt = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const token = detail?.purchaseToken || detail?.token;
      console.log("[AndroidPurchase] CustomEvent 'purchase_completed' — token:", JSON.stringify(token));
      handlePurchaseSuccess(token);
    };
    window.addEventListener("purchase_completed", handleCustomEventAlt);

    return () => {
      delete (window as any).onPurchaseSuccess;
      delete (window as any).onPurchaseCancelled;
      delete (window as any).onPurchaseError;
      delete (window as any).onSubscriptionCancelled;
      delete (window as any).onPurchaseSync;
      window.removeEventListener("purchaseSuccess", handleCustomEvent);
      window.removeEventListener("purchase_completed", handleCustomEventAlt);
    };
  }, [user, refetch]);
}
