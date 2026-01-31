import { useState } from "react";
import { YouTubeRecipes } from "./YouTubeRecipes";
import { MarcelacocinaSection } from "./MarcelacocinaSection";
import { Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import marcelaBanner from "@/assets/marcela-banner.jpg";

type SubTab = "recetas" | "canal";

export const MarcelaSection = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("recetas");
  const { t } = useLanguage();

  const subTabs = [
    { id: "recetas" as SubTab, label: t("subTabYouTubeRecipes"), icon: Video },
    { id: "canal" as SubTab, label: t("subTabChannelCommunity"), icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-2 gap-1.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                  activeSubTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "bg-background/60 hover:bg-background text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", activeSubTab === tab.id && "animate-pulse")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Banner Image */}
      <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={marcelaBanner} 
          alt="Marcela Cocina" 
          className="w-full h-full object-cover transition-all duration-150"
        />
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeSubTab === "recetas" && <YouTubeRecipes onBack={() => {}} />}
        {activeSubTab === "canal" && <MarcelacocinaSection />}
      </div>
    </div>
  );
};
