import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuestMode, GuestFeature } from "@/hooks/useGuestMode";
import { useNavigate } from "react-router-dom";

const CONTENT: Record<GuestFeature, { emoji: string; title: string; text: string }> = {
  cocinar: {
    emoji: "🍳",
    title: "¡Ya generaste tus 2 recetas gratis!",
    text: "Creá tu cuenta y obtené recetas ilimitadas + 15 días gratis para probar todas las funciones premium.",
  },
  guia: {
    emoji: "📚",
    title: "Seguí aprendiendo con Mi Chef",
    text: "Registrate gratis y desbloqueá tips ilimitados y contenido exclusivo durante 15 días sin costo.",
  },
  jugar: {
    emoji: "🎮",
    title: "¿Te divertiste?",
    text: "Creá tu cuenta gratis y jugá sin límites mientras explorás todas las funciones premium por 15 días.",
  },
  despensa: {
    emoji: "🧂",
    title: "Organizá tu cocina sin límites",
    text: "Registrate gratis y gestioná tu cocina completa con acceso total por 15 días.",
  },
  super: {
    emoji: "🛒",
    title: "Organizá tu cocina sin límites",
    text: "Registrate gratis y gestioná tu lista del súper completa con acceso total por 15 días.",
  },
  planificar: {
    emoji: "📅",
    title: "Planificá toda tu semana",
    text: "Desbloqueá planificación ilimitada creando tu cuenta gratis y probá todas las funciones por 15 días.",
  },
};

interface GuestBlockModalProps {
  open: boolean;
  feature: GuestFeature | null;
  onClose: () => void;
}

export function GuestBlockModal({ open, feature, onClose }: GuestBlockModalProps) {
  const navigate = useNavigate();
  const { exitGuestMode } = useGuestMode();

  const content = feature ? CONTENT[feature] : null;

  const handleSignup = () => {
    exitGuestMode();
    onClose();
    navigate("/auth?mode=signup");
  };

  const handleLogin = () => {
    exitGuestMode();
    onClose();
    navigate("/auth");
  };

  return (
    <AnimatePresence>
      {open && content && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden"
            initial={{ y: 80, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 80, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Gradient top bar */}
            <div className="h-2 bg-gradient-to-r from-primary via-amber-400 to-orange-500" />

            <div className="p-8 text-center">
              {/* Emoji */}
              <div className="text-6xl mb-4">{content.emoji}</div>

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">
                {content.title}
              </h2>

              {/* Text */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {content.text}
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSignup}
                  className="w-full py-6 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta gratis
                </Button>

                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full py-5 text-base rounded-2xl gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Ya tengo cuenta
                </Button>

                <button
                  onClick={onClose}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Seguir explorando
                </button>
              </div>

              {/* Fine print */}
              <p className="text-xs text-muted-foreground mt-4">
                Sin compromiso. Cancelás cuando quieras.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline version for save-recipe block
export function GuestSaveRecipeBlock({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-4">
      <div className="text-4xl">📖</div>
      <h3 className="font-bold text-foreground text-lg">Guardá tus recetas favoritas</h3>
      <p className="text-muted-foreground text-sm">
        Creá tu cuenta gratis para guardar recetas y acceder a todas las funciones por 15 días sin costo.
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={onSignup} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Crear cuenta gratis
        </Button>
        <Button variant="outline" size="sm" onClick={onLogin}>Ya tengo cuenta</Button>
      </div>
    </div>
  );
}
