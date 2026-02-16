import { Trophy, Flame, ChefHat, Star, Lock, Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements, Achievement } from "@/hooks/useAchievements";
import { useLanguage } from "@/contexts/LanguageContext";

function AchievementCard({ achievement, isCompact = false, index = 0 }: { achievement: Achievement; isCompact?: boolean; index?: number }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-500 overflow-hidden group",
        achievement.isUnlocked
          ? "bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-primary/40 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-primary/60"
          : "bg-muted/30 border-border/30 opacity-70 hover:opacity-90",
        isCompact ? "p-3" : "p-4"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect for unlocked */}
      {achievement.isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={cn(
            "flex items-center justify-center rounded-full transition-all duration-500",
            achievement.isUnlocked 
              ? "bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse-glow shadow-lg" 
              : "bg-muted",
            isCompact ? "w-12 h-12 text-xl" : "w-14 h-14 text-2xl"
          )}
        >
          {achievement.isUnlocked ? (
            <span className="animate-swing">{achievement.icon}</span>
          ) : (
            <Lock className={cn("text-muted-foreground", isCompact ? "w-4 h-4" : "w-5 h-5")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold truncate",
            achievement.isUnlocked ? "text-foreground" : "text-muted-foreground",
            isCompact ? "text-sm" : "text-base"
          )}>
            {achievement.title}
          </h4>
          <p className={cn(
            "text-muted-foreground truncate",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {achievement.description}
          </p>
        </div>
        {achievement.isUnlocked && (
          <div className="relative">
            <Trophy className={cn("text-primary animate-heartbeat", isCompact ? "w-5 h-5" : "w-6 h-6")} />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

export function AchievementsSection() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { achievements, stats, isLoading, marcelaMessage, getNextAchievement } = useAchievements();

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-card via-primary/5 to-card rounded-2xl p-8 border border-primary/20 text-center shadow-lg">
        <div className="relative inline-block mb-4">
          <Trophy className="w-16 h-16 text-primary/50 mx-auto animate-float" />
          <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          🏆 {t("achievementsTitle")}
        </h3>
        <p className="text-muted-foreground">
          {t("achievementsLoginRequired")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-8 border border-primary/20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground animate-pulse">{t("achievementsLoading")}</p>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);
  const nextAchievement = getNextAchievement();

  return (
    <div className="space-y-6">
      {/* How achievements work */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl p-4 border border-primary/20 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">¿Cómo sumo logros?</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              Completando el <span className="font-medium text-foreground">Modo Cocina</span> de una receta generada
            </li>
            <li className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              Pulsando <span className="font-medium text-foreground">"Ya la cociné"</span> en el detalle de la receta
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Overview with enhanced visuals */}
      <div className="relative bg-gradient-to-br from-card via-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/20 shadow-xl overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {t("achievementsMyStats")}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="group relative bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <ChefHat className="w-7 h-7 text-emerald-400 mx-auto mb-2 group-hover:animate-swing" />
              <p className="text-3xl font-bold text-foreground text-center">{stats.totalRecipesCooked}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">{t("achievementsRecipes")}</p>
            </div>
            <div className="group relative bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <Flame className="w-7 h-7 text-orange-400 mx-auto mb-2 group-hover:animate-heartbeat" />
              <p className="text-3xl font-bold text-foreground text-center">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">{t("achievementsCurrentStreak")}</p>
            </div>
            <div className="group relative bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <Star className="w-7 h-7 text-yellow-400 mx-auto mb-2 fill-yellow-400/50 group-hover:animate-pulse" />
              <p className="text-3xl font-bold text-foreground text-center">{stats.longestStreak}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">{t("achievementsBestStreak")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Achievement Progress with enhanced design */}
      {nextAchievement && (
        <div className="relative bg-gradient-to-br from-card via-accent/10 to-primary/10 rounded-2xl p-5 border border-accent/30 shadow-lg overflow-hidden group">
          {/* Animated glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 via-accent/30 to-primary/20 flex items-center justify-center text-2xl border-2 border-primary/30 shadow-lg animate-pulse-glow">
                  {nextAchievement.icon}
                </div>
                <Zap className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 fill-yellow-400 animate-heartbeat" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {t("achievementsNextAchievement")}
                  </span>
                </div>
                <h4 className="font-bold text-lg text-foreground">{nextAchievement.title}</h4>
                <p className="text-sm text-muted-foreground">{nextAchievement.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Progress 
                  value={(nextAchievement.progress / nextAchievement.target) * 100} 
                  className="h-3 bg-muted/50"
                />
                <div 
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-500 animate-rainbow"
                  style={{ width: `${(nextAchievement.progress / nextAchievement.target) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {nextAchievement.progress} / {nextAchievement.target} {t("achievementsRecipesCount")}
                </p>
                <p className="text-xs font-medium text-primary">
                  {Math.round((nextAchievement.progress / nextAchievement.target) * 100)}% {t("achievementsCompleted")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Message with icon-based design */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl p-5 border border-primary/30 overflow-hidden shadow-lg">
        {/* Sparkle decorations */}
        <div className="absolute top-2 right-4 text-yellow-400 animate-pulse">✨</div>
        <div className="absolute bottom-4 right-8 text-sky-400 animate-pulse" style={{ animationDelay: '0.5s' }}>💫</div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20 shadow-inner">
            <p className="font-semibold text-foreground text-sm mb-1 flex items-center gap-2">
              {t("achievementsMarcelaSays")} <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </p>
            <p className="text-muted-foreground text-sm italic leading-relaxed">"{marcelaMessage}"</p>
          </div>
        </div>
      </div>

      {/* Unlocked Achievements with enhanced cards */}
      {unlockedAchievements.length > 0 && (
        <div className="relative bg-gradient-to-br from-card via-emerald-500/5 to-card rounded-2xl p-5 border border-emerald-500/20 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 text-3xl opacity-20 animate-float">🏆</div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{t("achievementsUnlocked")}</h3>
              <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                {unlockedAchievements.length}
              </span>
            </div>
            <div className="grid gap-3">
              {unlockedAchievements.map((achievement, index) => (
                <AchievementCard key={achievement.id} achievement={achievement} isCompact index={index} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Locked Achievements with motivation */}
      {lockedAchievements.length > 0 && (
        <div className="relative bg-gradient-to-br from-card via-muted/30 to-card rounded-2xl p-5 border border-border/50 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 text-3xl opacity-10 animate-pulse">🔒</div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted-foreground/50 to-muted-foreground/30 flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{t("achievementsToUnlock")}</h3>
              <span className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {lockedAchievements.length}
              </span>
            </div>
            <div className="grid gap-3">
              {lockedAchievements.map((achievement, index) => (
                <AchievementCard key={achievement.id} achievement={achievement} isCompact index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
