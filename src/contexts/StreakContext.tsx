import { createContext, useContext, ReactNode, useCallback } from "react";
import { useStreak, StreakData } from "@/hooks/useStreak";
import { StreakCelebrationSheet } from "@/components/StreakCelebrationSheet";

interface StreakContextType {
  streakData: StreakData | null;
  isLoading: boolean;
  recordActivity: () => Promise<void>;
  refetch: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: ReactNode }) {
  const { streakData, isLoading, celebrationMilestone, recordActivity, dismissCelebration, refetch } = useStreak();

  return (
    <StreakContext.Provider value={{ streakData, isLoading, recordActivity, refetch }}>
      {children}
      <StreakCelebrationSheet milestone={celebrationMilestone} onDismiss={dismissCelebration} />
    </StreakContext.Provider>
  );
}

export function useStreakContext(): StreakContextType {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error("useStreakContext must be used within StreakProvider");
  return ctx;
}
