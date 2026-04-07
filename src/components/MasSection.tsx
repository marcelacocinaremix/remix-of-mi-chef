import { GraduationCap, Gamepad2, Youtube, User, Activity, Lightbulb, Palette, Trophy, History, CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { ThemePickerModal } from "@/components/ThemePickerModal";
import { MasSkeleton } from "@/components/skeletons/TabSkeletons";

interface MasSectionProps {
  onNavigate: (tab: string) => void;
}

export function MasSection({ onNavigate }: MasSectionProps) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isFuture = theme === "future";
  const [showThemes, setShowThemes] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return <MasSkeleton />;

  const items = [
    { id: "calendario", label: t("menuPlan"),            icon: CalendarDays  },
    { id: "aprender", label: t("menuLearn"),          icon: GraduationCap },
    { id: "jugar",    label: t("menuPlay"),            icon: Gamepad2      },
    { id: "guia",     label: t("learnTabGuia"),        icon: Lightbulb     },
    { id: "balance",  label: t("subTabHealth"),        icon: Activity      },
    { id: "logros",   label: t("subTabAchievements"), icon: Trophy        },
    { id: "historial",label: "Historial de recetas",   icon: History       },
    { id: "marcela",  label: t("menuRecipes"),         icon: Youtube       },
    { id: "perfil",   label: t("myProfile"),           icon: User          },
  ];

  const allItems = [
    ...items,
    { id: "temas", label: "Temas", icon: Palette },
  ];

  return (
    <div className="space-y-3 px-1 py-2 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground px-1">{t("menuMore")}</h2>
      <div className="grid grid-cols-3 gap-3">
        {allItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.id === "temas" ? setShowThemes(true) : onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border border-border/40
                bg-card transition-all duration-200 active:scale-95
                ${isFuture ? "hover:border-primary/50" : "hover:bg-accent/30"}
              `}
            >
              <Icon size={28} strokeWidth={1.5} className="text-foreground/80" />
              <span className="text-xs font-medium text-foreground/70 leading-tight text-center px-1">{item.label}</span>
            </button>
          );
        })}
      </div>
      <ThemePickerModal open={showThemes} onOpenChange={setShowThemes} />
    </div>
  );
}
