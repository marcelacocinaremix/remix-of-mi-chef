import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguageSettingsModal({ open, onOpenChange }: LanguageSettingsModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {t("changeLanguage")}
          </DialogTitle>
        </DialogHeader>
        <LanguageSelector 
          onComplete={() => onOpenChange(false)} 
          showContinue={true}
        />
      </DialogContent>
    </Dialog>
  );
}
