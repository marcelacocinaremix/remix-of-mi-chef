import { forwardRef } from "react";
import { Youtube, Instagram } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const YOUTUBE_URL = "https://www.youtube.com/@marcelacocina";
const INSTAGRAM_URL = "https://instagram.com/marcelacocina_ok";

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const { t } = useLanguage();
  
  return (
    <footer ref={ref} className="mt-16 py-8 border-t border-border/50">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">{t("followMe")}</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => window.open(YOUTUBE_URL, "_blank")}
            className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
          >
            <Youtube className="h-5 w-5" />
            <span>@marcelacocina</span>
          </button>
          <button
            onClick={() => window.open(INSTAGRAM_URL, "_blank")}
            className="flex items-center gap-2 text-muted-foreground hover:text-pink-500 transition-colors cursor-pointer"
          >
            <Instagram className="h-6 w-6" />
            <span>@marcelacocina_ok</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          © {new Date().getFullYear()} {t("appName")} - {t("allRightsReserved")}
        </p>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-primary transition-colors">{t("privacyPolicy")}</a>
          <span>•</span>
          <a href="/terms" className="hover:text-primary transition-colors">{t("termsOfService")}</a>
        </div>
      </div>
    </footer>
  );
});