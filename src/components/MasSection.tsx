import { GraduationCap, Gamepad2, Youtube, User, Activity, Lightbulb, Palette, Trophy, History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { ThemePickerModal } from "@/components/ThemePickerModal";

interface MasSectionProps {
  onNavigate: (tab: string) => void;
}

export function MasSection({ onNavigate }: MasSectionProps) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isFuture = theme === "future";
  const [showThemes, setShowThemes] = useState(false);

  const items = [
    { id: "aprender", label: t("menuLearn"),          icon: GraduationCap },
    { id: "jugar",    label: t("menuPlay"),            icon: Gamepad2      },
    { id: "guia",     label: t("learnTabGuia"),        icon: Lightbulb     },
    { id: "balance",  label: t("subTabHealth"),        icon: Activity      },
    { id: "logros",   label: t("subTabAchievements"), icon: Trophy        },
    { id: "marcela",  label: t("menuRecipes"),         icon: Youtube       },
    { id: "perfil",   label: t("myProfile"),           icon: User          },
  ];

  const renderButton = (item: typeof items[0]) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`
          flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 dark:border-border/50
          bg-card transition-all duration-200 active:scale-95
          ${isFuture ? "hover:border-primary/50" : "hover:border-border hover:bg-accent/30"}
        `}
      >
        <Icon size={32} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200" />
        <span className="text-sm font-medium text-foreground">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4 px-1 py-2 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground px-1">{t("menuMore")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.slice(0, 4).map(renderButton)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.slice(4).map(renderButton)}
        {/* Temas */}
        <button
          onClick={() => setShowThemes(true)}
          className={`
            flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 dark:border-border/50
            bg-card transition-all duration-200 active:scale-95
            ${isFuture ? "hover:border-primary/50" : "hover:border-border hover:bg-accent/30"}
          `}
        >
          <Palette size={32} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200" />
          <span className="text-sm font-medium text-foreground">Temas</span>
        </button>
      </div>
      <ThemePickerModal open={showThemes} onOpenChange={setShowThemes} />
    </div>
  );
}
