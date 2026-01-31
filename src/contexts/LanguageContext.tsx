import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, TranslationKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isFirstVisit: boolean;
  setFirstVisitComplete: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "marcelacocina_language";
const FIRST_VISIT_KEY = "marcelacocina_first_visit";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as Language) || "es";
  });
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !localStorage.getItem(FIRST_VISIT_KEY);
  });

  // Load language from user profile when authenticated
  useEffect(() => {
    if (user) {
      const loadUserLanguage = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", user.id)
          .maybeSingle();
        
        if (data?.language) {
          setLanguageState(data.language as Language);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, data.language);
        }
      };
      
      setTimeout(() => loadUserLanguage(), 0);
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // Save to user profile if authenticated
    if (user) {
      await supabase
        .from("profiles")
        .update({ language: lang })
        .eq("id", user.id);
    }
  };

  const setFirstVisitComplete = () => {
    localStorage.setItem(FIRST_VISIT_KEY, "true");
    setIsFirstVisit(false);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.es[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isFirstVisit, setFirstVisitComplete }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
