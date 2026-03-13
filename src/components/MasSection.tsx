import { GraduationCap, Gamepad2, Youtube, User, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";

interface MasSectionProps {
  onNavigate: (tab: string) => void;
}

export function MasSection({ onNavigate }: MasSectionProps) {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const { hasAnyAccess } = usePremium();
  const isFuture = theme === "future";

  const items = [
    {
      id: "aprender",
      label: t("menuLearn"),
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      requiresAuth: false,
    },
    {
      id: "jugar",
      label: t("menuPlay"),
      icon: Gamepad2,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      requiresAuth: false,
    },
    {
      id: "marcela",
      label: t("menuRecipes"),
      icon: Youtube,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500",
      requiresAuth: false,
    },
    {
      id: "perfil",
      label: t("myProfile"),
      icon: User,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
      requiresAuth: true,
    },
  ];

  return (
    <div className="space-y-4 px-1 py-2 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground px-1">{t("menuMore")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-border/50 
                transition-all duration-200 active:scale-95 hover:shadow-md
                ${item.bgColor} bg-card/80
                ${isFuture ? "hover:border-primary/50 hover:shadow-primary/10" : "hover:border-border"}
              `}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-20`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
