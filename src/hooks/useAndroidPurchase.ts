import { useEffect } from "react";
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
 *  3. window.onPurchaseError(code, token?)   – ITEM_ALREADY_OWNED triggers restore
 *  4. window.onSubscriptionCancelled(token)  – grace-period sync
 *  5. window.onPurchaseSync(token)           – app-start sync of existing subscription
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
    const syncSubscription = async (purchaseToken?: string, options?: { silent?: boolean; isNewPurchase?: boolean }) => {
      const { silent = false, isNewPurchase = false } = options ?? {};
      const tokenSnippet = purchaseToken ? `"${purchaseToken.substring(0, 40)}..."` : "NONE";
      console.log(`[AndroidPurchase] syncSubscription — token: ${tokenSnippet}, isNew: ${isNewPurchase}`);

      try {
        const { data, error } = await supabase.functions.invoke("sync-subscription", {
          body: purchaseToken ? { purchaseToken } : {},
        });

        console.log("[AndroidPurchase] sync-subscription response:", JSON.stringify({ data, error }));

        if (error) {
          console.error("[AndroidPurchase] sync-subscription error:", error);
          if (!silent) toast.error("No se pudo verificar la suscripción. Intentá de nuevo.");
          return false;
        }

        if (data?.success) {
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

    // ── Handle a new purchase (from bridge callback or CustomEvent) ────────
    const handlePurchaseSuccess = async (purchaseToken?: string) => {
      const token = purchaseToken?.trim() || undefined;
      console.log("[AndroidPurchase] handlePurchaseSuccess — token:", token ? `"${token.substring(0, 40)}..."` : "EMPTY");

      if (!token) {
        // No token provided: do a DB-only sync (returns current state without Google API call)
        console.warn("[AndroidPurchase] No token — syncing from DB only.");
        const synced = await syncSubscription(undefined, { isNewPurchase: true });
        if (!synced) await refetch();
        return;
      }

      // Token provided: validate directly against Google Play API
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

    // ── App-start sync: bridge found an existing token ─────────────────────
    const handlePurchaseSync = async (purchaseToken?: string) => {
      console.log("[AndroidPurchase] handlePurchaseSync — token:", JSON.stringify(purchaseToken));
      await syncSubscription(purchaseToken, { silent: true });
    };

    // ── Register global window callbacks (called by native Java/Kotlin) ────
    (window as any).onPurchaseSuccess = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] window.onPurchaseSuccess called — token:", JSON.stringify(purchaseToken));
      handlePurchaseSuccess(purchaseToken);
    };

    (window as any).onPurchaseCancelled = () => {
      console.log("[AndroidPurchase] window.onPurchaseCancelled — user cancelled");
    };

    (window as any).onPurchaseError = (errorCode?: string, purchaseToken?: string) => {
      console.error("[AndroidPurchase] window.onPurchaseError:", JSON.stringify({ errorCode, purchaseToken }));
      const alreadyOwned = errorCode === "ITEM_ALREADY_OWNED" || errorCode === "itemAlreadyOwned";
      if (alreadyOwned) {
        console.log("[AndroidPurchase] ITEM_ALREADY_OWNED — restoring subscription...");
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

    // ── CustomEvent "purchaseSuccess" ─────────────────────────────────────
    // Fired by: window.dispatchEvent(new CustomEvent("purchaseSuccess", { detail: { purchaseToken } }))
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const token = detail?.purchaseToken || detail?.token;
      console.log("[AndroidPurchase] CustomEvent 'purchaseSuccess' received — token:", JSON.stringify(token));
      handlePurchaseSuccess(token);
    };
    window.addEventListener("purchaseSuccess", handleCustomEvent);

    // Also support snake_case variant some bridges dispatch
    const handleCustomEventAlt = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const token = detail?.purchaseToken || detail?.token;
      console.log("[AndroidPurchase] CustomEvent 'purchase_completed' received — token:", JSON.stringify(token));
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

/**
 * Hook that listens for Android Google Play purchase callbacks.
 * Handles:
 *  - onPurchaseSuccess(token)    → new purchase confirmed (token may be missing if already owned)
 *  - onPurchaseCancelled()       → user cancelled purchase flow
 *  - onPurchaseError(code, token?) → native billing error; ITEM_ALREADY_OWNED sends token
 *  - onSubscriptionCancelled(token) → user cancelled auto-renewal in Play Store
 *  - onPurchaseSync(token)       → bridge detected existing active subscription on app start
 */
export function useAndroidPurchase() {
  const { user } = useAuth();
  const { refetch } = usePremium();

  useEffect(() => {
    if (!user) return;

    const triggerConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#f59e0b", "#f97316", "#eab308", "#fbbf24", "#ffffff"];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    };

    /**
     * Restore/sync an existing subscription using the purchase token.
     * Used when: ITEM_ALREADY_OWNED, onPurchaseSync, or token provided on error.
     */
    const syncExistingSubscription = async (purchaseToken?: string, silent = false) => {
      console.log("[AndroidPurchase] Syncing existing subscription via sync-subscription...");
      try {
        const { data, error } = await supabase.functions.invoke("sync-subscription", {
          body: purchaseToken ? { purchaseToken } : {},
        });

        if (!error && data?.success) {
          await refetch();
          if (data.is_premium) {
            triggerConfetti();
            toast.success("🎉 ¡Premium restaurado! Disfrutá de todas las funciones.", { duration: 5000 });
          } else if (!silent) {
            toast.info("No se encontró una suscripción activa asociada a esta cuenta.");
          }
          return true;
        } else {
          console.error("[AndroidPurchase] sync-subscription failed:", error || data);
          if (!silent) toast.error("No se pudo verificar la suscripción. Intentá de nuevo.");
          return false;
        }
      } catch (err) {
        console.error("[AndroidPurchase] Error in syncExistingSubscription:", err);
        if (!silent) toast.error("Error al verificar la suscripción.");
        return false;
      }
    };

    // ── New purchase confirmed ─────────────────────────────────────────────
    const handlePurchaseSuccess = async (purchaseToken?: string) => {
      const token = purchaseToken?.trim();

      console.log("[AndroidPurchase] onPurchaseSuccess called — token:", token ? `"${token.substring(0, 30)}..."` : "EMPTY/UNDEFINED");

      // No token = sync with Google Play to find active subscription
      if (!token) {
        console.log("[AndroidPurchase] No token received — syncing via sync-subscription...");
        const synced = await syncExistingSubscription(undefined, false);
        if (!synced) {
          // Last resort: force a refetch from DB
          console.log("[AndroidPurchase] Sync failed, forcing DB refetch...");
          await refetch();
        }
        return;
      }

      console.log("[AndroidPurchase] Calling confirm-purchase with token...");
      try {
        const { data, error } = await supabase.functions.invoke("confirm-purchase", {
          body: { purchaseToken: token },
        });

        console.log("[AndroidPurchase] confirm-purchase response:", JSON.stringify({ data, error }));

        if (error || !data?.success) {
          console.error("[AndroidPurchase] confirm-purchase failed:", error || data);
          console.log("[AndroidPurchase] Falling back to sync-subscription with token...");
          await syncExistingSubscription(token, false);
          return;
        }

        await refetch();
        triggerConfetti();
        toast.success("🎉 ¡Premium activado! Disfrutá de todas las funciones.", { duration: 5000 });
      } catch (err) {
        console.error("[AndroidPurchase] Error in purchase confirmation:", err);
        toast.error("Error al confirmar la compra.");
      }
    };

    // ── Subscription cancelled in Play Store (grace period starts) ─────────
    // The user cancelled auto-renewal — they keep access until subscription_end.
    const handleSubscriptionCancelled = async (purchaseToken?: string) => {
      console.log("[AndroidPurchase] Subscription cancelled from Play Store, syncing...");
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
        console.error("Error syncing cancellation:", err);
      }
    };

    // ── Sync on app start: Play Store has active subscription not in DB ────
    // Called by native bridge when it detects an active subscription token
    // that may not have been recorded (e.g. after reinstall or first launch).
    const handlePurchaseSync = async (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onPurchaseSync — validating existing subscription");
      try {
        const { data, error } = await supabase.functions.invoke("sync-subscription", {
          body: purchaseToken ? { purchaseToken } : {},
        });
        if (!error && data?.success) {
          await refetch();
          if (data.is_premium && !data.cancelled_active) {
            console.log("[AndroidPurchase] Subscription synced, access confirmed");
          }
        }
      } catch (err) {
        console.error("Error in purchase sync:", err);
      }
    };

    // ── Register global callbacks ──────────────────────────────────────────
    (window as any).onPurchaseSuccess = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onPurchaseSuccess RAW args:", arguments);
      console.log("[AndroidPurchase] onPurchaseSuccess token value:", JSON.stringify(purchaseToken));
      handlePurchaseSuccess(purchaseToken);
    };

    (window as any).onPurchaseCancelled = () => {
      console.log("[AndroidPurchase] Purchase cancelled by user");
    };

    // onPurchaseError: ITEM_ALREADY_OWNED may include a token — use it to restore
    (window as any).onPurchaseError = (errorCode?: string, purchaseToken?: string) => {
      console.error("[AndroidPurchase] onPurchaseError RAW:", JSON.stringify({ errorCode, purchaseToken }));
      if (errorCode === "ITEM_ALREADY_OWNED" || errorCode === "itemAlreadyOwned") {
        console.log("[AndroidPurchase] ITEM_ALREADY_OWNED token:", purchaseToken ? `"${String(purchaseToken).substring(0, 30)}..."` : "NONE");
        syncExistingSubscription(purchaseToken, false);
      } else {
        toast.error(`Error de compra (${errorCode || 'desconocido'}). Si ya compraste, usá "Restaurar compra".`);
      }
    };

    (window as any).onSubscriptionCancelled = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onSubscriptionCancelled token:", JSON.stringify(purchaseToken));
      handleSubscriptionCancelled(purchaseToken);
    };

    // Called by native bridge on app start when it finds an existing active subscription
    (window as any).onPurchaseSync = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onPurchaseSync token:", JSON.stringify(purchaseToken));
      handlePurchaseSync(purchaseToken);
    };

    // CustomEvent fallback for alternative bridge method
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handlePurchaseSuccess(detail?.purchaseToken);
    };
    window.addEventListener("purchaseSuccess", handleEvent);

    return () => {
      delete (window as any).onPurchaseSuccess;
      delete (window as any).onPurchaseCancelled;
      delete (window as any).onPurchaseError;
      delete (window as any).onSubscriptionCancelled;
      delete (window as any).onPurchaseSync;
      window.removeEventListener("purchaseSuccess", handleEvent);
    };
  }, [user, refetch]);
}
