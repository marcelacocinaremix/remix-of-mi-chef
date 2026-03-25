import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { useDeepLink } from "@/hooks/useDeepLink";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PremiumProvider } from "@/hooks/usePremium";
import { KitchenTimerProvider } from "@/hooks/useKitchenTimer";
import { useAndroidPurchase } from "@/hooks/useAndroidPurchase";

import { StreakProvider } from "@/contexts/StreakContext";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import { ForceUpdateScreen } from "@/components/ForceUpdateScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import OpenResetPassword from "./pages/OpenResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SharedRecipe from "./pages/SharedRecipe";
import PaymentProcessing from "./pages/PaymentProcessing";
import PaymentFailed from "./pages/PaymentFailed";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  useDeepLink();
  return <>{children}</>;
}

function AndroidPurchaseHandler({ children }: { children: React.ReactNode }) {
  useAndroidPurchase();
  return <>{children}</>;
}

function ForceUpdateGuard({ children }: { children: React.ReactNode }) {
  const { updateRequired, storeUrl, checking } = useForceUpdate();
  if (checking) return null; // wait silently — no flash
  if (updateRequired) return <ForceUpdateScreen storeUrl={storeUrl} />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppThemeProvider>
      <BrowserRouter>
        <ForceUpdateGuard>
          <AuthProvider>
            <DeepLinkHandler>
              <PremiumProvider>
                <AndroidPurchaseHandler>
                  <LanguageProvider>
                    <KitchenTimerProvider>
                      <StreakProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner />
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/open-reset-password" element={<OpenResetPassword />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="/terms-of-service" element={<TermsOfService />} />
                            <Route path="/r/:shareCode" element={<SharedRecipe />} />
                            <Route path="/payment-processing" element={<PaymentProcessing />} />
                            <Route path="/payment-failed" element={<PaymentFailed />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </TooltipProvider>
                      </StreakProvider>
                    </KitchenTimerProvider>
                  </LanguageProvider>
                </AndroidPurchaseHandler>
              </PremiumProvider>
            </DeepLinkHandler>
          </AuthProvider>
        </ForceUpdateGuard>
      </BrowserRouter>
    </AppThemeProvider>
  </QueryClientProvider>
);

export default App;
