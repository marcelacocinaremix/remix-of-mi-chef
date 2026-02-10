import { useState, useEffect, useRef, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, User, Mail, Lock, ChefHat, ArrowRight, ArrowLeft, UtensilsCrossed, GraduationCap, Calendar, ShoppingCart, HeartPulse, Trophy, Bot, Timer, Gamepad2, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language, translations, TranslationKey } from "@/i18n/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";


// Password validation helpers
const hasMinLength = (password: string) => password.length >= 6;
const hasUppercase = (password: string) => /[A-Z]/.test(password);
const hasNumber = (password: string) => /[0-9]/.test(password);
const hasSpecialChar = (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

// Auth error translation helper
const translateAuthError = (errorMessage: string, t: (key: TranslationKey) => string): string => {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes("weak") || lowerMessage.includes("password is known")) {
    return t("authErrorWeakPassword");
  }
  if (lowerMessage.includes("invalid email") || lowerMessage.includes("email") && lowerMessage.includes("invalid")) {
    return t("authErrorInvalidEmail");
  }
  if (lowerMessage.includes("user not found") || lowerMessage.includes("no user")) {
    return t("authErrorUserNotFound");
  }
  if (lowerMessage.includes("invalid login credentials") || lowerMessage.includes("wrong password") || lowerMessage.includes("incorrect")) {
    return t("authErrorWrongPassword");
  }
  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists") || lowerMessage.includes("email in use")) {
    return t("authErrorEmailInUse");
  }
  if (lowerMessage.includes("email not confirmed")) {
    return t("authErrorEmailNotConfirmed");
  }
  if (lowerMessage.includes("too many requests") || lowerMessage.includes("rate limit")) {
    return t("authErrorTooManyRequests");
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return t("authErrorNetworkError");
  }
  
  return t("authErrorGeneric");
};

type OnboardingStep = "intro" | "language" | "tour" | "auth";

const LANGUAGES: { code: Language; name: string; flag: string; greeting: string }[] = [
  { code: "es", name: "Español", flag: "🇦🇷", greeting: "¡Hola!" },
  { code: "en", name: "English", flag: "🇺🇸", greeting: "Hello!" },
  { code: "pt", name: "Português", flag: "🇧🇷", greeting: "Olá!" },
];

const getFeatureSlides = (t: (key: TranslationKey) => string) => [
  {
    id: "cocinar",
    icon: UtensilsCrossed,
    title: t("tourCocinar"),
    description: t("tourCocinarDesc"),
    color: "from-orange-500 to-red-500",
  },
  {
    id: "aprender",
    icon: GraduationCap,
    title: t("tourAprender"),
    description: t("tourAprenderDesc"),
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "planificar",
    icon: Calendar,
    title: t("tourPlanificar"),
    description: t("tourPlanificarDesc"),
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "super",
    icon: ShoppingCart,
    title: t("tourSuper"),
    description: t("tourSuperDesc"),
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "salud",
    icon: HeartPulse,
    title: t("tourSalud"),
    description: t("tourSaludDesc"),
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "logros",
    icon: Trophy,
    title: t("tourLogros"),
    description: t("tourLogrosDesc"),
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "marcela",
    icon: Bot,
    title: t("tourMarcela"),
    description: t("tourMarcelaDesc"),
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "timer",
    icon: Timer,
    title: t("tourTimer"),
    description: t("tourTimerDesc"),
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "juego",
    icon: Gamepad2,
    title: t("tourJuego"),
    description: t("tourJuegoDesc"),
    color: "from-violet-500 to-purple-500",
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("intro");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("es");
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setLanguage } = useLanguage();
  const { toast } = useToast();

  // Create translation function based on selected language
  const t = (key: TranslationKey): string => {
    return translations[selectedLanguage][key] || translations.es[key] || key;
  };

  // Memoize feature slides based on selected language
  const FEATURE_SLIDES = useMemo(() => getFeatureSlides(t), [selectedLanguage]);

  const handleContinueToLanguage = () => {
    setStep("language");
  };

  const handleAuth = async () => {
    if (!email || !password) {
      toast({
        title: t("error"),
        description: t("authErrorGeneric"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: t("authAccountCreated"),
          description: t("authWelcome"),
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: t("authWelcomeBack"),
        });
      }
      onComplete();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: translateAuthError(error.message || "", t),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: t("error"),
        description: t("authForgotPasswordEmailRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("send-password-reset", {
        body: {
          email,
          // Intencionalmente hardcodeado/estable del lado backend;
          // se incluye por compatibilidad futura.
          redirectUrl: "app.marcelacocina.michef://reset-password",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "No se pudo enviar el email");
      }

      toast({
        title: t("authEmailSent"),
        description: t("authCheckInbox"),
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: translateAuthError(error.message || "", t),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleLanguageContinue = async () => {
    setIsLoading(true);
    await setLanguage(selectedLanguage);
    setIsLoading(false);
    setStep("tour");
    setCurrentSlide(0);
  };


  const handleNextSlide = () => {
    if (currentSlide < FEATURE_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setStep("auth");
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else {
      setStep("language");
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Background Video */}
      {step === "intro" && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23000' width='1' height='1'/%3E%3C/svg%3E"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden"
            style={{ WebkitAppearance: 'none' } as React.CSSProperties}
          >
            <source src="/videos/intro-background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Intro */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative z-10 flex flex-col items-center px-6 text-center">

              {/* Title - Elegant white serif */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-display text-5xl md:text-6xl font-medium text-white/95 tracking-wide mb-8"
              >
                Mi Chef
              </motion.h1>

              {/* CTA Button - Dark elegant style */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <button
                  onClick={handleContinueToLanguage}
                  className="group flex items-center justify-center gap-4 px-16 py-5 text-xl font-medium text-white/90 bg-black/80 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-black/90 hover:border-white/30 transition-all duration-300"
                >
                  <span>{t("onboardingStart")}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>

          </motion.div>
        )}

        {/* STEP 2: Language Selection */}
        {step === "language" && (
          <motion.div
            key="language"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black"
          >
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("intro")}
              className="absolute top-6 left-6 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {t("onboardingChooseLanguage")}
                </h2>
                <p className="text-white/60">
                  {t("onboardingLanguageQuestion")}
                </p>
              </div>

              {/* Language Options */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 mb-8"
              >
                {LANGUAGES.map((lang, index) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                      selectedLanguage === lang.code
                        ? "border-white/60 bg-white/10 shadow-lg shadow-white/5"
                        : "border-white/20 hover:border-white/40 hover:bg-white/5"
                    )}
                  >
                    <motion.span 
                      className="text-4xl"
                      animate={selectedLanguage === lang.code ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {lang.flag}
                    </motion.span>
                    <div className="flex-1 text-left">
                      <span className="block font-semibold text-white text-lg">
                        {lang.name}
                      </span>
                      <span className="text-sm text-white/60">
                        {lang.greeting}
                      </span>
                    </div>
                    <AnimatePresence>
                      {selectedLanguage === lang.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-black" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </motion.div>

              {/* Continue Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  size="lg"
                  onClick={handleLanguageContinue}
                  disabled={isLoading}
                  className="w-full py-6 text-lg rounded-2xl bg-white text-black hover:bg-white/90 shadow-lg transition-all group"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <span>{t("onboardingContinue")}</span>
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 3: Feature Tour */}
        {step === "tour" && (
          <motion.div
            key="tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black"
          >
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevSlide}
              className="absolute top-6 left-6 text-white/70 hover:text-white hover:bg-white/10 z-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            {/* Skip button */}
            <Button
              variant="ghost"
              onClick={() => setStep("auth")}
              className="absolute top-6 right-6 text-white/50 hover:text-white text-sm z-10"
            >
              {t("onboardingSkip")}
            </Button>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md flex flex-col items-center text-center"
              >
                {/* Icon with gradient background */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className={cn(
                    "w-32 h-32 rounded-3xl flex items-center justify-center mb-8 bg-gradient-to-br shadow-2xl",
                    FEATURE_SLIDES[currentSlide].color
                  )}
                >
                  {(() => {
                    const IconComponent = FEATURE_SLIDES[currentSlide].icon;
                    return <IconComponent className="w-16 h-16 text-white" strokeWidth={1.5} />;
                  })()}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-3xl font-bold text-white mb-4"
                >
                  {FEATURE_SLIDES[currentSlide].title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/70 text-lg leading-relaxed mb-12 px-4"
                >
                  {FEATURE_SLIDES[currentSlide].description}
                </motion.p>

                {/* Slide indicators */}
                <div className="flex gap-2 mb-8">
                  {FEATURE_SLIDES.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        currentSlide === index 
                          ? "w-8 bg-white" 
                          : "w-2 bg-white/30 hover:bg-white/50"
                      )}
                    />
                  ))}
                </div>

                {/* Continue button */}
                <Button
                  size="lg"
                  onClick={handleNextSlide}
                  className={cn(
                    "w-full py-6 text-lg rounded-2xl shadow-lg transition-all group bg-gradient-to-r",
                    FEATURE_SLIDES[currentSlide].color
                  )}
                >
                  <span>{currentSlide === FEATURE_SLIDES.length - 1 ? t("onboardingLetsStart") : t("onboardingContinue")}</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* STEP 4: Auth (Required) */}
        {step === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black"
          >
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("tour")}
              className="absolute top-6 left-6 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {authMode === "signup" ? t("onboardingCreateAccount") : t("login")}
                </h2>
                <p className="text-white/60">
                  {authMode === "signup" 
                    ? t("onboardingAccountBenefits")
                    : t("onboardingWelcome")}
                </p>
              </div>


              {/* Form */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                {authMode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t("onboardingNamePlaceholder")}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-12 py-6 rounded-xl border-2 border-border focus:border-primary transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t("onboardingEmailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 py-6 rounded-xl border-2 border-border focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("onboardingPasswordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 py-6 rounded-xl border-2 border-border focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password requirements - only show for signup */}
                  {authMode === "signup" && (
                    <div className="p-3 bg-white/5 rounded-lg space-y-1.5 text-sm">
                      <p className="font-medium text-white/70 mb-2">Tu contraseña debe tener:</p>
                      <div className="flex items-center gap-2">
                        {hasMinLength(password) ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasMinLength(password) ? "text-white" : "text-white/50"}>
                          Al menos 6 caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUppercase(password) ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasUppercase(password) ? "text-white" : "text-white/50"}>
                          Una letra mayúscula (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber(password) ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasNumber(password) ? "text-white" : "text-white/50"}>
                          Un número (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecialChar(password) ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasSpecialChar(password) ? "text-white" : "text-white/50"}>
                          Un caracter especial (!@#$%...)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="w-full py-6 text-lg rounded-xl bg-white text-black hover:bg-white/90 shadow-lg transition-all"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                    />
                  ) : (
                    authMode === "signup" ? t("onboardingCreateAccount") : t("login")
                  )}
                </Button>

                {/* Google Sign-In */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/50 backdrop-blur px-3 text-white/50">o</span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      if (Capacitor.isNativePlatform()) {
                        // Native: use native Google Sign-In plugin (no browser needed)
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
                      } else {
                        const { error } = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) throw error;
                      }
                    } catch (err) {
                      console.error("Google sign-in error:", err);
                      toast({
                        title: "Error",
                        description: err instanceof Error ? err.message : "No se pudo iniciar sesión con Google",
                        variant: "destructive",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full py-5 text-base rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </Button>

                {/* Forgot password link - only show on login */}
                {authMode === "login" && !isForgotPassword && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-white/60 hover:text-white text-sm hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                {/* Forgot password form */}
                {isForgotPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-white/5 rounded-xl space-y-3"
                  >
                    <p className="text-white/70 text-sm text-center">
                      Te enviaremos un link para restablecer tu contraseña
                    </p>
                    <Button
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10"
                    >
                      {isLoading ? "Enviando..." : "Enviar link de recuperación"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full text-white/50 hover:text-white text-sm"
                    >
                      Cancelar
                    </button>
                  </motion.div>
                )}

                <div className="text-center">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "login" : "signup");
                      setIsForgotPassword(false);
                    }}
                    className="text-white hover:underline text-sm font-medium"
                  >
                    {authMode === "login" 
                      ? `${t("onboardingNoAccount")} ${t("onboardingSignupHere")}`
                      : `${t("onboardingAlreadyAccount")} ${t("onboardingLoginHere")}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {["intro", "language", "tour", "auth"].map((s, i) => (
          <motion.div
            key={s}
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              width: step === s ? 24 : 8,
            }}
            transition={{ delay: 0.1 * i, type: "spring" }}
            className={cn(
              "h-2 rounded-full transition-colors duration-300",
              step === s ? "bg-white" : "bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
