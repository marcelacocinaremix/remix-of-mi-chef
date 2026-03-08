import { useState } from "react";
import { LogOut, User, Globe, Settings, Crown, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremium } from "@/hooks/usePremium";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { LanguageSettingsModal } from "@/components/LanguageSettingsModal";
import { UserProfileModal } from "@/components/UserProfileModal";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();
  const navigate = useNavigate();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const languageFlags: Record<string, string> = {
    es: "🇦🇷",
    en: "🇺🇸",
    pt: "🇧🇷",
    it: "🇮🇹",
    de: "🇩🇪",
    fr: "🇫🇷",
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLanguageModal(true)}
          className="text-muted-foreground"
        >
          <Globe className="w-4 h-4 mr-1" />
          {languageFlags[language]}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1">
          <User className="w-4 h-4" />
          <span>{t("login")}</span>
          <span className="text-xs text-primary font-medium">{t("free")}</span>
        </Button>
        <LanguageSettingsModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || t("user");

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Plan Status Badge */}
        <button
          onClick={() => setShowSubscription(true)}
          className="cursor-pointer"
        >
          {isPremium ? (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[10px] px-2 py-0.5">
              <Crown className="w-3 h-3" />
              Premium
            </Badge>
          ) : isTrialActive ? (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-[10px] px-2 py-0.5">
              <Clock className="w-3 h-3" />
              Prueba – {trialDaysRemaining}d
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white gap-1 text-xs px-3 py-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Plan gratuito
            </Badge>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              {t("myProfile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLanguageModal(true)}>
              <Globe className="w-4 h-4 mr-2" />
              {t("language")}: {languageFlags[language]}
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
      </div>
      <LanguageSettingsModal open={showLanguageModal} onOpenChange={setShowLanguageModal} />
      <UserProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
      <SubscriptionManager open={showSubscription} onOpenChange={setShowSubscription} />
    </>
  );
}
