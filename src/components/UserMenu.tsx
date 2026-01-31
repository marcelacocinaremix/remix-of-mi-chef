import { useState } from "react";
import { LogOut, User, Globe, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LanguageSettingsModal } from "@/components/LanguageSettingsModal";
import { UserProfileModal } from "@/components/UserProfileModal";
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
  const navigate = useNavigate();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const languageFlags: Record<string, string> = {
    es: "🇦🇷",
    en: "🇺🇸",
    pt: "🇧🇷",
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
    </>
  );
}
