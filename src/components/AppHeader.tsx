import { useState } from "react";
import { Youtube, Instagram, Users, LogOut, User, Globe, Settings, Crown, Clock, Sparkles, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { useNavigate } from "react-router-dom";
import { useAppTheme, THEMES } from "@/contexts/ThemeContext";
import { LanguageSettingsModal } from "@/components/LanguageSettingsModal";
import { UserProfileModal } from "@/components/UserProfileModal";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { ThemePickerModal } from "@/components/ThemePickerModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();
  const { theme } = useAppTheme();
  const navigate = useNavigate();

  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentThemeLabel = THEMES.find(th => th.id === theme)?.label ?? "Tema";
  const languageFlags: Record<string, string> = {
    es: "🇦🇷", en: "🇺🇸", pt: "🇧🇷", it: "🇮🇹", de: "🇩🇪", fr: "🇫🇷",
  };

  const displayName = user
    ? (user.user_metadata?.display_name || user.email?.split("@")[0] || t("user"))
    : null;

  return (
    <header className="flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
      {/* LEFT: Community button */}
      <div className="w-24 flex items-center">
        <DropdownMenu open={showCommunityMenu} onOpenChange={setShowCommunityMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground px-2"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs hidden xs:inline">Comunidad</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => window.open("https://www.youtube.com/@marcelacocina", "_blank")}>
              <Youtube className="w-4 h-4 mr-2 text-red-500" />
              YouTube
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://instagram.com/marcelacocina_ok", "_blank", "noopener,noreferrer")}>
              <Instagram className="w-4 h-4 mr-2 text-pink-500" />
              Instagram
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CENTER: Logo */}
      <div className="flex items-center gap-2 cursor-pointer select-none">
        <img src={logo} alt="Mi Chef" className="h-8 w-8 object-contain" />
        <span className="font-display font-semibold text-base text-foreground tracking-tight hidden sm:inline">
          Mi Chef
        </span>
      </div>

      {/* RIGHT: Profile / Login */}
      <div className="w-24 flex items-center justify-end">
        {!user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="gap-1 text-xs px-2"
          >
            <User className="w-4 h-4" />
            <span className="hidden xs:inline">{t("login")}</span>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 group">
                {isPremium ? (
                  <Badge className="bg-amber-500 text-white gap-1 text-[10px] px-1.5 py-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    Premium
                  </Badge>
                ) : isTrialActive ? (
                  <Badge className="bg-emerald-500 text-white gap-1 text-[10px] px-1.5 py-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {trialDaysRemaining}d
                  </Badge>
                ) : null}
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 text-sm font-medium text-foreground truncate border-b border-border/50 mb-1">
                {displayName}
              </div>
              <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                <Settings className="w-4 h-4 mr-2" />
                {t("myProfile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLanguageModal(true)}>
                <Globe className="w-4 h-4 mr-2" />
                {t("language")}: {languageFlags[language]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowThemePicker(true)}>
                <Palette className="w-4 h-4 mr-2" />
                Tema: {currentThemeLabel}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSubscription(true)}>
                <Crown className="w-4 h-4 mr-2" />
                Mi plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Modals */}
      <LanguageSettingsModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
      <UserProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
      <SubscriptionManager open={showSubscription} onOpenChange={setShowSubscription} />
      <ThemePickerModal open={showThemePicker} onOpenChange={setShowThemePicker} />
    </header>
  );
}
