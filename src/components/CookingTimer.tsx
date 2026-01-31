import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface CookingTimerProps {
  minutes: number;
  stepText: string;
  onTimerStart?: () => void;
  onTimerEnd?: () => void;
}

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export function CookingTimer({ minutes, stepText, onTimerStart, onTimerEnd }: CookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [state, setState] = useState<TimerState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const { play: playSound } = useSound();

  const totalSeconds = minutes * 60;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play finish sound
  const playFinishSound = useCallback(() => {
    if (!isMuted) {
      // Play a gentle bell sound
      playSound('notification');
      // Play again after a short delay for emphasis
      setTimeout(() => {
        if (!isMuted) playSound('chime');
      }, 500);
    }
  }, [isMuted, playSound]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setState('finished');
            playFinishSound();
            onTimerEnd?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, timeLeft, playFinishSound, onTimerEnd]);

  const handleStart = () => {
    if (state === 'idle') {
      if (!isMuted) playSound('pop');
      onTimerStart?.();
    }
    setState('running');
  };

  const handlePause = () => {
    setState('paused');
  };

  const handleReset = () => {
    setState('idle');
    setTimeLeft(totalSeconds);
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300",
      state === 'finished' 
        ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
        : "bg-primary/5 border-primary/20"
    )}>
      {/* Timer display */}
      <div className="relative w-24 h-24">
        {/* Progress circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-muted/30"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          <circle
            className={cn(
              "transition-all duration-300",
              state === 'finished' ? "text-green-500" : "text-primary"
            )}
            strokeWidth="8"
            strokeDasharray={264}
            strokeDashoffset={264 - (progress / 100) * 264}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
        </svg>
        
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-mono text-lg font-bold",
            state === 'finished' ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Status text */}
      <p className={cn(
        "text-xs font-medium text-center",
        state === 'finished' 
          ? "text-green-600 dark:text-green-400" 
          : "text-muted-foreground"
      )}>
        {state === 'idle' && `${minutes} minuto${minutes > 1 ? 's' : ''}`}
        {state === 'running' && "En marcha..."}
        {state === 'paused' && "En pausa"}
        {state === 'finished' && "¡Tiempo!"}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {state === 'idle' && (
          <Button
            size="sm"
            onClick={handleStart}
            className="gap-1"
          >
            <Play className="w-4 h-4" />
            Iniciar
          </Button>
        )}

        {state === 'running' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePause}
            className="gap-1"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </Button>
        )}

        {state === 'paused' && (
          <>
            <Button
              size="sm"
              onClick={handleStart}
              className="gap-1"
            >
              <Play className="w-4 h-4" />
              Continuar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}

        {state === 'finished' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </Button>
        )}

        {/* Mute toggle */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMuted(!isMuted)}
          className="w-8 h-8 p-0"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper function to extract time from step text
export function extractTimeFromStep(stepText: string): number | null {
  // Match patterns like: "5 minutos", "10 min", "15 mins", "2-3 minutos", "20 a 25 minutos"
  const patterns = [
    /(\d+)\s*(?:a|-)\s*(\d+)\s*(?:minutos?|mins?|min\.?)/i,
    /(\d+)\s*(?:minutos?|mins?|min\.?)/i,
  ];

  for (const pattern of patterns) {
    const match = stepText.match(pattern);
    if (match) {
      if (match[2]) {
        // Range pattern - use the average
        return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      }
      return parseInt(match[1]);
    }
  }

  // Also check for hours
  const hoursPattern = /(\d+)\s*(?:horas?|hrs?|hs?)/i;
  const hoursMatch = stepText.match(hoursPattern);
  if (hoursMatch) {
    return parseInt(hoursMatch[1]) * 60;
  }

  return null;
}
