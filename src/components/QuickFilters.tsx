import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Timer, 
  Flame, 
  Heart, 
  Baby, 
  DollarSign,
  Wheat,
  Milk,
  Fish,
  EggFried,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

interface QuickFiltersProps {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  category: "diet" | "time" | "preference";
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: "vegetariano", label: "Vegetariano", icon: Leaf, color: "bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30", category: "diet" },
  { id: "bajo-calorias", label: "Light", icon: Flame, color: "bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30", category: "preference" },
  { id: "sin-gluten", label: "Sin Gluten", icon: Wheat, color: "bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30", category: "diet" },
  { id: "sin-lactosa", label: "Sin Lácteos", icon: Milk, color: "bg-purple-500/20 text-purple-600 border-purple-500/30 hover:bg-purple-500/30", category: "diet" },
  { id: "ninos", label: "Para Niños", icon: Baby, color: "bg-pink-500/20 text-pink-600 border-pink-500/30 hover:bg-pink-500/30", category: "preference" },
  { id: "economico", label: "Económico", icon: DollarSign, color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30", category: "preference" },
  { id: "alto-proteina", label: "Proteico", icon: Fish, color: "bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30", category: "diet" },
];

export function QuickFilters({ activeFilters, onFiltersChange }: QuickFiltersProps) {
  const { play: playSound } = useSound();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const toggleFilter = (filterId: string) => {
    playSound('pop');
    setAnimatingId(filterId);
    setTimeout(() => setAnimatingId(null), 200);

    if (activeFilters.includes(filterId)) {
      onFiltersChange(activeFilters.filter(f => f !== filterId));
    } else {
      onFiltersChange([...activeFilters, filterId]);
    }
  };

  const clearAllFilters = () => {
    playSound('pop');
    onFiltersChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          ⚡ Filtros Rápidos
        </h3>
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilters.includes(filter.id);
          
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "border-2 transition-all duration-200",
                isActive 
                  ? `${filter.color} border-current` 
                  : "bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground",
                animatingId === filter.id && "scale-95"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </button>
          );
        })}
      </div>

      {activeFilters.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {activeFilters.length} filtro{activeFilters.length > 1 ? "s" : ""} activo{activeFilters.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
