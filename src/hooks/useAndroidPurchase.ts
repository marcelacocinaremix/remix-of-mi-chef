import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";
import confetti from "canvas-confetti";

/**
 * Hook that listens for Android Google Play purchase callbacks.
 * Handles:
 *  - onPurchaseSuccess(token)    → new purchase confirmed
 *  - onPurchaseCancelled()       → user cancelled purchase flow
 *  - onPurchaseError(code)       → native billing error
 *  - onSubscriptionCancelled(token) → user cancelled auto-renewal in Play Store
 *  - onPurchaseSync(token)       → bridge detected existing active subscription on app start
 */
export function useAndroidPurchase() {
  const { user } = useAuth();
  const { refetch } = usePremium();

  useEffect(() => {
    if (!user) return;

    // ── New purchase confirmed ─────────────────────────────────────────────
    const handlePurchaseSuccess = async (purchaseToken?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-purchase", {
          body: { purchaseToken: purchaseToken || null },
        });

        if (error || !data?.success) {
          console.error("Error confirming purchase:", error || data);
          toast.error("Error al activar Premium. Contactá soporte.");
          return;
        }

        await refetch();

        // 🎉 Confetti
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ["#f59e0b", "#f97316", "#eab308", "#fbbf24", "#ffffff"];
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();

        toast.success("🎉 ¡Premium activado! Disfrutá de todas las funciones.", { duration: 5000 });
      } catch (err) {
        console.error("Error in purchase confirmation:", err);
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
      console.log("[AndroidPurchase] onPurchaseSuccess", purchaseToken ? "with token" : "no token");
      handlePurchaseSuccess(purchaseToken);
    };

    (window as any).onPurchaseCancelled = () => {
      console.log("[AndroidPurchase] Purchase cancelled by user");
    };

    (window as any).onPurchaseError = (errorCode?: string) => {
      console.error("[AndroidPurchase] Purchase error:", errorCode);
      toast.error(`Error de compra (${errorCode || 'desconocido'}). Intentá de nuevo.`);
    };

    (window as any).onSubscriptionCancelled = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onSubscriptionCancelled");
      handleSubscriptionCancelled(purchaseToken);
    };

    // Called by native bridge on app start when it finds an existing active subscription
    (window as any).onPurchaseSync = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onPurchaseSync called on startup");
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
