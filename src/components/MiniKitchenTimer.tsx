import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX } from "lucide-react";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function MiniKitchenTimer() {
  const { t } = useLanguage();
  
  const PRESET_TIMES = [
    { label: "1m", seconds: 60 },
    { label: "3m", seconds: 180 },
    { label: "5m", seconds: 300 },
    { label: "10m", seconds: 600 },
    { label: "15m", seconds: 900 },
    { label: "30m", seconds: 1800 },
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

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    const percentRemaining = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
    if (isFinished) return "hsl(var(--destructive))";
    if (percentRemaining <= 25) return "#f97316";
    return "hsl(var(--primary))";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Sound toggle */}
      <div className="flex justify-end w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-8 w-8 p-0"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </div>

      {/* Timer Circle */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            strokeOpacity="0.3"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          isFinished && "animate-pulse"
        )}>
          <span className="text-2xl font-mono font-bold" style={{ color: getColor() }}>
            {formatTime(remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Time adjustment */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustTime(-60)}
          disabled={isRunning || totalSeconds <= 60}
          className="h-9 w-9 rounded-full"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium w-12 text-center">
          {Math.floor(totalSeconds / 60)} min
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustTime(60)}
          disabled={isRunning || totalSeconds >= 3600}
          className="h-9 w-9 rounded-full"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className="h-10 w-10 rounded-full"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          onClick={startPause}
          className={cn(
            "h-12 w-12 rounded-full",
            isRunning 
              ? "bg-amber-500 hover:bg-amber-600" 
              : isFinished
                ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                : "bg-primary hover:bg-primary/90"
          )}
        >
          {isRunning ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 ml-0.5 text-white" />
          )}
        </Button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {PRESET_TIMES.map((preset) => (
          <button
            key={preset.seconds}
            onClick={() => selectPreset(preset.seconds)}
            disabled={isRunning}
            className={cn(
              "py-2 px-3 rounded-lg text-xs font-medium transition-all",
              "border disabled:opacity-50",
              totalSeconds === preset.seconds
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
