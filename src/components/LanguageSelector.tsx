import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Language } from "@/i18n/translations";
import { useLanguage } from "@/contexts/LanguageContext";

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "es", name: "Español", flag: "🇦🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

interface LanguageSelectorProps {
  onComplete?: () => void;
  showContinue?: boolean;
}

export function LanguageSelector({ onComplete, showContinue = true }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<Language>(language);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (lang: Language) => {
    setSelected(lang);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    await setLanguage(selected);
    setIsLoading(false);
    onComplete?.();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in bg-white rounded-xl">
      <div className="text-center mb-8">
        <p className="text-muted-foreground mb-1">
          {t("welcomeTo")}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-primary">
          MARCELACOCINA
        </h1>
        <p className="text-lg text-foreground font-medium mb-2">Mi chef</p>
        <p className="text-muted-foreground">
          {t("chooseLanguageToStart")}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:shadow-md",
              selected === lang.code
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="text-3xl">{lang.flag}</span>
            <span className="flex-1 text-left font-medium text-foreground">
              {lang.name}
            </span>
            {selected === lang.code && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {showContinue && (
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? t("loading") : t("continue")}
        </Button>
      )}
    </div>
  );
}
