import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getMilestoneInfo } from "@/hooks/useStreak";
import confetti from "canvas-confetti";

interface StreakCelebrationSheetProps {
  milestone: number | null;
  onDismiss: () => void;
}

export function StreakCelebrationSheet({ milestone, onDismiss }: StreakCelebrationSheetProps) {
  const info = milestone ? getMilestoneInfo(milestone) : null;
  const confettiFired = useRef(false);
  const lastMilestoneRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only trigger the sheet when a NEW milestone value arrives (not on re-renders with same value)
    if (milestone && info && milestone !== lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      confettiFired.current = false;
      // Short delay prevents flash when streak is recorded on mount
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } else if (!milestone) {
      // Only hide when milestone is explicitly cleared
      lastMilestoneRef.current = null;
      confettiFired.current = false;
      setVisible(false);
    }
    // Intentionally NOT reacting to `info` changes to prevent oscillation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone]);

  useEffect(() => {
    if (visible && milestone && info && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f97316", "#fb923c", "#fbbf24", "#ef4444", "#fde68a"],
      });
    }
  }, [visible, milestone, info]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for exit animation before clearing the parent state
    setTimeout(() => {
      onDismiss();
    }, 350);
  };

  return (
    <AnimatePresence>
      {visible && milestone && info && (
        <>
          {/* Backdrop — clicking backdrop does nothing, prevents accidental dismiss */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-gradient-to-b from-card to-background border-t border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Drag handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border/60" />

            <div className="px-6 pt-6 pb-10 flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
              {/* Flame animation */}
              <motion.div
                initial={{ scale: 0.4, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.15, damping: 14 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/30 to-amber-500/20 border-2 border-orange-400/40 flex items-center justify-center text-6xl shadow-lg">
                  {info.emoji}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border-2 border-orange-400/30"
                />
              </motion.div>

              {/* Milestone badge */}
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-400/30 rounded-full px-4 py-1.5">
                <span className="text-orange-500 font-black text-lg">🔥 {milestone}</span>
                <span className="text-orange-500 font-semibold text-sm">días seguidos</span>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-black text-foreground leading-tight">
                  {info.title}
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {info.message}
                </p>
              </div>

              {/* Achievement badge for major milestones */}
              {[30, 60, 90].includes(milestone) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-xl px-4 py-3 w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">¡Logro desbloqueado!</p>
                      <p className="text-xs text-muted-foreground">{milestone} días cocinando — guardado en tus Logros</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDismiss}
                className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-2xl text-base shadow-lg active:opacity-90 transition-opacity w-full justify-center"
              >
                ¡Genial!
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
