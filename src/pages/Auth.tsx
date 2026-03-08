import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, X, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIQUE_COUNTRIES } from "@/data/countries";
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
  const [country, setCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isNative = Capacitor.isNativePlatform();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      const googleUser = await GoogleAuth.signIn();

      if (!googleUser?.authentication?.idToken) {
        throw new Error("No se obtuvo el token de Google");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: googleUser.authentication.idToken,
      });

      if (error) throw error;

      toast({ title: "¡Bienvenido/a!", description: "Sesión iniciada con Google." });
    } catch (error: any) {
      // User cancelled = no toast
      if (error?.message?.includes("cancelled") || error?.message?.includes("canceled") || error?.code === 12501) {
        return;
      }
      toast({
        title: "Error con Google",
        description: error instanceof Error ? error.message : "No se pudo iniciar sesión con Google",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      // Use custom edge function with Resend for better control
      const response = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: email,
          redirectUrl: 'https://marcelacocinamichef.lovable.app/reset-password'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "No se pudo enviar el email");
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

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
              country: country || null,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("Este email ya está registrado. Probá iniciar sesión.");
          }
          throw error;
        }

        // Save country to profile if provided
        if (country && signUpData.user) {
          await supabase
            .from("profiles")
            .upsert({ id: signUpData.user.id, country, updated_at: new Date().toISOString() });
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

            {!isLogin && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  País <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="¿De dónde sos?">
                      {country ? (
                        <span className="flex items-center gap-2">
                          <span>{UNIQUE_COUNTRIES.find(c => c.code === country)?.flag}</span>
                          <span>{UNIQUE_COUNTRIES.find(c => c.code === country)?.name}</span>
                        </span>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-[9999]">
                    {UNIQUE_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Google Sign-In — solo en app nativa Android */}
          {isNative && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continuá con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-3"
                size="lg"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isGoogleLoading ? "Iniciando..." : "Continuar con Google"}
              </Button>
            </>
          )}

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
