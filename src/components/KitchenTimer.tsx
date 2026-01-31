import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX, Timer, Egg, Coffee, Soup, Clock, ChefHat } from "lucide-react";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function KitchenTimer() {
  const { t } = useLanguage();
  
  const PRESET_TIMES = [
    { label: "1 min", seconds: 60, emoji: "⏱️", description: t('greenTea') },
    { label: "3 min", seconds: 180, emoji: "🥚", description: t('softEgg') },
    { label: "5 min", seconds: 300, emoji: "☕", description: t('perfectCoffee') },
    { label: "10 min", seconds: 600, emoji: "🍳", description: t('hardEgg') },
    { label: "15 min", seconds: 900, emoji: "🍝", description: t('aldentePasta') },
    { label: "30 min", seconds: 1800, emoji: "🍲", description: t('quickStew') },
  ];

  const {
    totalSeconds,
    remainingSeconds,
    isRunning,
    isFinished,
    soundEnabled,
    setSoundEnabled,
    startPause,
    reset,
    selectPreset,
    adjustTime,
  } = useKitchenTimer();

  // Calculate progress percentage
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  
  // Calculate stroke dasharray for the circular progress
  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get color based on remaining time
  const getTimerGradient = () => {
    const percentRemaining = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
    if (isFinished) return { start: "#ef4444", end: "#dc2626", glow: "rgba(239, 68, 68, 0.5)" };
    if (percentRemaining <= 10) return { start: "#ef4444", end: "#f97316", glow: "rgba(239, 68, 68, 0.4)" };
    if (percentRemaining <= 25) return { start: "#f97316", end: "#eab308", glow: "rgba(249, 115, 22, 0.4)" };
    if (percentRemaining <= 50) return { start: "#eab308", end: "#84cc16", glow: "rgba(234, 179, 8, 0.3)" };
    return { start: "#22c55e", end: "#06b6d4", glow: "rgba(34, 197, 94, 0.3)" };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timerColors = getTimerGradient();

  return (
    <div className="space-y-4">
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-3xl" />
        {isRunning && (
          <>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
          </>
        )}
      </div>

      <div className="relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-500",
                isRunning 
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30" 
                  : isFinished 
                    ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/30 animate-pulse"
                    : "bg-gradient-to-br from-primary to-primary/80"
              )}>
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {t('kitchenTimer')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('timeAssistant')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "rounded-full transition-all duration-300",
                soundEnabled 
                  ? "text-primary hover:text-primary hover:bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>

          {/* Timer Display */}
          <div className="relative w-72 h-72 md:w-80 md:h-80">
            {/* Outer glow ring */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-1000",
                isRunning && "animate-pulse"
              )}
              style={{ 
                background: `radial-gradient(circle, ${timerColors.glow} 0%, transparent 70%)`,
                transform: 'scale(1.1)'
              }}
            />
            
            {/* Decorative rotating ring */}
            {isRunning && (
              <svg 
                className="absolute inset-0 w-full h-full animate-spin" 
                style={{ animationDuration: '20s' }}
                viewBox="0 0 300 300"
              >
                <defs>
                  <linearGradient id="rotatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={timerColors.start} stopOpacity="0.3" />
                    <stop offset="50%" stopColor="transparent" />
                    <stop offset="100%" stopColor={timerColors.end} stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <circle
                  cx="150"
                  cy="150"
                  r="145"
                  fill="none"
                  stroke="url(#rotatingGradient)"
                  strokeWidth="2"
                  strokeDasharray="20 40"
                />
              </svg>
            )}

            {/* Main SVG */}
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={timerColors.start} />
                  <stop offset="100%" stopColor={timerColors.end} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background circle with pattern */}
              <circle
                cx="150"
                cy="150"
                r="130"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="14"
                strokeOpacity="0.3"
              />
              
              {/* Track marks */}
              {[...Array(60)].map((_, i) => {
                const isMajor = i % 5 === 0;
                const angle = (i * 6 - 90) * (Math.PI / 180);
                const innerR = isMajor ? 115 : 120;
                const outerR = 125;
                const x1 = 150 + innerR * Math.cos(angle);
                const y1 = 150 + innerR * Math.sin(angle);
                const x2 = 150 + outerR * Math.cos(angle);
                const y2 = 150 + outerR * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? "hsl(var(--muted-foreground))" : "hsl(var(--muted))"}
                    strokeWidth={isMajor ? 2 : 1}
                    strokeOpacity={isMajor ? 0.5 : 0.3}
                  />
                );
              })}
              
              {/* Progress circle */}
              <circle
                cx="150"
                cy="150"
                r="130"
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                filter={isFinished || (isRunning && remainingSeconds <= totalSeconds * 0.25) ? "url(#glow)" : undefined}
              />
            </svg>

            {/* Inner content */}
            <div 
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center z-20",
                isFinished && "animate-pulse"
              )}
            >
              {/* Time display */}
              <div className="relative">
                <span 
                  className={cn(
                    "text-5xl md:text-6xl font-mono font-bold tracking-tight transition-all duration-300",
                    isFinished && "animate-bounce"
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${timerColors.start}, ${timerColors.end})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: isFinished ? `0 0 30px ${timerColors.glow}` : 'none'
                  }}
                >
                  {formatTime(remainingSeconds)}
                </span>
              </div>
              
              {/* Status indicator */}
              <div className="mt-3 h-6">
                {isFinished && (
                  <div className="flex items-center gap-2 text-destructive animate-bounce">
                    <ChefHat className="w-5 h-5" />
                    <span className="font-semibold">{t('time')}</span>
                  </div>
                )}
                {isRunning && !isFinished && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm">{t('inProgress')}</span>
                  </div>
                )}
                {!isRunning && !isFinished && totalSeconds > 0 && (
                  <span className="text-sm text-muted-foreground">{t('readyToStart')}</span>
                )}
              </div>
            </div>

            {/* Particle effects when finished */}
            {isFinished && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full animate-ping"
                    style={{
                      background: i % 2 === 0 ? timerColors.start : timerColors.end,
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.5s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Time adjustment buttons */}
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustTime(-60)}
              disabled={isRunning || totalSeconds <= 60}
              className={cn(
                "h-14 w-14 rounded-full border-2 transition-all duration-300",
                "hover:scale-110 hover:border-primary hover:bg-primary/10",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
            >
              <Minus className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">
                {Math.floor(totalSeconds / 60)}
              </span>
              <span className="text-sm text-muted-foreground block">{t('minutes')}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustTime(60)}
              disabled={isRunning || totalSeconds >= 3600}
              className={cn(
                "h-14 w-14 rounded-full border-2 transition-all duration-300",
                "hover:scale-110 hover:border-primary hover:bg-primary/10",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="lg"
              onClick={reset}
              className={cn(
                "h-16 w-16 rounded-full border-2 transition-all duration-300",
                "hover:scale-110 hover:rotate-[-180deg] hover:border-amber-500 hover:bg-amber-500/10"
              )}
            >
              <RotateCcw className="w-7 h-7" />
            </Button>
            <Button
              size="lg"
              onClick={startPause}
              className={cn(
                "h-20 w-20 rounded-full transition-all duration-500 shadow-xl",
                "hover:scale-110 hover:shadow-2xl",
                isRunning 
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/40" 
                  : isFinished
                    ? "bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/40 animate-pulse"
                    : "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/40"
              )}
            >
              {isRunning ? (
                <Pause className="w-9 h-9 text-white" />
              ) : (
                <Play className="w-9 h-9 ml-1 text-white" />
              )}
            </Button>
          </div>

          {/* Preset times */}
          <div className="w-full">
            <p className="text-sm font-medium text-center mb-4 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {t('quickTimes')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_TIMES.map((preset) => {
                const isSelected = totalSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    onClick={() => selectPreset(preset.seconds)}
                    disabled={isRunning}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-300",
                      "hover:scale-105 disabled:opacity-50 disabled:hover:scale-100",
                      isSelected 
                        ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/20" 
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5 bg-secondary/30"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{preset.emoji}</span>
                      <span className={cn(
                        "font-bold transition-colors",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {preset.description}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 rounded-xl p-4 w-full border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>💡</div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t('marcelaTip')}</span> {t('timerTip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
