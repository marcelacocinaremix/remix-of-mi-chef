import { useEffect } from "react";

/**
 * This page is loaded after OAuth completes on native mobile (Capacitor).
 * Its only purpose is to close the in-app browser so the user returns to the app.
 */
export default function AuthCallback() {
  useEffect(() => {
    // Try to close the browser window/tab
    window.close();
    
    // Fallback: if window.close() doesn't work, show a message
    const timer = setTimeout(() => {
      document.getElementById("fallback")?.classList.remove("hidden");
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Volviendo a la app...</p>
        <p id="fallback" className="hidden text-sm text-muted-foreground">
          Si no volviste automáticamente, cerrá esta pestaña y volvé a la app.
        </p>
      </div>
    </div>
  );
}
