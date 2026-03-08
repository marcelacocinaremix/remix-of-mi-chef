import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { UNIQUE_COUNTRIES } from "@/data/countries";
import { toast } from "sonner";

interface GameCountryPromptProps {
  onConfirm: () => void;
  onSkip: () => void;
}

export function GameCountryPrompt({ onConfirm, onSkip }: GameCountryPromptProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !selectedCountry) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, country: selectedCountry, updated_at: new Date().toISOString() });
      onConfirm();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const selectedData = UNIQUE_COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center gap-5 py-6 px-4 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl"
      >
        🌍
      </motion.div>

      <div>
        <h2 className="text-xl font-black text-foreground mb-1">{t("gameCountryPromptTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{t("gameCountryPromptDesc")}</p>
      </div>

      <div className="w-full max-w-xs">
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("profileCountryPlaceholder")}>
              {selectedData ? (
                <span className="flex items-center gap-2">
                  <span className="text-lg">{selectedData.flag}</span>
                  <span>{selectedData.name}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>{t("profileCountryPlaceholder")}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {UNIQUE_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span>{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="outline" className="flex-1" onClick={() => {
          if (user) localStorage.setItem(`miChef_country_skipped_${user.id}`, "1");
          onSkip();
        }}>
          {t("gameCountryPromptSkip")}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!selectedCountry || saving}
        >
          {t("gameCountryPromptSave")}
        </Button>
      </div>
    </motion.div>
  );
}
