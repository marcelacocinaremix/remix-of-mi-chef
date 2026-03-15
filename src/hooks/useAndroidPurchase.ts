import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";
import confetti from "canvas-confetti";

/**
 * Hook that listens for Android Google Play purchase callbacks.
 * When the Android native bridge confirms a successful purchase,
 * it calls window.onPurchaseSuccess() which this hook intercepts
 * to update the database via a secure edge function and refresh the UI.
 */
export function useAndroidPurchase() {
  const { user } = useAuth();
  const { refetch } = usePremium();

  useEffect(() => {
    const handlePurchaseSuccess = async (purchaseToken?: string) => {
      if (!user) {
        console.error("No user logged in for purchase confirmation");
        return;
      }

      try {
        // Call secure edge function to update subscription (bypasses RLS)
        const { data, error } = await supabase.functions.invoke("confirm-purchase", {
          body: { purchaseToken: purchaseToken || null },
        });

        if (error) {
          console.error("Error confirming purchase:", error);
          toast.error("Error al activar Premium. Contactá soporte.");
          return;
        }

        if (!data?.success) {
          console.error("Purchase confirmation failed:", data);
          toast.error("Error al activar Premium. Contactá soporte.");
          return;
        }

        // Immediately refresh premium context from DB
        await refetch();

        // 🎉 Confetti celebration!
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ["#f59e0b", "#f97316", "#eab308", "#fbbf24", "#ffffff"];

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();

        toast.success("🎉 ¡Premium activado! Disfrutá de todas las funciones.", {
          duration: 5000,
        });
      } catch (err) {
        console.error("Error in purchase confirmation:", err);
        toast.error("Error al confirmar la compra.");
      }
    };

    // Expose the callback for Android native bridge
    // Called by Java: WebView.evaluateJavascript("window.onPurchaseSuccess(token)", null)
    (window as any).onPurchaseSuccess = (purchaseToken?: string) => {
      console.log("[AndroidPurchase] onPurchaseSuccess called", purchaseToken ? "with token" : "no token");
      handlePurchaseSuccess(purchaseToken);
    };

    // Expose cancel callback so the native side can clean up UI
    (window as any).onPurchaseCancelled = () => {
      console.log("[AndroidPurchase] Purchase cancelled by user");
    };

    // Expose error callback
    (window as any).onPurchaseError = (errorCode?: string) => {
      console.error("[AndroidPurchase] Purchase error:", errorCode);
    };

    // Also listen for a custom event (alternative bridge method)
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handlePurchaseSuccess(detail?.purchaseToken);
    };
    window.addEventListener("purchaseSuccess", handleEvent);

    return () => {
      delete (window as any).onPurchaseSuccess;
      delete (window as any).onPurchaseCancelled;
      delete (window as any).onPurchaseError;
      window.removeEventListener("purchaseSuccess", handleEvent);
    };
  }, [user, refetch]);
}
