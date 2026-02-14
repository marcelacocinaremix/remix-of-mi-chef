import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { useDeepLink } from "@/hooks/useDeepLink";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PremiumProvider } from "@/hooks/usePremium";
import { KitchenTimerProvider } from "@/hooks/useKitchenTimer";
import { useAndroidPurchase } from "@/hooks/useAndroidPurchase";
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

// Main App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <BrowserRouter>
        <AuthProvider>
          <DeepLinkHandler>
            <PremiumProvider>
              <AndroidPurchaseHandler>
                <LanguageProvider>
                  <KitchenTimerProvider>
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
                  </KitchenTimerProvider>
                </LanguageProvider>
              </AndroidPurchaseHandler>
            </PremiumProvider>
          </DeepLinkHandler>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
