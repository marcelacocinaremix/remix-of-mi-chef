import { useState, useEffect, useMemo } from "react";
import {
  Heart, Trash2, ChevronRight, Sparkles, BookOpen, UtensilsCrossed, X, AlertTriangle,
  Lightbulb, Refrigerator, ThermometerSun, Timer, Utensils, Flame, Coins, Shield,
  Snowflake, ShoppingCart, Shuffle, Leaf, ChefHat, Search, FolderPlus, Folder,
  FolderOpen, Clock, Check, MoreVertical, MoveRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FavoriteRecipe {
  id: string;
  recipe_name: string;
  recipe_data: Recipe;
  created_at: string;
  folder?: string;
}

interface FoodTipData {
  name: string;
  category: string;
  mainInfo: string;
  details: string[];
  tips: string[];
  warnings?: string[];
}

interface FavoriteFoodTip {
  id: string;
  food_name: string;
  category: string;
  tip_data: FoodTipData;
  created_at: string;
}

interface FavoriteRecipesProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

type ActiveTab = "recetas" | "tips";

// Colores de categoría de tips
const categoryLabels: Record<string, string> = {
  conservacion: "Conservación", congelacion: "Congelación", compra: "Compra",
  temperaturas: "Temperaturas", tiempos: "Tiempos", preparacion: "Preparación",
  coccion: "Cocción", sustitutos: "Sustitutos", combinaciones: "Combinaciones",
  nutricion: "Nutrición", ahorro: "Ahorro", seguridad: "Seguridad",
};

const categoryIcons: Record<string, React.ElementType> = {
  conservacion: Refrigerator, congelacion: Snowflake, compra: ShoppingCart,
  temperaturas: ThermometerSun, tiempos: Timer, preparacion: Utensils,
  coccion: Flame, sustitutos: Shuffle, combinaciones: ChefHat,
  nutricion: Leaf, ahorro: Coins, seguridad: Shield,
};

const categoryColors: Record<string, string> = {
  conservacion: "text-blue-500 bg-blue-500", congelacion: "text-cyan-500 bg-cyan-500",
  compra: "text-pink-500 bg-pink-500", temperaturas: "text-red-500 bg-red-500",
  tiempos: "text-purple-500 bg-purple-500", preparacion: "text-amber-500 bg-amber-500",
  coccion: "text-orange-500 bg-orange-500", sustitutos: "text-indigo-500 bg-indigo-500",
  combinaciones: "text-rose-500 bg-rose-500", nutricion: "text-green-500 bg-green-500",
  ahorro: "text-emerald-500 bg-emerald-500", seguridad: "text-slate-500 bg-slate-500",
};

// Paleta de colores para miniaturas de recetas
const recipeColors = [
  "from-orange-400 to-amber-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-pink-500",
  "from-blue-400 to-cyan-500",
  "from-rose-400 to-orange-500",
  "from-green-400 to-emerald-500",
  "from-indigo-400 to-purple-500",
  "from-yellow-400 to-orange-400",
];

const recipeEmojis = ["🍳", "🥘", "🍜", "🍲", "🥗", "🍝", "🍛", "🥙", "🍱", "🥩", "🍤", "🧆", "🫕", "🥞", "🍰"];

function getRecipeColor(name: string): string {
  const idx = name.charCodeAt(0) % recipeColors.length;
  return recipeColors[idx];
}

function getRecipeEmoji(recipe: Recipe): string {
  const tags = recipe.tags?.join(" ").toLowerCase() || "";
  const name = recipe.name.toLowerCase();
  if (tags.includes("postre") || name.includes("torta") || name.includes("flan")) return "🍰";
  if (tags.includes("vegano") || tags.includes("ensalada") || name.includes("ensalada")) return "🥗";
  if (name.includes("pasta") || name.includes("fideos")) return "🍝";
  if (name.includes("sopa") || name.includes("caldo")) return "🍲";
  if (name.includes("arroz")) return "🍛";
  if (name.includes("pollo")) return "🍗";
  if (name.includes("pescado") || name.includes("salmón") || name.includes("atún")) return "🐟";
  const idx = recipe.name.charCodeAt(0) % recipeEmojis.length;
  return recipeEmojis[idx];
}

const DEFAULT_FOLDERS = ["Sin carpeta", "Almuerzos", "Cenas", "Desayunos", "Postres", "Snacks"];
const FOLDERS_KEY = "miChef_recipe_folders";

function getFolders(): string[] {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_FOLDERS;
}

function saveFolders(folders: string[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

const RECIPE_FOLDERS_KEY = "miChef_recipe_folder_assignments";

function getFolderAssignments(): Record<string, string> {
  try {
    const stored = localStorage.getItem(RECIPE_FOLDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveFolderAssignment(recipeId: string, folder: string) {
  const assignments = getFolderAssignments();
  assignments[recipeId] = folder;
  localStorage.setItem(RECIPE_FOLDERS_KEY, JSON.stringify(assignments));
}

export function FavoriteRecipes({ onSelectRecipe }: FavoriteRecipesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [favoriteTips, setFavoriteTips] = useState<FavoriteFoodTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("recetas");
  const [selectedTip, setSelectedTip] = useState<FavoriteFoodTip | null>(null);

  // Buscador
  const [searchQuery, setSearchQuery] = useState("");

  // Carpetas
  const [folders, setFolders] = useState<string[]>(getFolders());
  const [activeFolder, setActiveFolder] = useState<string>("Sin carpeta");
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>(getFolderAssignments());
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [movingRecipeId, setMovingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchFavoriteTips();
    } else {
      setFavorites([]);
      setFavoriteTips([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const typedData = (data || []).map(item => ({
        ...item,
        recipe_data: item.recipe_data as unknown as Recipe,
        folder: getFolderAssignments()[item.id] || "Sin carpeta",
      }));
      setFavorites(typedData);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoriteTips = async () => {
    if (!user) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("favorite_food_tips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFavoriteTips(data || []);
    } catch (error) {
      console.error("Error fetching favorite tips:", error);
    }
  };

  // Filtrado por búsqueda + carpeta activa
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return favorites.filter(fav => {
      const inFolder = (folderAssignments[fav.id] || "Sin carpeta") === activeFolder;
      if (!inFolder) return false;
      if (!q) return true;
      const nameMatch = fav.recipe_name.toLowerCase().includes(q);
      const ingredientMatch = fav.recipe_data.ingredients?.some(i => i.toLowerCase().includes(q));
      return nameMatch || ingredientMatch;
    });
  }, [favorites, searchQuery, activeFolder, folderAssignments]);

  // Recetas sin carpeta activa (para mostrar conteo en cada carpeta)
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach(f => { counts[f] = 0; });
    favorites.forEach(fav => {
      const folder = folderAssignments[fav.id] || "Sin carpeta";
      if (counts[folder] !== undefined) counts[folder]++;
      else counts[folder] = 1;
    });
    return counts;
  }, [favorites, folderAssignments, folders]);

  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("favorite_recipes").delete().eq("id", id);
      if (error) throw error;
      setFavorites(favorites.filter(f => f.id !== id));
      toast({ title: "Receta eliminada", description: "Se quitó de tus favoritos." });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleDeleteTip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("favorite_food_tips").delete().eq("id", id);
      if (error) throw error;
      setFavoriteTips(favoriteTips.filter(f => f.id !== id));
      toast({ title: "Eliminado", description: "Tip eliminado de favoritos." });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) return;
    const updated = [...folders, name];
    setFolders(updated);
    saveFolders(updated);
    setNewFolderName("");
    setShowNewFolderInput(false);
    setActiveFolder(name);
    toast({ title: "Carpeta creada", description: `"${name}" lista para organizar tus recetas.` });
  };

  const handleMoveRecipe = (recipeId: string, folder: string) => {
    saveFolderAssignment(recipeId, folder);
    const updated = { ...folderAssignments, [recipeId]: folder };
    setFolderAssignments(updated);
    setMovingRecipeId(null);
    toast({ title: "Receta movida", description: `Movida a "${folder}".` });
  };

  if (!user) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">Tus favoritos</h3>
        <p className="text-muted-foreground text-sm">Iniciá sesión para guardar tus favoritos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
        <p className="text-muted-foreground">Cargando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      {/* Tab Selector */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab("recetas")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all border-b-2",
            activeTab === "recetas"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Mis Recetas
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-semibold",
            activeTab === "recetas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {favorites.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all border-b-2",
            activeTab === "tips"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Mis Tips
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-semibold",
            activeTab === "tips" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {favoriteTips.length}
          </span>
        </button>
      </div>

      {/* ── RECETAS TAB ── */}
      {activeTab === "recetas" && (
        <div className="p-4 space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ingrediente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Carpetas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carpetas</span>
              <button
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Nueva
              </button>
            </div>

            {/* New folder input */}
            {showNewFolderInput && (
              <div className="flex gap-2 animate-fade-in">
                <Input
                  placeholder="Nombre de la carpeta..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                  className="h-8 text-sm flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateFolder} className="h-8 px-3">
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }} className="h-8 px-3">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Folder pills */}
            <div className="flex flex-wrap gap-2">
              {folders.map(folder => {
                const isActive = activeFolder === folder;
                const count = folderCounts[folder] || 0;
                return (
                  <button
                    key={folder}
                    onClick={() => setActiveFolder(folder)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                    {folder}
                    <span className={cn(
                      "text-xs rounded-full min-w-[16px] text-center",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipe Grid */}
          {favorites.length === 0 ? (
            <div className="text-center py-10">
              <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Aún no guardaste recetas favoritas</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Tocá el ❤️ en cualquier receta para guardarla</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No hay resultados para tu búsqueda" : "Esta carpeta está vacía"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredRecipes.map(fav => {
                const emoji = getRecipeEmoji(fav.recipe_data);
                const gradient = getRecipeColor(fav.recipe_name);
                return (
                  <div
                    key={fav.id}
                    className="relative group rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => onSelectRecipe(fav.recipe_data)}
                      className={cn(
                        "h-24 flex items-center justify-center bg-gradient-to-br",
                        gradient
                      )}
                    >
                      <span className="text-4xl drop-shadow-sm">{emoji}</span>
                    </div>

                    {/* Info + botón de acciones siempre visible */}
                    <div className="p-2.5 flex items-start justify-between gap-1">
                      <div
                        onClick={() => onSelectRecipe(fav.recipe_data)}
                        className="flex-1 min-w-0"
                      >
                        <p className="font-semibold text-xs text-foreground leading-tight line-clamp-2 mb-1.5">
                          {fav.recipe_name}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {fav.recipe_data.time}m
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {fav.recipe_data.nutrition?.calories || "?"}
                          </span>
                        </div>
                      </div>
                      {/* Botón ⋮ siempre visible — táctil y accesible en mobile */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setMovingRecipeId(fav.id); }}
                        className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center shrink-0 transition-colors"
                        title="Opciones"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Sheet de acciones de receta (bottom drawer) ── */}
      {(() => {
        const sheetRecipe = movingRecipeId ? favorites.find(f => f.id === movingRecipeId) : null;
        return (
          <Sheet open={!!movingRecipeId} onOpenChange={open => !open && setMovingRecipeId(null)}>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              {sheetRecipe && (
                <>
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left text-base flex items-center gap-2">
                      <span className="text-2xl">{getRecipeEmoji(sheetRecipe.recipe_data)}</span>
                      <span className="line-clamp-1">{sheetRecipe.recipe_name}</span>
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground text-left">
                      Carpeta actual: <strong>{folderAssignments[sheetRecipe.id] || "Sin carpeta"}</strong>
                    </p>
                  </SheetHeader>

                  {/* Mover a carpeta */}
                  <div className="space-y-2 mb-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MoveRight className="w-3.5 h-3.5" /> Mover a carpeta
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {folders.map(f => {
                        const isCurrent = (folderAssignments[sheetRecipe.id] || "Sin carpeta") === f;
                        return (
                          <button
                            key={f}
                            onClick={() => handleMoveRecipe(sheetRecipe.id, f)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                              isCurrent
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-foreground border-border/50 hover:bg-muted active:scale-95"
                            )}
                          >
                            {isCurrent
                              ? <Check className="w-4 h-4 shrink-0" />
                              : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
                            }
                            <span className="truncate">{f}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={(e) => { handleDeleteRecipe(sheetRecipe.id, e); setMovingRecipeId(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all border border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar de favoritos
                  </button>
                </>
              )}
            </SheetContent>
          </Sheet>
        );
      })()}

      {/* ── TIPS TAB ── */}
      {activeTab === "tips" && (
        <div className="p-4">
          {favoriteTips.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Aún no guardaste tips</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Guardá tips desde la sección de Guía de Alimentos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {favoriteTips.map(tip => {
                const Icon = categoryIcons[tip.category] || Lightbulb;
                const colorClass = categoryColors[tip.category] || "text-primary bg-primary";
                const [textColor, bgColor] = colorClass.split(" ");
                return (
                  <div
                    key={tip.id}
                    onClick={() => setSelectedTip(tip)}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer bg-muted/40 hover:bg-muted transition-colors border border-border/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", bgColor + "/15")}>
                        <Icon className={cn("w-4 h-4", textColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate capitalize">{tip.food_name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                            {categoryLabels[tip.category] || tip.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tip.tip_data.mainInfo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" onClick={e => handleDeleteTip(tip.id, e)} className="h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tip Detail Modal */}
      <Dialog open={!!selectedTip} onOpenChange={open => !open && setSelectedTip(null)}>
        <DialogContent className="max-w-md max-h-[80vh]">
          {selectedTip && (() => {
            const Icon = categoryIcons[selectedTip.category] || Lightbulb;
            const colorClass = categoryColors[selectedTip.category] || "text-primary bg-primary";
            const [textColor, bgColor] = colorClass.split(" ");
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bgColor + "/15")}>
                      <Icon className={cn("w-5 h-5", textColor)} />
                    </div>
                    <div>
                      <span className="capitalize">{selectedTip.food_name}</span>
                      <p className="text-sm font-normal text-muted-foreground">{categoryLabels[selectedTip.category]}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4">
                    <div className={cn("p-4 rounded-lg", bgColor + "/10")}>
                      <p className="font-medium">{selectedTip.tip_data.mainInfo}</p>
                    </div>
                    {selectedTip.tip_data.details?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Sparkles className={cn("w-4 h-4", textColor)} /> Detalles
                        </h4>
                        <ul className="space-y-2">
                          {selectedTip.tip_data.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0", bgColor + "/20", textColor)}>{i + 1}</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedTip.tip_data.warnings?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-rose-500">
                          <AlertTriangle className="w-4 h-4" /> Precauciones
                        </h4>
                        <ul className="space-y-2">
                          {selectedTip.tip_data.warnings.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedTip.tip_data.tips?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-500">
                          <Lightbulb className="w-4 h-4" /> Tips prácticos
                        </h4>
                        <ul className="space-y-2">
                          {selectedTip.tip_data.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
