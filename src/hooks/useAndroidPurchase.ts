import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";

/**
 * Hook that listens for Android Google Play purchase callbacks.
 * When the Android native bridge confirms a successful purchase,
 * it calls window.onPurchaseSuccess() which this hook intercepts
 * to update the database and refresh the UI.
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
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            is_premium: true,
            plan_type: "premium",
            subscription_status: "active",
            subscription_start: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating premium status:", error);
          toast.error("Error al activar Premium. Contactá soporte.");
          return;
        }

        // Refresh the premium context
        await refetch();

        toast.success("🎉 ¡Premium activado! Disfrutá de todas las funciones.", {
          duration: 5000,
        });
      } catch (err) {
        console.error("Error in purchase confirmation:", err);
        toast.error("Error al confirmar la compra.");
      }
    };

    // Expose the callback for Android native bridge
    (window as any).onPurchaseSuccess = (purchaseToken?: string) => {
      handlePurchaseSuccess(purchaseToken);
    };

    // Also listen for a custom event (alternative bridge method)
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      handlePurchaseSuccess(detail?.purchaseToken);
    };
    window.addEventListener("purchaseSuccess", handleEvent);

    return () => {
      delete (window as any).onPurchaseSuccess;
      window.removeEventListener("purchaseSuccess", handleEvent);
    };
  }, [user, refetch]);
}
