import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, User, Mail, Lock, ChefHat, ArrowRight, ArrowLeft, UtensilsCrossed, GraduationCap, Calendar, ShoppingCart, HeartPulse, Trophy, Bot, Timer, Gamepad2, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language, translations, TranslationKey } from "@/i18n/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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
    color: "from-purple-500 to-blue-500",
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
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "timer",
    icon: Timer,
    title: t("tourTimer"),
    description: t("tourTimerDesc"),
    color: "from-cyan-500 to-blue-500",
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

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
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23000' width='1' height='1'/%3E%3C/svg%3E"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/intro-background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
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

            {/* Bottom indicator dot */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </motion.div>
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
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-white/20 hover:border-primary/50 hover:bg-white/5"
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
                          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-primary-foreground" />
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
                  className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-glow transition-all group"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
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
                          ? "w-8 bg-primary" 
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
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasMinLength(password) ? "text-primary" : "text-white/50"}>
                          Al menos 6 caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUppercase(password) ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasUppercase(password) ? "text-primary" : "text-white/50"}>
                          Una letra mayúscula (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber(password) ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasNumber(password) ? "text-primary" : "text-white/50"}>
                          Un número (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecialChar(password) ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-white/40" />
                        )}
                        <span className={hasSpecialChar(password) ? "text-primary" : "text-white/50"}>
                          Un caracter especial (!@#$%...)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg transition-all"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    authMode === "signup" ? t("onboardingCreateAccount") : t("login")
                  )}
                </Button>

                {/* Forgot password link - only show on login */}
                {authMode === "login" && !isForgotPassword && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-white/60 hover:text-primary text-sm hover:underline"
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
                      className="w-full border-primary/50 text-primary hover:bg-primary/10"
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
                    className="text-primary hover:underline text-sm font-medium"
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
              step === s ? "bg-primary" : "bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
