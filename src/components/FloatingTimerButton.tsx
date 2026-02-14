import { useState } from "react";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MiniKitchenTimer } from "@/components/MiniKitchenTimer";

export function FloatingTimerButton() {
  const { t } = useLanguage();
  const [showTimer, setShowTimer] = useState(false);

  return (
    <>
      <div className="fixed z-50" style={{ bottom: "110px", right: "20px" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTimer(true)}
          className="rounded-full bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-card shadow-lg hover:scale-105 transition-transform h-11 w-11"
          aria-label={t("kitchenTimer")}
        >
          <Timer className="h-5 w-5 text-primary" />
        </Button>
      </div>

      <Dialog open={showTimer} onOpenChange={setShowTimer}>
        <DialogContent className="max-w-[260px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4 text-primary" />
              {t("kitchenTimer")}
            </DialogTitle>
          </DialogHeader>
          <MiniKitchenTimer />
        </DialogContent>
      </Dialog>
    </>
  );
}
