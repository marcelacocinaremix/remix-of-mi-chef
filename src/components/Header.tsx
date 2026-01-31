import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="text-center mb-10 md:mb-14 animate-fade-in relative">
      {/* Dark Mode Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute right-0 top-0 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card shadow-sm"
        aria-label={theme === "dark" ? t("darkModeLabel") : t("lightModeLabel")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-primary" />
        )}
      </Button>

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
    </header>
  );
}