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
    <header className="text-center mb-8 md:mb-12 animate-fade-in relative">
      {/* Dark Mode Toggle - Futuristic */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute right-0 top-0 rounded-xl bg-card/60 backdrop-blur-md border border-border/30 hover:bg-card hover:border-primary/30 shadow-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]"
        aria-label={theme === "dark" ? t("darkModeLabel") : t("lightModeLabel")}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
        ) : (
          <Moon className="h-4 w-4 text-primary" strokeWidth={1.5} />
        )}
      </Button>

      {/* Brand Name - Minimal */}
      <div className="mb-3">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium text-foreground tracking-tight">
          {t("appName")}
        </h1>
      </div>

      {/* Subtitle - Clean */}
      <p className="text-[10px] tracking-[0.35em] text-muted-foreground/80 uppercase mb-3">{t("appSubtitle")}</p>
      
      {/* Minimal decorative line */}
      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-5 opacity-60" />

      {/* Tagline - Subtle */}
      <div className="max-w-md mx-auto">
        <p className="text-sm text-muted-foreground/70 leading-relaxed font-light">
          {t("headerDescription")}
        </p>
      </div>
    </header>
  );
}