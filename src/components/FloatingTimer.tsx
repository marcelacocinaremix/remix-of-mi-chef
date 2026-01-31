import { Clock, Pause, Play, X } from "lucide-react";
import { useKitchenTimer } from "@/hooks/useKitchenTimer";

interface FloatingTimerProps {
  activeTab: string;
  onNavigateToTimer: () => void;
}

export function FloatingTimer({ activeTab, onNavigateToTimer }: FloatingTimerProps) {
  const { remainingSeconds, isRunning, isFinished, startPause, reset } = useKitchenTimer();

  // Only show when timer is running/finished AND not on the timer tab
  if (activeTab === "reloj" || (!isRunning && !isFinished)) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (isFinished) return "bg-destructive";
    if (remainingSeconds <= 30) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div 
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 ${getTimerColor()} text-white`}
        onClick={onNavigateToTimer}
      >
        <Clock className={`w-5 h-5 ${isFinished ? "animate-bounce" : isRunning ? "animate-pulse" : ""}`} />
        <span className="font-mono font-bold text-lg">
          {formatTime(remainingSeconds)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            startPause();
          }}
          className="ml-1 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="ml-1 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {isFinished && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
      )}
    </div>
  );
}