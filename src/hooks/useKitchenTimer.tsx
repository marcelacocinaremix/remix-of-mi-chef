import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useSound } from "@/hooks/useSound";

interface KitchenTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
  soundEnabled: boolean;
  isAlarmRinging: boolean;
}

interface KitchenTimerContextType extends KitchenTimerState {
  setTotalSeconds: (seconds: number) => void;
  setRemainingSeconds: (seconds: number) => void;
  setIsRunning: (running: boolean) => void;
  setIsFinished: (finished: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  startPause: () => void;
  reset: () => void;
  selectPreset: (seconds: number) => void;
  adjustTime: (delta: number) => void;
  stopAlarm: () => void;
}

const KitchenTimerContext = createContext<KitchenTimerContextType | null>(null);

export function KitchenTimerProvider({ children }: { children: ReactNode }) {
  const [totalSeconds, setTotalSeconds] = useState(300);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { play: playSound } = useSound();

  // Stop alarm function
  const stopAlarm = useCallback(() => {
    setIsAlarmRinging(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  // Alarm sound loop
  useEffect(() => {
    if (isAlarmRinging && soundEnabled) {
      // Play immediately
      playSound("chime");
      
      // Keep playing every 1.5 seconds
      alarmIntervalRef.current = setInterval(() => {
        playSound("chime");
      }, 1500);
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [isAlarmRinging, soundEnabled, playSound]);

  // Timer logic
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            setIsAlarmRinging(true);
            return 0;
          }
          if (prev <= 11 && soundEnabled) {
            playSound("pop");
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, soundEnabled, playSound]);

  const startPause = useCallback(() => {
    if (isFinished) {
      stopAlarm();
      setIsRunning(false);
      setRemainingSeconds(totalSeconds);
      setIsFinished(false);
      return;
    }
    setIsRunning((prev) => !prev);
    if (!isRunning && soundEnabled) {
      playSound("pop");
    }
  }, [isFinished, isRunning, soundEnabled, totalSeconds, playSound, stopAlarm]);

  const reset = useCallback(() => {
    stopAlarm();
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setIsFinished(false);
    if (soundEnabled) playSound("pop");
  }, [totalSeconds, soundEnabled, playSound, stopAlarm]);

  const selectPreset = useCallback((seconds: number) => {
    if (isRunning) return;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsFinished(false);
    if (soundEnabled) playSound("pop");
  }, [isRunning, soundEnabled, playSound]);

  const adjustTime = useCallback((delta: number) => {
    if (isRunning) return;
    const newTime = Math.max(60, Math.min(3600, totalSeconds + delta));
    setTotalSeconds(newTime);
    setRemainingSeconds(newTime);
    setIsFinished(false);
  }, [isRunning, totalSeconds]);

  return (
    <KitchenTimerContext.Provider
      value={{
        totalSeconds,
        remainingSeconds,
        isRunning,
        isFinished,
        soundEnabled,
        isAlarmRinging,
        setTotalSeconds,
        setRemainingSeconds,
        setIsRunning,
        setIsFinished,
        setSoundEnabled,
        startPause,
        reset,
        selectPreset,
        adjustTime,
        stopAlarm,
      }}
    >
      {children}
    </KitchenTimerContext.Provider>
  );
}

export function useKitchenTimer() {
  const context = useContext(KitchenTimerContext);
  if (!context) {
    throw new Error("useKitchenTimer must be used within a KitchenTimerProvider");
  }
  return context;
}