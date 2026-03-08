import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppTheme = "cyan-light" | "cyan-dark" | "rose-light" | "rose-dark" | "future" | "mono-light" | "mono-dark";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "cyan-light",
  setTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const THEMES: { id: AppTheme; label: string; description: string; primary: string; bg: string; dark: boolean }[] = [
  { id: "cyan-light", label: "Cyan Claro", description: "Azul fresco y luminoso", primary: "hsl(195 100% 45%)", bg: "#f0faff", dark: false },
  { id: "cyan-dark", label: "Cyan Oscuro", description: "Azul profundo y elegante", primary: "hsl(195 100% 50%)", bg: "#0a1929", dark: true },
  { id: "rose-light", label: "Rosa Claro", description: "Rosa suave y cálido", primary: "hsl(340 85% 55%)", bg: "#fff0f5", dark: false },
  { id: "rose-dark", label: "Rosa Oscuro", description: "Rosa intenso y dramático", primary: "hsl(340 80% 55%)", bg: "#1a0a12", dark: true },
  { id: "future", label: "Futuro", description: "Cyberpunk neón", primary: "hsl(195 100% 50%)", bg: "#0a1929", dark: true },
  { id: "mono-light", label: "B&N Claro", description: "Minimalista blanco y negro", primary: "hsl(0 0% 10%)", bg: "#f9f9f9", dark: false },
  { id: "mono-dark", label: "B&N Noche", description: "Elegante negro profundo", primary: "hsl(0 0% 90%)", bg: "#0f0f0f", dark: true },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem("app-theme") as AppTheme) || "cyan-light";
  });

  // On mount, restore per-user theme if available
  useEffect(() => {
    const restoreUserTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const userKey = `app-theme-${session.user.id}`;
        const stored = localStorage.getItem(userKey);
        if (stored && stored !== localStorage.getItem("app-theme")) {
          setThemeState(stored as AppTheme);
          localStorage.setItem("app-theme", stored);
        }
      } catch { /* ignore */ }
    };
    restoreUserTheme();
  }, []);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Store per-user so theme is restored on next login
        localStorage.setItem(`app-theme-${session.user.id}`, newTheme);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("cyan-light", "cyan-dark", "rose-light", "rose-dark", "future", "mono-light", "mono-dark", "dark");
    root.classList.add(theme);
    const isDark = theme.endsWith("-dark") || theme === "future";
    if (isDark) root.classList.add("dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

