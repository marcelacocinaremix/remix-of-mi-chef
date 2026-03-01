import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";

export type GuestFeature = 'cocinar' | 'guia' | 'jugar' | 'despensa' | 'super' | 'planificar';

interface GuestLimits {
  cocinar: number;
  guia: number;
  jugar: number;
  despensa: number;
  super: number;
  planificar: number;
}

const GUEST_LIMITS: GuestLimits = {
  cocinar: 2,
  guia: 1,
  jugar: 1,
  despensa: 1,
  super: 1,
  planificar: 1,
};

interface GuestUsage {
  cocinar: number;
  guia: number;
  jugar: number;
  despensa: number;
  super: number;
  planificar: number;
}

interface GuestModeContextType {
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;
  exitGuestMode: () => void;
  checkGuestLimit: (feature: GuestFeature) => boolean; // true = allowed
  incrementGuestUsage: (feature: GuestFeature) => void;
  getGuestUsage: (feature: GuestFeature) => number;
  getGuestLimit: (feature: GuestFeature) => number;
  isAtGuestLimit: (feature: GuestFeature) => boolean;
  guestBlockModal: { show: boolean; feature: GuestFeature | null };
  showGuestBlock: (feature: GuestFeature) => void;
  hideGuestBlock: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

const STORAGE_KEY = "michef_guest_mode";
const USAGE_KEY = "michef_guest_usage";

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuestState] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });

  const [usage, setUsage] = useState<GuestUsage>(() => {
    try {
      const stored = localStorage.getItem(USAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { cocinar: 0, guia: 0, jugar: 0, despensa: 0, super: 0, planificar: 0 };
  });

  const [guestBlockModal, setGuestBlockModal] = useState<{ show: boolean; feature: GuestFeature | null }>({
    show: false,
    feature: null,
  });

  const setIsGuest = useCallback((v: boolean) => {
    setIsGuestState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
    if (!v) {
      // Clear usage on exit
      const reset = { cocinar: 0, guia: 0, jugar: 0, despensa: 0, super: 0, planificar: 0 };
      setUsage(reset);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USAGE_KEY);
      } catch {}
    }
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
  }, [setIsGuest]);

  const getGuestUsage = useCallback((feature: GuestFeature) => usage[feature], [usage]);
  const getGuestLimit = useCallback((feature: GuestFeature) => GUEST_LIMITS[feature], []);
  const isAtGuestLimit = useCallback((feature: GuestFeature) => usage[feature] >= GUEST_LIMITS[feature], [usage]);

  const checkGuestLimit = useCallback((feature: GuestFeature): boolean => {
    if (!isGuest) return true;
    return usage[feature] < GUEST_LIMITS[feature];
  }, [isGuest, usage]);

  const incrementGuestUsage = useCallback((feature: GuestFeature) => {
    setUsage(prev => {
      const updated = { ...prev, [feature]: prev[feature] + 1 };
      try { localStorage.setItem(USAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const showGuestBlock = useCallback((feature: GuestFeature) => {
    setGuestBlockModal({ show: true, feature });
  }, []);

  const hideGuestBlock = useCallback(() => {
    setGuestBlockModal({ show: false, feature: null });
  }, []);

  return (
    <GuestModeContext.Provider value={{
      isGuest,
      setIsGuest,
      exitGuestMode,
      checkGuestLimit,
      incrementGuestUsage,
      getGuestUsage,
      getGuestLimit,
      isAtGuestLimit,
      guestBlockModal,
      showGuestBlock,
      hideGuestBlock,
    }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const ctx = useContext(GuestModeContext);
  if (!ctx) {
    return {
      isGuest: false,
      setIsGuest: () => {},
      exitGuestMode: () => {},
      checkGuestLimit: () => true,
      incrementGuestUsage: () => {},
      getGuestUsage: () => 0,
      getGuestLimit: () => 999,
      isAtGuestLimit: () => false,
      guestBlockModal: { show: false, feature: null as GuestFeature | null },
      showGuestBlock: () => {},
      hideGuestBlock: () => {},
    } as GuestModeContextType;
  }
  return ctx;
}
