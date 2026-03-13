import { GraduationCap, Gamepad2, Youtube, User, HeartPulse } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/ThemeContext";

interface MasSectionProps {
  onNavigate: (tab: string) => void;
}

export function MasSection({ onNavigate }: MasSectionProps) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const isFuture = theme === "future";

  const items = [
    {
      id: "aprender",
      label: t("menuLearn"),
      icon: GraduationCap,
      gradient: "from-[hsl(205_100%_50%)] to-[hsl(185_100%_45%)]",
    },
    {
      id: "jugar",
      label: t("menuPlay"),
      icon: Gamepad2,
      gradient: "from-[hsl(265_80%_60%)] to-[hsl(280_80%_65%)]",
    },
    {
      id: "balance",
      label: t("subTabHealth"),
      icon: HeartPulse,
      gradient: "from-[hsl(150_70%_40%)] to-[hsl(165_70%_45%)]",
    },
    {
      id: "marcela",
      label: t("menuRecipes"),
      icon: Youtube,
      gradient: "from-[hsl(0_80%_55%)] to-[hsl(345_80%_55%)]",
    },
    {
      id: "perfil",
      label: t("myProfile"),
      icon: User,
      gradient: "from-[hsl(35_90%_55%)] to-[hsl(20_90%_55%)]",
    },
  ];

  const gridItems = items.slice(0, 4);
  const lastItem = items[4];

  return (
    <div className="space-y-4 px-1 py-2 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground px-1">{t("menuMore")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {gridItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border/50 
                bg-card/80 transition-all duration-200 active:scale-95
                ${isFuture ? "hover:border-primary/50" : "hover:border-border hover:bg-card"}
              `}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient}`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* 5th item centrado */}
      {lastItem && (() => {
        const Icon = lastItem.icon;
        return (
          <button
            onClick={() => onNavigate(lastItem.id)}
            className={`
              w-1/2 mx-auto flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border/50 
              bg-card/80 transition-all duration-200 active:scale-95
              ${isFuture ? "hover:border-primary/50" : "hover:border-border hover:bg-card"}
            `}
          >
            <div className={`p-3 rounded-xl bg-gradient-to-br ${lastItem.gradient}`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">{lastItem.label}</span>
          </button>
        );
      })()}
    </div>
  );
}
