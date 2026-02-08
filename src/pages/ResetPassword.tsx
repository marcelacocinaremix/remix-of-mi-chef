import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Bridge page for password reset.
 * This page reads URL parameters and redirects to the Android app deep link.
 * It's a technical bridge only - no app functionality exposed.
 */
export default function ResetPassword() {
  useEffect(() => {
    // Get all parameters from hash and query string
    const hashParams = window.location.hash.substring(1);
    const queryParams = window.location.search.substring(1);
    
    // Combine both parameter sources
    const allParams = [hashParams, queryParams].filter(Boolean).join("&");
    
    // Build the deep link URL
    const deepLinkBase = "app.marcelacocina.michef://reset-password";
    const deepLinkUrl = allParams ? `${deepLinkBase}?${allParams}` : deepLinkBase;
    
    // Redirect to the Android app
    window.location.href = deepLinkUrl;
  }, []);

  // Minimal loading UI while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Redirigiendo a la app...</p>
      </div>
    </div>
  );
}
