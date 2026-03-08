import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme, THEMES } from "@/contexts/ThemeContext";
import { useState } from "react";
import { ThemePickerModal } from "@/components/ThemePickerModal";

export function Header() {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentTheme = THEMES.find(t => t.id === theme);

  return (
    <header className="text-center mb-10 md:mb-14 animate-fade-in relative pt-8">
      {/* Header Actions */}
      <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowThemePicker(true)}
          className="rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card shadow-sm"
          aria-label="Cambiar tema de color"
          title={`Tema: ${currentTheme?.label}`}
        >
          <Palette className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {/* Brand Name */}
      <div className="mb-4">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight">
          {t("appName")}
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4">{t("appSubtitle")}</p>
      <div className="decorative-line mb-6" />

      {/* Tagline */}
      <div className="max-w-lg mx-auto">
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {t("headerDescription")}
        </p>
      </div>

      <ThemePickerModal open={showThemePicker} onOpenChange={setShowThemePicker} />
    </header>
  );
}
