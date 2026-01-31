import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, User, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIET_TYPES = [
  { value: "omnivoro", label: "Omnívoro" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "pescetariano", label: "Pescetariano" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "sin_gluten", label: "Sin Gluten" },
  { value: "sin_lactosa", label: "Sin Lactosa" },
];

const COOKING_SKILLS = [
  { value: "principiante", label: "Principiante 🌱" },
  { value: "intermedio", label: "Intermedio 🍳" },
  { value: "avanzado", label: "Avanzado 👨‍🍳" },
  { value: "chef", label: "Chef Profesional 🎖️" },
];

const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
];

const COMMON_ALLERGIES = [
  "Maní", "Nueces", "Leche", "Huevo", "Trigo", "Soya", 
  "Pescado", "Mariscos", "Sésamo", "Mostaza"
];

const COMMON_FOODS = [
  "Pasta", "Arroz", "Pollo", "Carne", "Pescado", "Ensaladas",
  "Sopas", "Postres", "Comida Mexicana", "Comida Italiana",
  "Comida China", "Comida Japonesa", "BBQ", "Vegetales"
];

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    avatar_url: "",
    gender: "",
    birth_date: "",
    preferred_foods: [] as string[],
    diet_type: "",
    allergies: [] as string[],
    cooking_skill: "intermedio",
    household_size: 1,
    bio: "",
  });

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          gender: data.gender || "",
          birth_date: data.birth_date || "",
          preferred_foods: data.preferred_foods || [],
          diet_type: data.diet_type || "",
          allergies: data.allergies || [],
          cooking_skill: data.cooking_skill || "intermedio",
          household_size: data.household_size || 1,
          bio: data.bio || "",
        });
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
      toast.error("La imagen debe ser menor a 2MB");
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

      setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl + `?t=${Date.now()}` }));
      toast.success("¡Foto actualizada!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          gender: profile.gender || null,
          birth_date: profile.birth_date || null,
          preferred_foods: profile.preferred_foods,
          diet_type: profile.diet_type || null,
          allergies: profile.allergies,
          cooking_skill: profile.cooking_skill,
          household_size: profile.household_size,
          bio: profile.bio || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("¡Perfil guardado exitosamente!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>

        {loading && !profile.display_name ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {profile.display_name?.[0]?.toUpperCase() || "U"}
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
              <p className="text-sm text-muted-foreground">
                Toca el ícono para cambiar tu foto
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="display_name">Nombre</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div>
                <Label htmlFor="bio">Sobre mí</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={2}
                />
              </div>
            </div>

            {/* Cooking Preferences */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🍳 Preferencias de Cocina</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diet_type">Tipo de dieta</Label>
                  <Select
                    value={profile.diet_type}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, diet_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIET_TYPES.map(diet => (
                        <SelectItem key={diet.value} value={diet.value}>
                          {diet.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cooking_skill">Nivel de cocina</Label>
                  <Select
                    value={profile.cooking_skill}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, cooking_skill: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {COOKING_SKILLS.map(skill => (
                        <SelectItem key={skill.value} value={skill.value}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="household_size">Personas en el hogar</Label>
                <Select
                  value={profile.household_size.toString()}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, household_size: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "persona" : "personas"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preferred Foods */}
            <div className="space-y-3">
              <Label>🍕 Comidas Preferidas</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FOODS.map(food => (
                  <Badge
                    key={food}
                    variant={profile.preferred_foods.includes(food) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      preferred_foods: toggleArrayItem(prev.preferred_foods, food)
                    }))}
                  >
                    {food}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-3">
              <Label>⚠️ Alergias</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map(allergy => (
                  <Badge
                    key={allergy}
                    variant={profile.allergies.includes(allergy) ? "destructive" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      allergies: toggleArrayItem(prev.allergies, allergy)
                    }))}
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
