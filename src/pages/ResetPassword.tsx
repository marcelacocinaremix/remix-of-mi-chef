import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Check, X, Loader2, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";

// Password validation helpers
const hasMinLength = (password: string) => password.length >= 6;
const hasUppercase = (password: string) => /[A-Z]/.test(password);
const hasNumber = (password: string) => /[0-9]/.test(password);
const hasSpecialChar = (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

const isPasswordValid = (password: string) => 
  hasMinLength(password) && hasUppercase(password) && hasNumber(password) && hasSpecialChar(password);

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: null | (() => void) = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const initializeSession = async () => {
      try {
        // 1) Preferimos tokens en el hash (deep links suelen venir como #...)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(window.location.search);

        const params = hashParams.toString().length ? hashParams : searchParams;

        // Flow nativo recomendado: token_hash + verifyOtp (evita abrir navegador y el OTP Expired)
        const tokenHash = params.get("token_hash") || params.get("token");
        const type = params.get("type") || "recovery";

        // Flow web alternativo: access_token + refresh_token (por compatibilidad)
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        console.log("Reset password params:", {
          hasTokenHash: !!tokenHash,
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });

        if (tokenHash) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            // supabase-js espera los strings exactos ("recovery", etc.)
            type: type as any,
            token_hash: tokenHash,
          });

          if (verifyError) {
            console.error("Error verifying OTP:", verifyError);
            setError("El link de recuperación expiró o es inválido. Solicitá uno nuevo desde la app.");
            return;
          }

          if (data.session) {
            setIsSessionReady(true);
            setError(null);
            return;
          }
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            setError("El link de recuperación expiró o es inválido. Solicitá uno nuevo desde la app.");
            return;
          }

          if (data.session) {
            setIsSessionReady(true);
            setError(null);
            return;
          }
        }

        // Fallback (web): evento PASSWORD_RECOVERY / SIGNED_IN
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state change:", event);
          if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
            setIsSessionReady(true);
            setError(null);
          }
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        // Si ya hay sesión, seguimos
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setIsSessionReady(true);
          return;
        }

        // Timeout defensivo
        timeout = setTimeout(() => {
          setError("El link de recuperación expiró o es inválido. Solicitá uno nuevo desde la app.");
        }, 5000);
      } catch (err) {
        console.error("Error initializing session:", err);
        setError("Ocurrió un error al procesar el link. Solicitá uno nuevo desde la app.");
      }
    };

    initializeSession();

    return () => {
      if (unsubscribe) unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid(password)) {
      toast({
        title: "Error",
        description: "La contraseña no cumple con los requisitos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Sign out to invalidate all sessions for security
      await supabase.auth.signOut();
      
      setIsSuccess(true);

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password requirements component
  const PasswordRequirements = () => (
    <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1.5 text-sm">
      <p className="font-medium text-muted-foreground mb-2">Tu contraseña debe tener:</p>
      <div className="flex items-center gap-2">
        {hasMinLength(password) ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={hasMinLength(password) ? "text-primary" : "text-muted-foreground"}>
          Al menos 6 caracteres
        </span>
      </div>
      <div className="flex items-center gap-2">
        {hasUppercase(password) ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={hasUppercase(password) ? "text-primary" : "text-muted-foreground"}>
          Una letra mayúscula (A-Z)
        </span>
      </div>
      <div className="flex items-center gap-2">
        {hasNumber(password) ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={hasNumber(password) ? "text-primary" : "text-muted-foreground"}>
          Un número (0-9)
        </span>
      </div>
      <div className="flex items-center gap-2">
        {hasSpecialChar(password) ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <X className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={hasSpecialChar(password) ? "text-primary" : "text-muted-foreground"}>
          Un caracter especial (!@#$%...)
        </span>
      </div>
    </div>
  );

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border/50">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              ¡Listo!
            </h1>
            <p className="text-foreground text-lg mb-2">
              Tu contraseña fue restablecida correctamente.
            </p>
            <p className="text-muted-foreground mb-6">
              Ya podés volver a la aplicación para iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              onClick={() => window.location.href = "app.marcelacocina.michef://login"}
              className="w-full"
              size="lg"
            >
              Abrir Mi Chef Personal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border/50">
            <X className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              Link expirado
            </h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <Button
              onClick={() => window.location.href = "app.marcelacocina.michef://forgot-password"}
              className="w-full"
              size="lg"
            >
              Volver a la app
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen while waiting for session
  if (!isSessionReady) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de recuperación...</p>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Nueva contraseña
          </h1>
          <p className="text-muted-foreground mt-2">
            Ingresá tu nueva contraseña para recuperar tu cuenta
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordRequirements />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !isPasswordValid(password) || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Después de actualizar tu contraseña, podrás volver a la app e iniciar sesión.
        </p>
      </div>
    </div>
  );
}
