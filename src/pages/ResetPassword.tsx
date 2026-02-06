import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Check, X, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

// Password validation helpers
const hasMinLength = (password: string) => password.length >= 6;
const hasUppercase = (password: string) => /[A-Z]/.test(password);
const hasNumber = (password: string) => /[0-9]/.test(password);
const hasSpecialChar = (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

type PageState = "loading" | "valid" | "invalid" | "expired" | "success";

export default function ResetPassword() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    validateRecoverySession();
  }, []);

  const validateRecoverySession = async () => {
    try {
      // Check URL hash for recovery token (Supabase sends it as hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");

      // Handle errors from Supabase (expired link, etc.)
      if (errorCode || errorDescription) {
        if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
          setPageState("expired");
          setErrorMessage("El link de recuperación expiró. Solicitá uno nuevo.");
        } else {
          setPageState("invalid");
          setErrorMessage(errorDescription || "El link de recuperación no es válido.");
        }
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Check if this is a recovery flow
      if (type === "recovery" && accessToken) {
        // Clean URL for security (remove token from browser history)
        window.history.replaceState(null, "", window.location.pathname);
        
        // Verify the session is valid
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setPageState("invalid");
          setErrorMessage("No se pudo validar la sesión. Intentá solicitar un nuevo link.");
          return;
        }

        // Valid recovery session
        setPageState("valid");
        return;
      }

      // No recovery token - check if there's an existing recovery session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User has a session, might be a recovery session
        // We'll allow password reset if they have any valid session
        setPageState("valid");
      } else {
        // No session and no token - invalid access
        setPageState("invalid");
        setErrorMessage("Acceso inválido. Usá el link enviado a tu email.");
      }
    } catch (error) {
      console.error("Error validating recovery session:", error);
      setPageState("invalid");
      setErrorMessage("Ocurrió un error al validar el link. Intentá de nuevo.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completá ambos campos de contraseña",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!hasMinLength(password)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Handle specific errors
        if (updateError.message.includes("same as")) {
          throw new Error("La nueva contraseña debe ser diferente a la anterior");
        }
        throw updateError;
      }

      // Invalidate ALL sessions (including this one and any others)
      // This ensures the user needs to log in again with the new password
      // and any stolen sessions are invalidated
      await supabase.auth.signOut({ scope: "global" });

      setPageState("success");
      
      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña fue cambiada exitosamente.",
      });

    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando link de recuperación...</p>
        </div>
      </div>
    );
  }

  // Error states (invalid or expired)
  if (pageState === "invalid" || pageState === "expired") {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              {pageState === "expired" ? "Link expirado" : "Link inválido"}
            </h1>
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50 space-y-4">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
              size="lg"
            >
              Solicitar nuevo link
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-muted-foreground">
              Tu contraseña fue cambiada exitosamente. Todas las sesiones anteriores fueron cerradas por seguridad.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
              size="lg"
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Valid state - show password reset form
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Nueva contraseña
          </h1>
          <p className="text-muted-foreground mt-2">
            Ingresá tu nueva contraseña para completar el cambio
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordRequirements />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || password !== confirmPassword || !hasMinLength(password)}
            >
              {isSubmitting ? (
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
      </div>
    </div>
  );
}
