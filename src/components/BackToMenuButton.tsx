import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { RefObject } from "react";

interface BackToMenuButtonProps {
  className?: string;
  scrollContainerRef?: RefObject<HTMLDivElement>;
}

export function BackToMenuButton({ className, scrollContainerRef }: BackToMenuButtonProps) {
  const { t } = useLanguage();

  const scrollToMenu = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`flex justify-center pt-8 pb-4 ${className || ''}`}>
      <Button
        variant="outline"
        size="lg"
        onClick={scrollToMenu}
        className="gap-2 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50"
      >
        <ArrowUp className="w-4 h-4" />
        {t("backToMenu")}
      </Button>
    </div>
  );
}
