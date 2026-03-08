import { useEffect, useState } from "react";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubscriptionManager } from "@/components/SubscriptionManager";

const getStorageKeys = (userId: string) => ({
  notice15: `trial_notice_15_shown_${userId}`,
  notice10: `trial_notice_10_shown_${userId}`,
  notice5: `trial_notice_5_shown_${userId}`,
});

type NoticeVariant = "15" | "10" | "5" | null;

interface NoticeConfig {
  emoji: string;
  title: string;
  body: string;
  showPremiumBtn: boolean;
}

const NOTICES: Record<NonNullable<NoticeVariant>, NoticeConfig> = {
  "15": {
    emoji: "🎉",
    title: "Tenés 15 días de prueba",
    body: `Durante los próximos 15 días podés explorar todas las funciones de la app.\n\nLa generación de recetas tiene un límite diario, pero vas a poder usar el resto de las herramientas normalmente.\n\nCuando termine el período de prueba, la app seguirá funcionando en modo gratuito con algunas limitaciones.\n\nSi querés desbloquear todas las funciones y más generación de recetas, podés activar Mi Chef Premium en cualquier momento.`,
    showPremiumBtn: true,
  },
  "10": {
    emoji: "⏳",
    title: "Te quedan 10 días de prueba",
    body: `Todavía te quedan 10 días para seguir explorando todas las funciones de la app.\n\nDespués del período de prueba, la app seguirá disponible en modo gratuito con algunas limitaciones.\n\nSi querés mantener acceso completo y más generación de recetas, podés activar Mi Chef Premium en cualquier momento.`,
    showPremiumBtn: true,
  },
  "5": {
    emoji: "⚠️",
    title: "Tu prueba termina en 5 días",
    body: `Tu período de prueba está por terminar.\n\nCuando finalice, la app seguirá funcionando en modo gratuito con algunas limitaciones.\n\nSi querés mantener todas las funciones desbloqueadas y generar más recetas, podés activar Mi Chef Premium.`,
    showPremiumBtn: true,
  },
};

function getNoticeToShow(trialDaysRemaining: number, isTrialActive: boolean, userId: string): NoticeVariant {
  if (!isTrialActive) return null;
  const keys = getStorageKeys(userId);

  if (trialDaysRemaining >= 13 && !localStorage.getItem(keys.notice15)) {
    return "15";
  }
  if (trialDaysRemaining <= 10 && trialDaysRemaining > 5 && !localStorage.getItem(keys.notice10)) {
    return "10";
  }
  if (trialDaysRemaining <= 5 && trialDaysRemaining > 0 && !localStorage.getItem(keys.notice5)) {
    return "5";
  }
  return null;
}

export function TrialNoticeModal() {
  const { user } = useAuth();
  const { isTrialActive, trialDaysRemaining, isLoading } = usePremium();
  const [variant, setVariant] = useState<NoticeVariant>(null);
  const [open, setOpen] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  useEffect(() => {
    if (isLoading || !user || !isTrialActive) return;

    const toShow = getNoticeToShow(trialDaysRemaining, isTrialActive, user.id);
    if (toShow) {
      const timer = setTimeout(() => {
        setVariant(toShow);
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isTrialActive, trialDaysRemaining]);

  const handleClose = () => {
    if (variant && user) {
      const keys = getStorageKeys(user.id);
      const keyMap: Record<NonNullable<NoticeVariant>, string> = {
        "15": keys.notice15,
        "10": keys.notice10,
        "5": keys.notice5,
      };
      localStorage.setItem(keyMap[variant], "true");
    }
    setOpen(false);
  };

  const handleViewPremium = () => {
    handleClose();
    setTimeout(() => setShowSubscription(true), 300);
  };

  if (!variant) return null;

  const config = NOTICES[variant];

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-sm [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">{config.emoji}</span>
              {config.title}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              {config.body.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </DialogDescription>
          <div className="flex flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Continuar
            </Button>
            {config.showPremiumBtn && (
              <Button
                onClick={handleViewPremium}
                className="flex-1 font-semibold"
                variant="default"
              >
                Ver Premium
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionManager open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  );
}
