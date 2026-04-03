import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Heart, Trash2, ChevronRight, Sparkles, BookOpen, UtensilsCrossed, X, AlertTriangle,
  Lightbulb, Refrigerator, ThermometerSun, Timer, Utensils, Flame, Coins, Shield,
  Snowflake, ShoppingCart, Shuffle, Leaf, ChefHat, Search, FolderPlus, Folder,
  FolderOpen, Clock, Check, MoreVertical, MoveRight, GripVertical, Info,
  ArrowDown, Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Recipe } from "@/components/RecipeList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ───────────────────────────────────────────────────────────
interface FavoriteRecipe {
  id: string;
  recipe_name: string;
  recipe_data: Recipe;
  created_at: string;
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


// ─── Tip maps ────────────────────────────────────────────────────────
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

// ─── Recipe visual helpers ─────────────────────────────────────────────
const recipeColors = [
  "from-orange-400 to-amber-500", "from-emerald-400 to-teal-500",
  "from-purple-400 to-pink-500", "from-blue-400 to-cyan-500",
  "from-rose-400 to-orange-500", "from-green-400 to-emerald-500",
  "from-indigo-400 to-purple-500", "from-yellow-400 to-orange-400",
];
const recipeEmojis = ["🍳","🥘","🍜","🍲","🥗","🍝","🍛","🥙","🍱","🥩","🍤","🧆","🫕","🥞","🍰"];

function getRecipeColor(name: string) {
  return recipeColors[name.charCodeAt(0) % recipeColors.length];
}
function getRecipeEmoji(recipe: Recipe) {
  const tags = recipe.tags?.join(" ").toLowerCase() || "";
  const name = recipe.name.toLowerCase();
  if (tags.includes("postre") || name.includes("torta") || name.includes("flan")) return "🍰";
  if (tags.includes("vegano") || name.includes("ensalada")) return "🥗";
  if (name.includes("pasta") || name.includes("fideos")) return "🍝";
  if (name.includes("sopa") || name.includes("caldo")) return "🍲";
  if (name.includes("arroz")) return "🍛";
  if (name.includes("pollo")) return "🍗";
  if (name.includes("pescado") || name.includes("salmón") || name.includes("atún")) return "🐟";
  return recipeEmojis[recipe.name.charCodeAt(0) % recipeEmojis.length];
}

// ─── Folder persistence (user-scoped) ──────────────────────────────────
const DEFAULT_FOLDERS = ["Sin carpeta", "Almuerzos", "Cenas"];
const DEFAULT_TIP_FOLDERS = ["Sin carpeta", "Conservación", "Cocción"];

function uKey(base: string, uid?: string) { return uid ? `${base}_${uid}` : base; }

function getTipFolders(uid?: string): string[] {
  try { const s = localStorage.getItem(uKey("miChef_tip_folders", uid)); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_TIP_FOLDERS;
}
function saveTipFolders(f: string[], uid?: string) { localStorage.setItem(uKey("miChef_tip_folders", uid), JSON.stringify(f)); }
function getTipFolderAssignments(uid?: string): Record<string, string> {
  try { const s = localStorage.getItem(uKey("miChef_tip_folder_assignments", uid)); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveTipFolderAssignment(tipId: string, folder: string, uid?: string) {
  const a = getTipFolderAssignments(uid);
  a[tipId] = folder;
  localStorage.setItem(uKey("miChef_tip_folder_assignments", uid), JSON.stringify(a));
}

function getFolders(uid?: string): string[] {
  try { const s = localStorage.getItem(uKey("miChef_recipe_folders", uid)); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_FOLDERS;
}
function saveFolders(f: string[], uid?: string) { localStorage.setItem(uKey("miChef_recipe_folders", uid), JSON.stringify(f)); }
function getFolderAssignments(uid?: string): Record<string, string> {
  try { const s = localStorage.getItem(uKey("miChef_recipe_folder_assignments", uid)); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveFolderAssignment(recipeId: string, folder: string, uid?: string) {
  const a = getFolderAssignments(uid);
  a[recipeId] = folder;
  localStorage.setItem(uKey("miChef_recipe_folder_assignments", uid), JSON.stringify(a));
}

// ─── How-it-works banner ──────────────────────────────────────────────
function HowItWorksBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">¿Cómo funciona?</span>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
          <span className="text-lg shrink-0">❤️</span>
          <div>
            <p className="text-xs font-semibold text-foreground">Guardá una receta</p>
            <p className="text-xs text-muted-foreground">Tocá el ❤️ en cualquier receta generada para agregarla acá</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
          <span className="text-lg shrink-0">📁</span>
          <div>
            <p className="text-xs font-semibold text-foreground">Creá carpetas</p>
            <p className="text-xs text-muted-foreground">Organizá por tipo: Almuerzos, Postres, Cenas… tocá "+ Nueva"</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
          <Hand className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">Arrastrá a una carpeta</p>
            <p className="text-xs text-muted-foreground">Mantené presionada una receta y soltala en la carpeta que quieras</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
          <MoreVertical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">Menú rápido</p>
            <p className="text-xs text-muted-foreground">Tocá ⋮ en cada receta para moverla o eliminarla</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StepHeader ─────────────────────────────────────────────────────
function StepHeader({ title, subtitle }: {
  number?: number; title: string; subtitle: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────
export function FavoriteRecipes({ onSelectRecipe }: FavoriteRecipesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Carpetas recetas — reload when user changes
  const uid = user?.id;
  const [folders, setFolders] = useState<string[]>(getFolders(uid));
  const [activeFolder, setActiveFolder] = useState<string>("Sin carpeta");
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>(getFolderAssignments(uid));
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showSheetNewFolder, setShowSheetNewFolder] = useState(false);
  const [sheetNewFolderName, setSheetNewFolderName] = useState("");
  const [movingRecipeId, setMovingRecipeId] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);


  // Drag state
  const [draggingRecipeId, setDraggingRecipeId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const folderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRecipeRef = useRef<string | null>(null);
  const longPressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissHelp = () => {
    localStorage.setItem(uKey("miChef_favorites_help_dismissed", uid), "1");
    setShowHelp(false);
  };

  // Reload user-scoped localStorage when user changes
  useEffect(() => {
    setFolders(getFolders(uid));
    setFolderAssignments(getFolderAssignments(uid));
    setActiveFolder("Sin carpeta");
  }, [uid]);

  useEffect(() => {
    if (user) { fetchFavorites(); }
    else { setFavorites([]); setIsLoading(false); }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("favorite_recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setFavorites((data || []).map(item => ({ ...item, recipe_data: item.recipe_data as unknown as Recipe })));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };


  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return favorites.filter(fav => {
      // When searching, ignore folder filter and search across all recipes
      if (q) {
        return fav.recipe_name.toLowerCase().includes(q) ||
          fav.recipe_data.ingredients?.some(i => i.toLowerCase().includes(q));
      }
      // No search: filter by active folder
      return (folderAssignments[fav.id] || "Sin carpeta") === activeFolder;
    });
  }, [favorites, searchQuery, activeFolder, folderAssignments]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach(f => { counts[f] = 0; });
    favorites.forEach(fav => {
      const folder = folderAssignments[fav.id] || "Sin carpeta";
      counts[folder] = (counts[folder] || 0) + 1;
    });
    return counts;
  }, [favorites, folderAssignments, folders]);

  const handleDeleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("favorite_recipes").delete().eq("id", id);
      if (error) throw error;
      setFavorites(prev => prev.filter(f => f.id !== id));
      toast({ title: t("favRecipeDeleted") });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };


  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) return;
    const updated = [...folders, name];
    setFolders(updated); saveFolders(updated, uid);
    setNewFolderName(""); setShowNewFolderInput(false);
    setActiveFolder(name);
    toast({ title: t("favFolderCreated"), description: `"${name}" ${t("favFolderCreatedDesc")}` });
  };

  const handleDeleteFolder = (folder: string) => {
    const assignments = getFolderAssignments(uid);
    const updated = { ...assignments };
    Object.keys(updated).forEach(id => {
      if (updated[id] === folder) updated[id] = "Sin carpeta";
    });
    localStorage.setItem(uKey("miChef_recipe_folder_assignments", uid), JSON.stringify(updated));
    setFolderAssignments(updated);

    const newFolders = folders.filter(f => f !== folder);
    setFolders(newFolders);
    saveFolders(newFolders, uid);

    if (activeFolder === folder) setActiveFolder("Sin carpeta");
    setDeletingFolder(null);
    toast({ title: "Carpeta eliminada", description: `Las recetas se movieron a "Sin carpeta"` });
  };

  const handleMoveRecipe = useCallback((recipeId: string, folder: string) => {
    saveFolderAssignment(recipeId, folder, uid);
    setFolderAssignments(prev => ({ ...prev, [recipeId]: folder }));
    setMovingRecipeId(null);
    toast({ title: t("favRecipeMoved"), description: `${t("favMovedTo").replace("{folder}", folder)}` });
  }, [toast, uid]);

  // ─── Pointer drag ────────────────────────────────────────────────────
  const getFolderAtPoint = useCallback((x: number, y: number): string | null => {
    for (const [folder, el] of Object.entries(folderRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return folder;
    }
    return null;
  }, []);

  const endDrag = useCallback((x: number, y: number) => {
    const recipeId = dragRecipeRef.current;
    if (recipeId) {
      const targetFolder = getFolderAtPoint(x, y);
      if (targetFolder) {
        const currentFolder = getFolderAssignments(uid)[recipeId] || "Sin carpeta";
        if (currentFolder !== targetFolder) handleMoveRecipe(recipeId, targetFolder);
      }
    }
    dragRecipeRef.current = null;
    setDraggingRecipeId(null);
    setDragOverFolder(null);
    setGhostPos(null);
  }, [getFolderAtPoint, handleMoveRecipe]);

  const onPointerDown = useCallback((recipeId: string, e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    longPressTimers.current[recipeId] = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      dragRecipeRef.current = recipeId;
      setDraggingRecipeId(recipeId);
      setGhostPos({ x: e.clientX, y: e.clientY });
    }, 450);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRecipeRef.current) return;
    e.preventDefault();
    setGhostPos({ x: e.clientX, y: e.clientY });
    setDragOverFolder(getFolderAtPoint(e.clientX, e.clientY));
  }, [getFolderAtPoint]);

  const onPointerUp = useCallback((recipeId: string, e: React.PointerEvent) => {
    if (longPressTimers.current[recipeId]) {
      clearTimeout(longPressTimers.current[recipeId]);
      delete longPressTimers.current[recipeId];
    }
    if (dragRecipeRef.current) endDrag(e.clientX, e.clientY);
  }, [endDrag]);

  const onPointerCancel = useCallback((recipeId: string) => {
    if (longPressTimers.current[recipeId]) {
      clearTimeout(longPressTimers.current[recipeId]);
      delete longPressTimers.current[recipeId];
    }
    dragRecipeRef.current = null;
    setDraggingRecipeId(null);
    setDragOverFolder(null);
    setGhostPos(null);
  }, []);

  // ─── Guards ───────────────────────────────────────────────────────────
  if (!user) return (
    <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-display text-lg font-semibold mb-2">{t("favTitle")}</h3>
      <p className="text-muted-foreground text-sm">{t("favLoginDesc")}</p>
    </div>
  );

  if (isLoading) return (
    <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
      <p className="text-muted-foreground">{t("favLoading")}</p>
    </div>
  );

  const draggingRecipe = draggingRecipeId ? favorites.find(f => f.id === draggingRecipeId) : null;

  return (
    <div
      className="space-y-4"
      onPointerMove={draggingRecipeId ? onPointerMove : undefined}
    >
      {/* ── Ghost flotante ── */}
      {ghostPos && draggingRecipe && (
        <div
          className="fixed pointer-events-none z-[9999] select-none"
          style={{ left: ghostPos.x - 50, top: ghostPos.y - 55, transform: "rotate(5deg) scale(1.1)" }}
        >
          <div className={cn(
            "w-24 h-20 rounded-xl bg-gradient-to-br shadow-2xl flex items-center justify-center border-2 border-primary",
            getRecipeColor(draggingRecipe.recipe_name)
          )}>
            <span className="text-3xl">{getRecipeEmoji(draggingRecipe.recipe_data)}</span>
          </div>
          <p className="text-center text-[10px] font-bold text-foreground bg-background/90 rounded-lg px-2 py-0.5 mt-1 max-w-[96px] truncate shadow">
            {draggingRecipe.recipe_name}
          </p>
        </div>
      )}

      {/* ════════ RECETAS ════════ */}
        <div className="space-y-4">

          {/* Panel de ayuda */}
          {showHelp && <HowItWorksBanner onDismiss={dismissHelp} />}


          {/* PASO 1 — Carpetas (ahora primero para que usuario entienda antes de ver recetas) */}
          <Card className={cn(
            "border-2 transition-all duration-200",
            dragOverFolder
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-secondary/40 bg-gradient-to-br from-secondary/5 to-transparent"
          )}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <StepHeader
                  number={1}
                  title="Carpetas"
                  subtitle={draggingRecipeId
                    ? "🎯 ¡Soltá la receta aquí!"
                    : "Tocá una carpeta para ver sus recetas"
                  }
                  highlight={!!draggingRecipeId}
                />
                <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                  <button
                    onClick={() => { setShowSearchBar(v => !v); if (showSearchBar) setSearchQuery(""); }}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-xl border transition-colors",
                      showSearchBar || searchQuery
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    )}
                  >
                    {searchQuery ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                    className="flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-3 py-1.5 rounded-xl transition-colors border border-primary/20"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    + Nueva
                  </button>
                </div>
              </div>

              {/* Barra de búsqueda desplegable */}
              {(showSearchBar || searchQuery) && (
                <div className="relative animate-fade-in">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o ingrediente…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {showNewFolderInput && (
                <div className="flex gap-2 animate-fade-in">
                  <Input
                    placeholder="Ej: Mis favoritas, Navidad…"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                    className="h-9 text-sm flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateFolder} className="h-9 px-3"><Check className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }} className="h-9 px-3"><X className="w-3.5 h-3.5" /></Button>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 pt-1 px-0.5" style={{ overflow: "visible" }}>
                {folders.map(folder => {
                  const isActive = activeFolder === folder;
                  const isOver = dragOverFolder === folder;
                  const count = folderCounts[folder] || 0;
                  const isDeletable = folder !== "Sin carpeta";
                  return (
                    <div
                      key={folder}
                      ref={el => { folderRefs.current[folder] = el; }}
                      className="relative"
                    >
                      {isDeletable && (
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingFolder(folder); }}
                          className="absolute top-0.5 right-0.5 z-10 w-5 h-5 rounded-full bg-muted/80 border border-border flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => !draggingRecipeId && setActiveFolder(folder)}
                        className={cn(
                          "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-1.5 transition-all duration-150",
                          isOver
                            ? "bg-primary text-primary-foreground border-primary scale-105 shadow-xl"
                            : isActive
                              ? "bg-primary/10 text-primary border-primary shadow-md"
                              : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isOver || isActive ? "bg-primary/15" : "bg-muted"
                        )}>
                          {isOver
                            ? <FolderOpen className="w-5 h-5 animate-bounce" />
                            : isActive ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5 text-muted-foreground" />
                          }
                        </div>
                        <span className="text-xs font-semibold truncate w-full text-center leading-tight">{folder}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center tabular-nums",
                          isActive || isOver
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {count}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Drag hint — solo se muestra si hay recetas */}
              {!draggingRecipeId && favorites.length > 0 && (
                <div className="flex items-center gap-2 mt-1 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <Hand className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Arrastrá recetas aquí:</span>{" "}
                    mantené presionada una receta y soltala en la carpeta deseada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>



          {/* PASO 3 — Recetas */}
          <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <StepHeader
                  number={3}
                  title={searchQuery ? `🔍 Resultados` : `📂 ${activeFolder}`}
                  subtitle={
                    filteredRecipes.length > 0
                      ? `${filteredRecipes.length} receta${filteredRecipes.length !== 1 ? "s" : ""} encontrada${filteredRecipes.length !== 1 ? "s" : ""}`
                      : searchQuery ? `Sin resultados para "${searchQuery}"` : "Esta carpeta está vacía"
                  }
                />
              </div>

              {favorites.length === 0 ? (
                /* Estado vacío con instrucciones claras */
                <div className="py-6 space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-8 h-8 text-primary opacity-60" />
                    </div>
                    <p className="font-semibold text-foreground">Aún no guardaste recetas</p>
                    <p className="text-muted-foreground text-sm mt-1">Seguí estos pasos para empezar:</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { emoji: "🍳", text: "Generá una receta en la sección Cocinar" },
                      { emoji: "❤️", text: "Tocá el corazón para guardarla como favorita" },
                      { emoji: "📁", text: "Volvé acá y organizala en carpetas" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/30">
                        <span className="text-xl shrink-0">{step.emoji}</span>
                        <p className="text-sm text-foreground">{step.text}</p>
                        {i < 2 && <ArrowDown className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />}
                        {i === 2 && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-foreground text-sm font-medium">
                    {searchQuery ? `Sin resultados para "${searchQuery}"` : "Esta carpeta está vacía"}
                  </p>
                  {!searchQuery && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-muted-foreground text-xs">Para agregar recetas:</p>
                      <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl">
                          <Hand className="w-3.5 h-3.5 text-primary" />
                          Arrastrá una receta desde otra carpeta
                        </span>
                        <span className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl">
                          <MoreVertical className="w-3.5 h-3.5 text-primary" />
                          Usá el menú ⋮ en cada receta
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredRecipes.map(fav => {
                    const emoji = getRecipeEmoji(fav.recipe_data);
                    const gradient = getRecipeColor(fav.recipe_name);
                    const isDragging = draggingRecipeId === fav.id;
                    return (
                      <div
                        key={fav.id}
                        onPointerDown={e => onPointerDown(fav.id, e)}
                        onPointerUp={e => onPointerUp(fav.id, e)}
                        onPointerCancel={() => onPointerCancel(fav.id)}
                        style={{ touchAction: "none" }}
                        className={cn(
                          "rounded-xl overflow-hidden border bg-card transition-all duration-200 select-none cursor-grab active:cursor-grabbing",
                          isDragging
                            ? "border-primary shadow-lg opacity-40 scale-95"
                            : "border-border/50 hover:shadow-md hover:border-primary/30"
                        )}
                      >
                        <div className="relative">
                          <div
                            onClick={!isDragging ? () => onSelectRecipe(fav.recipe_data) : undefined}
                            className={cn("h-28 flex items-center justify-center bg-gradient-to-br", gradient)}
                          >
                            <span className="text-4xl drop-shadow-sm">{emoji}</span>
                          </div>
                          {/* Grip icon */}
                          <div className="absolute top-1.5 left-1.5 bg-black/25 rounded-md p-1 opacity-70">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                          {/* Menu button */}
                          <button
                            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
                            onPointerUp={e => { e.stopPropagation(); e.preventDefault(); }}
                            onTouchStart={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); e.preventDefault(); setMovingRecipeId(fav.id); }}
                            className="absolute top-1.5 right-1.5 w-9 h-9 rounded-lg bg-black/25 hover:bg-black/40 flex items-center justify-center transition-colors z-10"
                            style={{ touchAction: "auto" }}
                          >
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div
                          onClick={!isDragging ? () => onSelectRecipe(fav.recipe_data) : undefined}
                          className="p-2.5 cursor-pointer"
                        >
                          <p className="font-semibold text-xs text-foreground leading-tight line-clamp-2 mb-1.5">
                            {fav.recipe_name}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <Clock className="w-3 h-3" />{fav.recipe_data.time}m
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <Flame className="w-3 h-3 text-orange-400" />
                              {fav.recipe_data.nutrition?.calories || "?"}kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Delete folder confirmation */}
      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">¿Eliminar "{deletingFolder}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Las recetas de esta carpeta se moverán a "Sin carpeta".</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingFolder(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deletingFolder && handleDeleteFolder(deletingFolder)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move/Delete recipe sheet */}
      <Sheet open={!!movingRecipeId} onOpenChange={() => setMovingRecipeId(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader>
            <SheetTitle className="text-base">
              {favorites.find(f => f.id === movingRecipeId)?.recipe_name}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">Mover a carpeta:</p>
            {folders.map(folder => {
              const currentFolder = movingRecipeId ? (folderAssignments[movingRecipeId] || "Sin carpeta") : "";
              const isCurrent = folder === currentFolder;
              return (
                <button
                  key={folder}
                  disabled={isCurrent}
                  onClick={() => movingRecipeId && handleMoveRecipe(movingRecipeId, folder)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-colors text-left",
                    isCurrent
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted/50 hover:bg-muted text-foreground"
                  )}
                >
                  {isCurrent ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium">{folder}</span>
                  {isCurrent && <Check className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
            <div className="pt-2 border-t border-border mt-3">
              <button
                onClick={e => {
                  if (movingRecipeId) handleDeleteRecipe(movingRecipeId, e as any);
                  setMovingRecipeId(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Eliminar de favoritos</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
