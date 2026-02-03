import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IngredientCategorySelectorProps {
  selectedIngredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
}

const INGREDIENT_CATEGORIES = {
  verduras: {
    label: "🥬 Verduras",
    color: "bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300",
    items: [
      "tomate", "cebolla", "ajo", "papa", "zanahoria", "zapallo", "calabaza",
      "zapallito", "berenjena", "morrón", "pimiento", "lechuga", "espinaca",
      "acelga", "brócoli", "coliflor", "apio", "pepino", "choclo", "arvejas",
      "porotos verdes", "batata", "remolacha", "repollo", "puerro", "nabo",
      "rabanito", "rúcula", "albahaca", "perejil", "cilantro", "hongos", "champiñones"
    ]
  },
  frutas: {
    label: "🍎 Frutas",
    color: "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300",
    items: [
      "banana", "manzana", "pera", "naranja", "mandarina", "limón", "pomelo",
      "uva", "frutilla", "frambuesa", "arándano", "mora", "durazno", "damasco",
      "ciruela", "kiwi", "mango", "ananá", "sandía", "melón", "cereza", "higo",
      "palta", "coco", "maracuyá", "papaya", "granada"
    ]
  },
  carnes: {
    label: "🥩 Carnes",
    color: "bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300",
    items: [
      "carne picada", "bife", "asado", "vacío", "matambre", "entraña", "lomo",
      "milanesa", "costilla", "osobuco", "mondongo", "pollo", "pechuga",
      "muslo de pollo", "alitas", "pata muslo", "cerdo", "bondiola", "carré",
      "costillas de cerdo", "jamón", "panceta", "chorizo", "salchicha", "morcilla",
      "cordero", "conejo"
    ]
  },
  pescados: {
    label: "🐟 Pescados y Mariscos",
    color: "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300",
    items: [
      "merluza", "salmón", "atún", "trucha", "corvina", "lenguado", "abadejo",
      "pejerrey", "surubí", "dorado", "camarón", "langostino", "mejillón",
      "calamar", "pulpo", "vieira", "berberecho"
    ]
  },
  lacteos: {
    label: "🧀 Lácteos y Huevos",
    color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300",
    items: [
      "huevo", "leche", "crema", "manteca", "queso crema", "queso rallado",
      "mozzarella", "parmesano", "provolone", "queso azul", "ricota",
      "yogur", "dulce de leche", "crema de leche"
    ]
  },
  granos: {
    label: "🌾 Granos y Harinas",
    color: "bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-300",
    items: [
      "arroz", "arroz integral", "fideos", "spaghetti", "tallarines", "ñoquis",
      "harina", "pan", "pan rallado", "tapa de empanada", "tapa de tarta",
      "polenta", "avena", "quinoa", "cuscús", "lentejas", "porotos", "garbanzos",
      "maíz", "trigo", "sémola"
    ]
  },
  condimentos: {
    label: "🧂 Condimentos y Especias",
    color: "bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300",
    items: [
      "sal", "pimienta", "orégano", "pimentón", "comino", "curry", "cúrcuma",
      "canela", "nuez moscada", "laurel", "tomillo", "romero", "ají molido",
      "provenzal", "mostaza", "mayonesa", "ketchup", "salsa de soja",
      "vinagre", "aceite de oliva", "aceite", "azúcar", "miel"
    ]
  },
  enlatados: {
    label: "🥫 Enlatados y Conservas",
    color: "bg-slate-500/20 border-slate-500/30 text-slate-700 dark:text-slate-300",
    items: [
      "tomate triturado", "tomate perita", "salsa de tomate", "puré de tomate",
      "atún en lata", "caballa", "sardinas", "choclo en lata", "arvejas en lata",
      "palmitos", "aceitunas", "alcaparras", "pickles", "duraznos en almíbar"
    ]
  },
  otros: {
    label: "🍽️ Otros",
    color: "bg-pink-500/20 border-pink-500/30 text-pink-700 dark:text-pink-300",
    items: [
      "vino blanco", "vino tinto", "cerveza", "caldo de verduras", "caldo de pollo",
      "levadura", "gelatina", "chocolate", "cacao", "café", "té", "maní",
      "nueces", "almendras", "pasas de uva", "coco rallado"
    ]
  }
};

export function IngredientCategorySelector({ 
  selectedIngredients, 
  onIngredientsChange 
}: IngredientCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleIngredient = (ingredient: string) => {
    const normalized = ingredient.toLowerCase();
    if (selectedIngredients.includes(normalized)) {
      onIngredientsChange(selectedIngredients.filter(i => i !== normalized));
    } else {
      onIngredientsChange([...selectedIngredients, normalized]);
    }
  };

  const isSelected = (ingredient: string) => 
    selectedIngredients.includes(ingredient.toLowerCase());

  const getCategorySelectedCount = (items: string[]) => 
    items.filter(item => isSelected(item)).length;

  const totalSelectedFromList = Object.values(INGREDIENT_CATEGORIES)
    .flatMap(cat => cat.items)
    .filter(item => isSelected(item)).length;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl",
          "bg-secondary/50 hover:bg-secondary/80 transition-all duration-300",
          "border-2",
          isOpen ? "border-primary/50" : "border-border"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <span className="font-medium text-foreground">Elegir de la lista</span>
          {totalSelectedFromList > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
              {totalSelectedFromList}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <ScrollArea className="h-[300px] pr-2 animate-fade-in">
          <div className="space-y-2">
            {Object.entries(INGREDIENT_CATEGORIES).map(([key, category]) => {
              const isExpanded = expandedCategories.includes(key);
              const selectedCount = getCategorySelectedCount(category.items);
              
              return (
                <div key={key} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      "w-full flex items-center justify-between p-3",
                      "bg-card hover:bg-accent/50 transition-colors",
                      "text-left"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.label}</span>
                      {selectedCount > 0 && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          category.color
                        )}>
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-3 pt-0 bg-card/50">
                      <div className="flex flex-wrap gap-2 pt-2">
                        {category.items.map(item => (
                          <button
                            key={item}
                            onClick={() => toggleIngredient(item)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-medium",
                              "border-2 transition-all duration-200",
                              "capitalize",
                              isSelected(item)
                                ? cn(category.color, "border-current")
                                : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                            )}
                          >
                            {isSelected(item) && (
                              <Check className="h-3 w-3 inline-block mr-1" />
                            )}
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {selectedIngredients.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedIngredients.length} ingrediente{selectedIngredients.length !== 1 ? 's' : ''} seleccionado{selectedIngredients.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
