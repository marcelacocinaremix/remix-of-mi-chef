import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, CheckCircle2, ChefHat, ShieldCheck } from "lucide-react";

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, refetch } = usePremium();
  const [checking, setChecking] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const maxChecks = 15; // Check for ~45 seconds
  
  // Get payment status from MP redirect params
  const paymentStatus = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');

  const checkPremiumStatus = useCallback(async () => {
    console.log('Checking premium status...');
    await refetch();
    setCheckCount(prev => prev + 1);
  }, [refetch]);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If no user, redirect to auth
    if (!user) {
      navigate('/auth?redirect=/payment-processing');
      return;
    }

    // If already premium, show success immediately
    if (isPremium) {
      setChecking(false);
      return;
    }

    // If MP returned with approved status, start checking more aggressively
    const interval = paymentStatus === 'approved' ? 2000 : 3000;
    
    // Poll for premium status
    const intervalId = setInterval(checkPremiumStatus, interval);
    
    // Initial check
    checkPremiumStatus();

    return () => clearInterval(intervalId);
  }, [user, authLoading, isPremium, navigate, checkPremiumStatus, paymentStatus]);

  // Stop checking after max attempts
  useEffect(() => {
    if (checkCount >= maxChecks && !isPremium) {
      setChecking(false);
    }
  }, [checkCount, isPremium]);

  // If premium is activated
  if (isPremium) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-xl text-center space-y-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 left-0 right-0 mx-auto w-fit">
              <CheckCircle2 className="w-8 h-8 text-green-500 bg-white rounded-full" />
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground">
            ¡Pago confirmado!
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Ya sos parte de <span className="text-primary font-semibold">Mi Chef Premium</span>
          </p>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 space-y-3 text-left">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Ahora tenés acceso a:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Recetas ilimitadas con IA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Plan semanal completo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Historial y estadísticas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Despensa, Super y más
              </li>
            </ul>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Acceso premium de por vida - Sin renovaciones</span>
          </div>

          <Button 
            onClick={() => navigate('/')} 
            size="xl"
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            <ChefHat className="w-5 h-5 mr-2" />
            ¡Empezar a cocinar!
          </Button>
        </div>
      </div>
    );
  }

  // Still checking or timed out
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
          {checking ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : (
            <Crown className="w-10 h-10 text-amber-500" />
          )}
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground">
          {checking ? 'Verificando tu pago...' : 'Pago en proceso'}
        </h1>
        
        <p className="text-muted-foreground">
          {checking 
            ? 'Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.'
            : 'Tu pago está siendo procesado. Puede tomar unos minutos en confirmarse.'}
        </p>

        {!checking && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">¿Ya pagaste?</p>
              <p className="mt-1 text-amber-600 dark:text-amber-300">
                A veces Mercado Pago tarda unos minutos en confirmar. Podés volver a la app y verificar más tarde.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setChecking(true);
                  setCheckCount(0);
                }}
                variant="outline"
                className="flex-1"
              >
                Verificar de nuevo
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        )}

        {checking && (
          <p className="text-xs text-muted-foreground">
            Verificación {checkCount + 1} de {maxChecks}...
          </p>
        )}
      </div>
    </div>
  );
}