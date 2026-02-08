import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, X } from "lucide-react";
import logo from "@/assets/logo.png";

function getSafeReturnTo(search: string) {
  const params = new URLSearchParams(search);
  const raw = params.get("returnTo") || "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

// Password validation helpers
const hasMinLength = (password: string) => password.length >= 6;
const hasUppercase = (password: string) => /[A-Z]/.test(password);
const hasNumber = (password: string) => /[0-9]/.test(password);
const hasSpecialChar = (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const returnTo = getSafeReturnTo(location.search);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate(returnTo);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(returnTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Ingresá tu email para recuperar la contraseña",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://marcelacocinamichef.lovable.app/reset-password'
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Email enviado!",
        description: "Revisá tu casilla de correo para restablecer tu contraseña.",
      });
      setIsForgotPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Email o contraseña incorrectos");
          }
          throw error;
        }

        toast({
          title: "¡Bienvenido/a!",
          description: "Iniciaste sesión correctamente.",
        });
      } else {
        const redirectUrl = `${window.location.origin}${returnTo}`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("Este email ya está registrado. Probá iniciar sesión.");
          }
          throw error;
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Ya podés empezar a usar la app.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
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

  // Forgot password form
  if (isForgotPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Recuperar contraseña
            </h1>
            <p className="text-muted-foreground mt-2">
              Ingresá tu email y te enviaremos un link para restablecer tu contraseña
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar link de recuperación"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsForgotPassword(false)}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Mi Chef Personal" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {isLogin ? "¡Hola de nuevo!" : "Creá tu cuenta"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Ingresá para acceder a tu despensa y recetas favoritas"
              : "Unite a Mi Chef Personal y guardá tus recetas"}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Tu nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="¿Cómo te llamás?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
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
              
              {/* Show password requirements only when creating account */}
              {!isLogin && <PasswordRequirements />}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading
                ? "Cargando..."
                : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
            </Button>

          </form>

          {/* Forgot password link - only show on login */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-primary text-sm hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium ml-1 hover:underline"
              >
                {isLogin ? "Registrate" : "Iniciá sesión"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
