import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, User, Save, X, Loader2, Globe, Crown, Clock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { UNIQUE_COUNTRIES } from "@/data/countries";
import { usePremium } from "@/hooks/usePremium";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (open && user) loadProfile();
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, country")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
        setCountry(data.country || "");
      } else {
        setDisplayName(user.user_metadata?.display_name || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profilePhotoSizeError"));
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl + `?t=${Date.now()}`);
      toast.success(t("profilePhotoUpdated"));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(t("profilePhotoError"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          country: country || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      toast.success(t("profileSaved"));
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t("profileSaveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t("myProfile")}
          </DialogTitle>
        </DialogHeader>

        {loading && !displayName ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("profilePhotoHint")}</p>
            </div>

            {/* Plan actual */}
            <div className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {isPremium ? (
                    <Crown className="w-4 h-4 text-amber-500" />
                  ) : isTrialActive ? (
                    <Clock className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                  Mi plan
                </div>
                {isPremium ? (
                  <Badge className="bg-amber-500 text-primary-foreground gap-1 text-xs px-2 py-0.5">
                    <Crown className="w-3 h-3" />
                    Premium
                  </Badge>
                ) : isTrialActive ? (
                  <Badge className="bg-emerald-500 text-primary-foreground gap-1 text-xs px-2 py-0.5">
                    <Clock className="w-3 h-3" />
                    Prueba · {trialDaysRemaining}d restantes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    Plan Gratuito
                  </Badge>
                )}
              </div>

              {/* Included features */}
              <div className="border-t border-border/40 px-4 py-3 space-y-1.5">
                {[
                  { label: "Generador de recetas con IA", free: true },
                  { label: "Aprender a cocinar", free: true },
                  { label: "Calendario de comidas", free: true },
                  { label: "Juego Chef Arena", free: true },
                  { label: "Mi Cocina (favoritos e historial)", free: true },
                  { label: "Despensa", free: false },
                  { label: "Lista del supermercado", free: false },
                  { label: "Balance y salud", free: false },
                  { label: "Trucos del Chef", free: false },
                ].map((f) => {
                  const hasAccess = isPremium || isTrialActive || f.free;
                  return (
                    <div key={f.label} className="flex items-center gap-2">
                      {hasAccess ? (
                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold flex-shrink-0">✓</span>
                      ) : (
                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] flex-shrink-0">✕</span>
                      )}
                      <span className={`text-xs ${hasAccess ? "text-foreground" : "text-muted-foreground"}`}>
                        {f.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="display_name">{t("profileName")}</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profileNamePlaceholder")}
                className="mt-1"
              />
            </div>

            {/* País */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {t("profileCountry")}
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("profileCountryPlaceholder")}>
                    {country ? (
                      <span className="flex items-center gap-2">
                        <span>{UNIQUE_COUNTRIES.find(c => c.code === country)?.flag}</span>
                        <span>{UNIQUE_COUNTRIES.find(c => c.code === country)?.name}</span>
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
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

            {/* Acciones */}
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={loading || uploading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
