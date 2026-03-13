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
type ActiveTab = "recetas" | "tips";

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

// ─── Folder persistence ────────────────────────────────────────────────
const DEFAULT_FOLDERS = ["Sin carpeta", "Almuerzos", "Cenas", "Desayunos", "Postres", "Snacks"];
const FOLDERS_KEY = "miChef_recipe_folders";
const RECIPE_FOLDERS_KEY = "miChef_recipe_folder_assignments";
const HELP_DISMISSED_KEY = "miChef_favorites_help_dismissed";

// Tips folders
const DEFAULT_TIP_FOLDERS = ["Sin carpeta", "Conservación", "Cocción", "Nutrición", "Ahorro"];
const TIP_FOLDERS_KEY = "miChef_tip_folders";
const TIP_FOLDER_ASSIGNMENTS_KEY = "miChef_tip_folder_assignments";

function getTipFolders(): string[] {
  try { const s = localStorage.getItem(TIP_FOLDERS_KEY); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_TIP_FOLDERS;
}
function saveTipFolders(f: string[]) { localStorage.setItem(TIP_FOLDERS_KEY, JSON.stringify(f)); }
function getTipFolderAssignments(): Record<string, string> {
  try { const s = localStorage.getItem(TIP_FOLDER_ASSIGNMENTS_KEY); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveTipFolderAssignment(tipId: string, folder: string) {
  const a = getTipFolderAssignments();
  a[tipId] = folder;
  localStorage.setItem(TIP_FOLDER_ASSIGNMENTS_KEY, JSON.stringify(a));
}

function getFolders(): string[] {
  try { const s = localStorage.getItem(FOLDERS_KEY); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_FOLDERS;
}
function saveFolders(f: string[]) { localStorage.setItem(FOLDERS_KEY, JSON.stringify(f)); }
function getFolderAssignments(): Record<string, string> {
  try { const s = localStorage.getItem(RECIPE_FOLDERS_KEY); if (s) return JSON.parse(s); } catch {}
  return {};
}
function saveFolderAssignment(recipeId: string, folder: string) {
  const a = getFolderAssignments();
  a[recipeId] = folder;
  localStorage.setItem(RECIPE_FOLDERS_KEY, JSON.stringify(a));
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
  const [favoriteTips, setFavoriteTips] = useState<FavoriteFoodTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("recetas");
  const [selectedTip, setSelectedTip] = useState<FavoriteFoodTip | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTipsHelp, setShowTipsHelp] = useState(
    localStorage.getItem("tips_help_dismissed") !== "1"
  );

  // Carpetas recetas
  const [folders, setFolders] = useState<string[]>(getFolders());
  const [activeFolder, setActiveFolder] = useState<string>("Sin carpeta");
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>(getFolderAssignments());
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showSheetNewFolder, setShowSheetNewFolder] = useState(false);
  const [sheetNewFolderName, setSheetNewFolderName] = useState("");
  const [movingRecipeId, setMovingRecipeId] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Carpetas tips
  const [tipFolders, setTipFolders] = useState<string[]>(getTipFolders());
  const [activeTipFolder, setActiveTipFolder] = useState<string>("Sin carpeta");
  const [tipFolderAssignments, setTipFolderAssignments] = useState<Record<string, string>>(getTipFolderAssignments());
  const [newTipFolderName, setNewTipFolderName] = useState("");
  const [showNewTipFolderInput, setShowNewTipFolderInput] = useState(false);
  const [movingTipId, setMovingTipId] = useState<string | null>(null);
  const [deletingTipFolder, setDeletingTipFolder] = useState<string | null>(null);
  const [tipSearchQuery, setTipSearchQuery] = useState("");

  // Drag state
  const [draggingRecipeId, setDraggingRecipeId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const folderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRecipeRef = useRef<string | null>(null);
  const longPressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissHelp = () => {
    localStorage.setItem(HELP_DISMISSED_KEY, "1");
    setShowHelp(false);
  };

  useEffect(() => {
    if (user) { fetchFavorites(); fetchFavoriteTips(); }
    else { setFavorites([]); setFavoriteTips([]); setIsLoading(false); }
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

  const fetchFavoriteTips = async () => {
    if (!user) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("favorite_food_tips").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setFavoriteTips(data || []);
    } catch (e) { console.error(e); }
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

  const handleDeleteTip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("favorite_food_tips").delete().eq("id", id);
      if (error) throw error;
      setFavoriteTips(prev => prev.filter(f => f.id !== id));
      toast({ title: t("favTipDeleted") });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  // ─── Tips folder logic ────────────────────────────────────────────────
  const filteredTips = useMemo(() => {
    const q = tipSearchQuery.toLowerCase().trim();
    return favoriteTips.filter(tip => {
      const inFolder = (tipFolderAssignments[tip.id] || "Sin carpeta") === activeTipFolder;
      if (!inFolder) return false;
      if (!q) return true;
      return tip.food_name.toLowerCase().includes(q) ||
        tip.tip_data.mainInfo?.toLowerCase().includes(q) ||
        (categoryLabels[tip.category] || "").toLowerCase().includes(q);
    });
  }, [favoriteTips, tipSearchQuery, activeTipFolder, tipFolderAssignments]);

  const tipFolderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tipFolders.forEach(f => { counts[f] = 0; });
    favoriteTips.forEach(tip => {
      const folder = tipFolderAssignments[tip.id] || "Sin carpeta";
      counts[folder] = (counts[folder] || 0) + 1;
    });
    return counts;
  }, [favoriteTips, tipFolderAssignments, tipFolders]);

  const handleMoveTip = useCallback((tipId: string, folder: string) => {
    saveTipFolderAssignment(tipId, folder);
    setTipFolderAssignments(prev => ({ ...prev, [tipId]: folder }));
    setMovingTipId(null);
    toast({ title: t("favTipMoved"), description: `${t("favMovedTo").replace("{folder}", folder)}` });
  }, [toast]);

  const handleCreateTipFolder = () => {
    const name = newTipFolderName.trim();
    if (!name || tipFolders.includes(name)) return;
    const updated = [...tipFolders, name];
    setTipFolders(updated); saveTipFolders(updated);
    setNewTipFolderName(""); setShowNewTipFolderInput(false);
    setActiveTipFolder(name);
    toast({ title: t("favFolderCreated"), description: `"${name}" ${t("favFolderTipCreatedDesc")}` });
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) return;
    const updated = [...folders, name];
    setFolders(updated); saveFolders(updated);
    setNewFolderName(""); setShowNewFolderInput(false);
    setActiveFolder(name);
    toast({ title: t("favFolderCreated"), description: `"${name}" ${t("favFolderCreatedDesc")}` });
  };

  const handleMoveRecipe = useCallback((recipeId: string, folder: string) => {
    saveFolderAssignment(recipeId, folder);
    setFolderAssignments(prev => ({ ...prev, [recipeId]: folder }));
    setMovingRecipeId(null);
    toast({ title: t("favRecipeMoved"), description: `${t("favMovedTo").replace("{folder}", folder)}` });
  }, [toast]);

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
        const currentFolder = getFolderAssignments()[recipeId] || "Sin carpeta";
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

      {/* ── Tab Selector ── */}
      <div className="flex rounded-2xl overflow-hidden border border-border/50 bg-muted/30">
        {(["recetas", "tips"] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all",
              activeTab === tab
                ? "border-b-2 border-primary text-primary bg-transparent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-b-2 border-transparent"
            )}
          >
            {tab === "recetas" ? <UtensilsCrossed className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            {tab === "recetas" ? t("favMyRecipes") : t("favMyTips")}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-semibold",
              activeTab === tab ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {tab === "recetas" ? favorites.length : favoriteTips.length}
            </span>
          </button>
        ))}
      </div>

      {/* ════════ RECETAS ════════ */}
      {activeTab === "recetas" && (
        <div className="space-y-4">

          {/* Panel de ayuda */}
          {showHelp && <HowItWorksBanner onDismiss={dismissHelp} />}

          {/* Botón para volver a ver ayuda */}
          {!showHelp && (
            <button
              onClick={() => setShowHelp(true)}
              className="animate-neon-pulse flex items-center justify-center w-8 h-8 rounded-full border border-sky-400/40 bg-sky-500/5 text-sky-500 transition-colors duration-300 hover:bg-sky-500/15 hover:border-sky-400/70"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

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

              <div className="flex flex-wrap gap-2">
                {folders.map(folder => {
                  const isActive = activeFolder === folder;
                  const isOver = dragOverFolder === folder;
                  const count = folderCounts[folder] || 0;
                  const isDeletable = folder !== "Sin carpeta";
                  return (
                    <div
                      key={folder}
                      ref={el => { folderRefs.current[folder] = el; }}
                      className="flex items-center"
                    >
                      <button
                        onClick={() => !draggingRecipeId && setActiveFolder(folder)}
                        className={cn(
                          "flex items-center gap-2 py-3 text-sm font-medium transition-all duration-150 border-2",
                          isDeletable ? "pl-4 pr-3 rounded-l-2xl border-r-0" : "px-4 rounded-2xl",
                          isOver
                            ? "bg-primary text-primary-foreground border-primary scale-110 shadow-xl"
                            : isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        {isOver
                          ? <FolderOpen className="w-4 h-4 animate-bounce" />
                          : isActive ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 text-muted-foreground" />
                        }
                        <span className={cn(!isActive && !isOver && "text-foreground")}>{folder}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center tabular-nums",
                          isActive || isOver
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {count}
                        </span>
                      </button>
                      {isDeletable && (
                        <button
                          onClick={() => setDeletingFolder(folder)}
                          className={cn(
                            "flex items-center justify-center w-7 h-[46px] rounded-r-2xl border-2 border-l-0 transition-all",
                            isOver || isActive
                              ? "bg-primary border-primary text-primary-foreground/70 hover:text-primary-foreground"
                              : "bg-card border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          )}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); setMovingRecipeId(fav.id); }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/25 hover:bg-black/40 flex items-center justify-center transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-white" />
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
      )}

      {/* ════════ TIPS ════════ */}
      {activeTab === "tips" && (
        <div className="space-y-4">

          {/* Banner cómo funciona Trucos */}
          {showTipsHelp && (
            <div className="rounded-2xl border-2 border-amber-400/30 bg-gradient-to-br from-amber-500/8 to-primary/5 p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <ChefHat className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">¿Cómo se guardan los Trucos?</span>
                </div>
                <button
                  onClick={() => { localStorage.setItem("tips_help_dismissed", "1"); setShowTipsHelp(false); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
                  <span className="text-lg shrink-0">🔍</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Ir a "Trucos del Chef"</p>
                    <p className="text-xs text-muted-foreground">Entrá en Más → Trucos del Chef y buscá un alimento que te interese</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
                  <span className="text-lg shrink-0">❤️</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Tocá el corazón</p>
                    <p className="text-xs text-muted-foreground">Dale ❤️ a cualquier truco para guardarlo instantáneamente acá</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-background/60">
                  <span className="text-lg shrink-0">📂</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Organizá con carpetas</p>
                    <p className="text-xs text-muted-foreground">Creá carpetas para agrupar tus trucos por categoría o tema</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón para volver a ver ayuda */}
          {!showTipsHelp && (
            <button
              onClick={() => setShowTipsHelp(true)}
              className="animate-neon-pulse flex items-center justify-center w-8 h-8 rounded-full border border-sky-400/40 bg-sky-500/5 text-sky-500 transition-colors duration-300 hover:bg-sky-500/15 hover:border-sky-400/70"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* PASO 1 — Carpetas de tips */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 space-y-3">
              <StepHeader number={1} title="Organizar por carpetas" subtitle="Agrupá tus tips por categoría" />
              <div className="flex flex-wrap gap-2">
                {tipFolders.map(f => (
                  <div
                    key={f}
                    ref={el => { folderRefs.current["tip_" + f] = el; }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium cursor-pointer transition-all border select-none",
                      activeTipFolder === f
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-foreground border-border/50 hover:bg-muted"
                    )}
                    onClick={() => setActiveTipFolder(f)}
                  >
                    {activeTipFolder === f ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                    <span className="truncate max-w-[90px]">{f}</span>
                    {tipFolderCounts[f] > 0 && (
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", activeTipFolder === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")}>
                        {tipFolderCounts[f]}
                      </span>
                    )}
                    {f !== "Sin carpeta" && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingTipFolder(f); }}
                        className={cn("ml-0.5 rounded-full p-0.5 transition-colors", activeTipFolder === f ? "hover:bg-primary-foreground/20 text-primary-foreground/70" : "hover:bg-muted-foreground/20 text-muted-foreground")}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {/* Nueva carpeta */}
                {showNewTipFolderInput ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      autoFocus
                      value={newTipFolderName}
                      onChange={e => setNewTipFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCreateTipFolder(); if (e.key === "Escape") setShowNewTipFolderInput(false); }}
                      placeholder="Nombre…"
                      className="h-8 w-28 text-sm"
                    />
                    <button onClick={handleCreateTipFolder} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setShowNewTipFolderInput(false)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewTipFolderInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-muted-foreground border-2 border-dashed border-border/50 hover:border-primary/50 hover:text-primary transition-all"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Nueva
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASO 2 — Buscar tips */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 space-y-3">
              <StepHeader number={2} title="Buscar en mis tips" subtitle="Filtrá por alimento o categoría" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: tomate, conservación, proteína…"
                  value={tipSearchQuery}
                  onChange={e => setTipSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
                {tipSearchQuery && (
                  <button onClick={() => setTipSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PASO 3 — Tips */}
          <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-4 space-y-3">
              <StepHeader
                number={3}
                title={`📂 ${activeTipFolder}`}
                subtitle={
                  filteredTips.length > 0
                    ? `${filteredTips.length} tip${filteredTips.length !== 1 ? "s" : ""}`
                    : "Esta carpeta está vacía"
                }
              />
              {favoriteTips.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-muted-foreground text-sm font-medium">Aún no guardaste tips</p>
                  <p className="text-muted-foreground/60 text-xs">Guardá tips desde la sección "Aprende"</p>
                </div>
              ) : filteredTips.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">{tipSearchQuery ? `Sin resultados para "${tipSearchQuery}"` : "Esta carpeta está vacía"}</p>
                  {!tipSearchQuery && (
                    <p className="text-xs text-muted-foreground mt-1">Usá el menú ⋮ para mover tips acá</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTips.map(tip => {
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-foreground truncate capitalize">{tip.food_name}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                {categoryLabels[tip.category] || tip.category}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tip.tip_data.mainInfo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={e => { e.stopPropagation(); setMovingTipId(tip.id); }}
                            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* ── Confirm delete folder ── */}
      <Dialog open={!!deletingFolder} onOpenChange={open => !open && setDeletingFolder(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" /> Eliminar carpeta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar <strong>"{deletingFolder}"</strong>?
              {deletingFolder && (folderCounts[deletingFolder] || 0) > 0 && (
                <span> Las <strong>{folderCounts[deletingFolder]}</strong> recetas se moverán a "Sin carpeta".</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setDeletingFolder(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (!deletingFolder) return;
                  const updated = { ...folderAssignments };
                  favorites.forEach(f => { if ((updated[f.id] || "Sin carpeta") === deletingFolder) updated[f.id] = "Sin carpeta"; });
                  localStorage.setItem(RECIPE_FOLDERS_KEY, JSON.stringify(updated));
                  setFolderAssignments(updated);
                  const newFolders = folders.filter(f => f !== deletingFolder);
                  setFolders(newFolders); saveFolders(newFolders);
                  if (activeFolder === deletingFolder) setActiveFolder("Sin carpeta");
                  setDeletingFolder(null);
                  toast({ title: "Carpeta eliminada" });
                }}
              >Eliminar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sheet de acciones ── */}
      {(() => {
        const sheetRecipe = movingRecipeId ? favorites.find(f => f.id === movingRecipeId) : null;
        return (
          <Sheet open={!!movingRecipeId} onOpenChange={open => { if (!open) { setMovingRecipeId(null); setShowSheetNewFolder(false); setSheetNewFolderName(""); } }}>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              {sheetRecipe && (
                <>
                  <SheetHeader className="mb-4">
                  <SheetTitle className="text-left text-base flex items-center gap-2">
                      <span className="text-2xl">{getRecipeEmoji(sheetRecipe.recipe_data)}</span>
                      <span className="line-clamp-1">{sheetRecipe.recipe_name}</span>
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground text-left">
                      {t("favFolderCurrentLabel")} <strong>{folderAssignments[sheetRecipe.id] || t("favDefaultFolderNoFolder")}</strong>
                    </p>
                  </SheetHeader>
                  <div className="space-y-2 mb-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MoveRight className="w-3.5 h-3.5" /> {t("favMoveToFolder")}
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
                            {isCurrent ? <Check className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />}
                            <span className="truncate">{f}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón + Nueva carpeta */}
                    {!showSheetNewFolder ? (
                      <button
                        onClick={() => setShowSheetNewFolder(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 transition-all mt-1"
                      >
                        <FolderPlus className="w-4 h-4" /> + Nueva carpeta
                      </button>
                    ) : (
                      <div className="flex gap-2 mt-1 animate-fade-in">
                        <Input
                          placeholder="Nombre de carpeta…"
                          value={sheetNewFolderName}
                          onChange={e => setSheetNewFolderName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const name = sheetNewFolderName.trim();
                              if (name && !folders.includes(name)) {
                                const updated = [...folders, name];
                                setFolders(updated); saveFolders(updated);
                                handleMoveRecipe(sheetRecipe.id, name);
                              }
                              setSheetNewFolderName(""); setShowSheetNewFolder(false);
                            }
                            if (e.key === "Escape") { setSheetNewFolderName(""); setShowSheetNewFolder(false); }
                          }}
                          className="h-9 text-sm flex-1"
                          autoFocus
                        />
                        <Button size="sm" className="h-9 px-3" onClick={() => {
                          const name = sheetNewFolderName.trim();
                          if (name && !folders.includes(name)) {
                            const updated = [...folders, name];
                            setFolders(updated); saveFolders(updated);
                            handleMoveRecipe(sheetRecipe.id, name);
                          }
                          setSheetNewFolderName(""); setShowSheetNewFolder(false);
                        }}><Check className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-9 px-3" onClick={() => { setSheetNewFolderName(""); setShowSheetNewFolder(false); }}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}
                  </div>
                    <button
                    onClick={e => { handleDeleteRecipe(sheetRecipe.id, e); setMovingRecipeId(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all border border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" /> {t("favDeleteFromFavorites")}
                  </button>
                </>
              )}
            </SheetContent>
          </Sheet>
        );
      })()}

      {/* ── Confirm delete TIP folder ── */}
      <Dialog open={!!deletingTipFolder} onOpenChange={open => !open && setDeletingTipFolder(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" /> Eliminar carpeta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar <strong>"{deletingTipFolder}"</strong>?
              {deletingTipFolder && (tipFolderCounts[deletingTipFolder] || 0) > 0 && (
                <span> Los <strong>{tipFolderCounts[deletingTipFolder]}</strong> tips se moverán a "Sin carpeta".</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setDeletingTipFolder(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (!deletingTipFolder) return;
                  const updated = { ...tipFolderAssignments };
                  favoriteTips.forEach(t => { if ((updated[t.id] || "Sin carpeta") === deletingTipFolder) updated[t.id] = "Sin carpeta"; });
                  localStorage.setItem(TIP_FOLDER_ASSIGNMENTS_KEY, JSON.stringify(updated));
                  setTipFolderAssignments(updated);
                  const newFolders = tipFolders.filter(f => f !== deletingTipFolder);
                  setTipFolders(newFolders); saveTipFolders(newFolders);
                  if (activeTipFolder === deletingTipFolder) setActiveTipFolder("Sin carpeta");
                  setDeletingTipFolder(null);
                  toast({ title: "Carpeta eliminada" });
                }}
              >Eliminar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sheet acciones de tips ── */}
      {(() => {
        const sheetTip = movingTipId ? favoriteTips.find(t => t.id === movingTipId) : null;
        const Icon = sheetTip ? (categoryIcons[sheetTip.category] || Lightbulb) : Lightbulb;
        const colorClass = sheetTip ? (categoryColors[sheetTip.category] || "text-primary bg-primary") : "text-primary bg-primary";
        const [textColor] = colorClass.split(" ");
        return (
          <Sheet open={!!movingTipId} onOpenChange={open => !open && setMovingTipId(null)}>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              {sheetTip && (
                <>
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left text-base flex items-center gap-2">
                      <Icon className={cn("w-5 h-5 shrink-0", textColor)} />
                      <span className="capitalize line-clamp-1">{sheetTip.food_name}</span>
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground text-left">
                      Carpeta actual: <strong>{tipFolderAssignments[sheetTip.id] || "Sin carpeta"}</strong>
                    </p>
                  </SheetHeader>
                  <div className="space-y-2 mb-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MoveRight className="w-3.5 h-3.5" /> Mover a carpeta
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {tipFolders.map(f => {
                        const isCurrent = (tipFolderAssignments[sheetTip.id] || "Sin carpeta") === f;
                        return (
                          <button
                            key={f}
                            onClick={() => handleMoveTip(sheetTip.id, f)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                              isCurrent
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-foreground border-border/50 hover:bg-muted active:scale-95"
                            )}
                          >
                            {isCurrent ? <Check className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />}
                            <span className="truncate">{f}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={async (e) => { await handleDeleteTip(sheetTip.id, e as React.MouseEvent); setMovingTipId(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all border border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" /> {t("favDeleteTip")}
                  </button>
                </>
              )}
            </SheetContent>
          </Sheet>
        );
      })()}

      {/* ── Tip Detail Modal ── */}
      <Dialog open={!!selectedTip} onOpenChange={open => !open && setSelectedTip(null)}>
        <DialogContent className="max-w-md max-h-[80vh]" aria-describedby={undefined}>
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
