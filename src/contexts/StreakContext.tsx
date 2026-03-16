import { createContext, useContext, ReactNode } from "react";
import { useStreak, StreakData } from "@/hooks/useStreak";

interface StreakContextType {
  streakData: StreakData | null;
  isLoading: boolean;
  recordActivity: () => Promise<void>;
  refetch: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: ReactNode }) {
  const { streakData, isLoading, recordActivity, refetch } = useStreak();

  return (
    <StreakContext.Provider value={{ streakData, isLoading, recordActivity, refetch }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreakContext(): StreakContextType {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error("useStreakContext must be used within StreakProvider");
  return ctx;
}
