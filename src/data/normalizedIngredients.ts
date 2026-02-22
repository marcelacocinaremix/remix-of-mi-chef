// Normalized ingredient database with unique IDs
// All matching should be done by ID, not by text

export interface NormalizedIngredient {
  id: string;
  name: string;        // canonical display name
  category: string;
  emoji: string;
  /** Alternative names that map to this ingredient */
  aliases: string[];
}

export const INGREDIENT_CATEGORIES_META: Record<string, { label: string; emoji: string; color: string }> = {
  verduras:    { label: "Verduras",             emoji: "🥬", color: "bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300" },
  frutas:      { label: "Frutas",               emoji: "🍎", color: "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300" },
  carnes:      { label: "Carnes",               emoji: "🥩", color: "bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300" },
  pescados:    { label: "Pescados y Mariscos",   emoji: "🐟", color: "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300" },
  lacteos:     { label: "Lácteos y Huevos",      emoji: "🧀", color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300" },
  granos:      { label: "Granos y Harinas",      emoji: "🌾", color: "bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-300" },
  condimentos: { label: "Condimentos y Especias", emoji: "🧂", color: "bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300" },
  enlatados:   { label: "Enlatados y Conservas",  emoji: "🥫", color: "bg-slate-500/20 border-slate-500/30 text-slate-700 dark:text-slate-300" },
  otros:       { label: "Otros",                 emoji: "🍽️", color: "bg-pink-500/20 border-pink-500/30 text-pink-700 dark:text-pink-300" },
};

export const NORMALIZED_INGREDIENTS: NormalizedIngredient[] = [
  // ── Verduras ──
  { id: "tomate",       name: "Tomate",       category: "verduras",    emoji: "🍅", aliases: ["jitomate"] },
  { id: "cebolla",      name: "Cebolla",      category: "verduras",    emoji: "🧅", aliases: ["cebolla blanca", "cebolla morada", "cebolla roja"] },
  { id: "ajo",          name: "Ajo",          category: "verduras",    emoji: "🧄", aliases: ["diente de ajo"] },
  { id: "papa",         name: "Papa",         category: "verduras",    emoji: "🥔", aliases: ["patata", "papas"] },
  { id: "zanahoria",    name: "Zanahoria",    category: "verduras",    emoji: "🥕", aliases: [] },
  { id: "zapallo",      name: "Zapallo",      category: "verduras",    emoji: "🎃", aliases: ["calabaza", "zapallo anco"] },
  { id: "zapallito",    name: "Zapallito",    category: "verduras",    emoji: "🥒", aliases: ["zucchini", "calabacín"] },
  { id: "berenjena",    name: "Berenjena",    category: "verduras",    emoji: "🍆", aliases: [] },
  { id: "morron",       name: "Morrón",       category: "verduras",    emoji: "🫑", aliases: ["pimiento", "pimiento rojo", "pimiento verde", "morrón rojo", "morrón verde"] },
  { id: "lechuga",      name: "Lechuga",      category: "verduras",    emoji: "🥬", aliases: ["lechuga criolla", "lechuga mantecosa"] },
  { id: "espinaca",     name: "Espinaca",     category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "acelga",       name: "Acelga",       category: "verduras",    emoji: "🥬", aliases: [] },
  { id: "brocoli",      name: "Brócoli",      category: "verduras",    emoji: "🥦", aliases: ["brocoli"] },
  { id: "coliflor",     name: "Coliflor",     category: "verduras",    emoji: "🥦", aliases: [] },
  { id: "apio",         name: "Apio",         category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "pepino",       name: "Pepino",       category: "verduras",    emoji: "🥒", aliases: [] },
  { id: "choclo",       name: "Choclo",       category: "verduras",    emoji: "🌽", aliases: ["maíz", "elote"] },
  { id: "arvejas",      name: "Arvejas",      category: "verduras",    emoji: "🫛", aliases: ["guisantes", "chícharos"] },
  { id: "porotos_verdes", name: "Porotos verdes", category: "verduras", emoji: "🫘", aliases: ["chauchas", "ejotes", "judías verdes"] },
  { id: "batata",       name: "Batata",       category: "verduras",    emoji: "🍠", aliases: ["boniato", "camote"] },
  { id: "remolacha",    name: "Remolacha",    category: "verduras",    emoji: "🟣", aliases: ["betarraga", "betabel"] },
  { id: "repollo",      name: "Repollo",      category: "verduras",    emoji: "🥬", aliases: ["col"] },
  { id: "puerro",       name: "Puerro",       category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "nabo",         name: "Nabo",         category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "rabanito",     name: "Rabanito",     category: "verduras",    emoji: "🌿", aliases: ["rábano"] },
  { id: "rucula",       name: "Rúcula",       category: "verduras",    emoji: "🌿", aliases: ["arugula"] },
  { id: "albahaca",     name: "Albahaca",     category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "perejil",      name: "Perejil",      category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "cilantro",     name: "Cilantro",     category: "verduras",    emoji: "🌿", aliases: [] },
  { id: "hongos",       name: "Hongos",       category: "verduras",    emoji: "🍄", aliases: ["champiñones", "champignones", "setas", "portobellos"] },

  // ── Frutas ──
  { id: "banana",     name: "Banana",     category: "frutas", emoji: "🍌", aliases: ["plátano"] },
  { id: "manzana",    name: "Manzana",    category: "frutas", emoji: "🍎", aliases: [] },
  { id: "pera",       name: "Pera",       category: "frutas", emoji: "🍐", aliases: [] },
  { id: "naranja",    name: "Naranja",    category: "frutas", emoji: "🍊", aliases: [] },
  { id: "mandarina",  name: "Mandarina",  category: "frutas", emoji: "🍊", aliases: [] },
  { id: "limon",      name: "Limón",      category: "frutas", emoji: "🍋", aliases: ["lima"] },
  { id: "pomelo",     name: "Pomelo",     category: "frutas", emoji: "🍊", aliases: ["toronja"] },
  { id: "uva",        name: "Uva",        category: "frutas", emoji: "🍇", aliases: [] },
  { id: "frutilla",   name: "Frutilla",   category: "frutas", emoji: "🍓", aliases: ["fresa"] },
  { id: "frambuesa",  name: "Frambuesa",  category: "frutas", emoji: "🫐", aliases: [] },
  { id: "arandano",   name: "Arándano",   category: "frutas", emoji: "🫐", aliases: [] },
  { id: "mora",       name: "Mora",       category: "frutas", emoji: "🫐", aliases: [] },
  { id: "durazno",    name: "Durazno",    category: "frutas", emoji: "🍑", aliases: ["melocotón"] },
  { id: "damasco",    name: "Damasco",    category: "frutas", emoji: "🍑", aliases: ["albaricoque", "chabacano"] },
  { id: "ciruela",    name: "Ciruela",    category: "frutas", emoji: "🍑", aliases: [] },
  { id: "kiwi",       name: "Kiwi",       category: "frutas", emoji: "🥝", aliases: [] },
  { id: "mango",      name: "Mango",      category: "frutas", emoji: "🥭", aliases: [] },
  { id: "anana",      name: "Ananá",      category: "frutas", emoji: "🍍", aliases: ["piña"] },
  { id: "sandia",     name: "Sandía",     category: "frutas", emoji: "🍉", aliases: [] },
  { id: "melon",      name: "Melón",      category: "frutas", emoji: "🍈", aliases: [] },
  { id: "cereza",     name: "Cereza",     category: "frutas", emoji: "🍒", aliases: ["guinda"] },
  { id: "higo",       name: "Higo",       category: "frutas", emoji: "🍇", aliases: [] },
  { id: "palta",      name: "Palta",      category: "frutas", emoji: "🥑", aliases: ["aguacate", "avocado"] },
  { id: "coco",       name: "Coco",       category: "frutas", emoji: "🥥", aliases: [] },
  { id: "maracuya",   name: "Maracuyá",   category: "frutas", emoji: "🍈", aliases: ["fruta de la pasión"] },
  { id: "papaya",     name: "Papaya",     category: "frutas", emoji: "🍈", aliases: [] },
  { id: "granada",    name: "Granada",    category: "frutas", emoji: "🍎", aliases: [] },

  // ── Carnes ──
  { id: "carne_picada",  name: "Carne picada",   category: "carnes", emoji: "🥩", aliases: ["carne molida", "picada"] },
  { id: "bife",           name: "Bife",           category: "carnes", emoji: "🥩", aliases: ["bistec"] },
  { id: "asado",          name: "Asado",          category: "carnes", emoji: "🥩", aliases: ["tira de asado"] },
  { id: "vacio",          name: "Vacío",          category: "carnes", emoji: "🥩", aliases: [] },
  { id: "matambre",       name: "Matambre",       category: "carnes", emoji: "🥩", aliases: [] },
  { id: "entrana",        name: "Entraña",        category: "carnes", emoji: "🥩", aliases: [] },
  { id: "lomo",           name: "Lomo",           category: "carnes", emoji: "🥩", aliases: ["solomillo"] },
  { id: "milanesa",       name: "Milanesa",       category: "carnes", emoji: "🥩", aliases: [] },
  { id: "costilla",       name: "Costilla",       category: "carnes", emoji: "🥩", aliases: ["costillitas"] },
  { id: "osobuco",        name: "Osobuco",        category: "carnes", emoji: "🥩", aliases: [] },
  { id: "mondongo",       name: "Mondongo",       category: "carnes", emoji: "🥩", aliases: [] },
  { id: "pollo",          name: "Pollo",          category: "carnes", emoji: "🍗", aliases: ["pollo entero"] },
  { id: "pechuga",        name: "Pechuga",        category: "carnes", emoji: "🍗", aliases: ["pechuga de pollo", "suprema"] },
  { id: "muslo_pollo",    name: "Muslo de pollo", category: "carnes", emoji: "🍗", aliases: ["muslo", "pata muslo"] },
  { id: "alitas",         name: "Alitas",         category: "carnes", emoji: "🍗", aliases: ["ala de pollo"] },
  { id: "cerdo",          name: "Cerdo",          category: "carnes", emoji: "🐷", aliases: [] },
  { id: "bondiola",       name: "Bondiola",       category: "carnes", emoji: "🐷", aliases: [] },
  { id: "carre",          name: "Carré",          category: "carnes", emoji: "🐷", aliases: ["carré de cerdo"] },
  { id: "costillas_cerdo",name: "Costillas de cerdo", category: "carnes", emoji: "🐷", aliases: [] },
  { id: "jamon",          name: "Jamón",          category: "carnes", emoji: "🐷", aliases: ["jamón cocido", "jamón crudo"] },
  { id: "panceta",        name: "Panceta",        category: "carnes", emoji: "🐷", aliases: ["tocino", "bacon"] },
  { id: "chorizo",        name: "Chorizo",        category: "carnes", emoji: "🌭", aliases: [] },
  { id: "salchicha",      name: "Salchicha",      category: "carnes", emoji: "🌭", aliases: ["frankfurt", "salchichas"] },
  { id: "morcilla",       name: "Morcilla",       category: "carnes", emoji: "🌭", aliases: [] },
  { id: "cordero",        name: "Cordero",        category: "carnes", emoji: "🐑", aliases: [] },
  { id: "conejo",         name: "Conejo",         category: "carnes", emoji: "🐇", aliases: [] },

  // ── Pescados y Mariscos ──
  { id: "merluza",    name: "Merluza",    category: "pescados", emoji: "🐟", aliases: [] },
  { id: "salmon",     name: "Salmón",     category: "pescados", emoji: "🐟", aliases: [] },
  { id: "atun",       name: "Atún",       category: "pescados", emoji: "🐟", aliases: [] },
  { id: "trucha",     name: "Trucha",     category: "pescados", emoji: "🐟", aliases: [] },
  { id: "corvina",    name: "Corvina",    category: "pescados", emoji: "🐟", aliases: [] },
  { id: "lenguado",   name: "Lenguado",   category: "pescados", emoji: "🐟", aliases: [] },
  { id: "abadejo",    name: "Abadejo",    category: "pescados", emoji: "🐟", aliases: [] },
  { id: "pejerrey",   name: "Pejerrey",   category: "pescados", emoji: "🐟", aliases: [] },
  { id: "surubi",     name: "Surubí",     category: "pescados", emoji: "🐟", aliases: [] },
  { id: "dorado",     name: "Dorado",     category: "pescados", emoji: "🐟", aliases: [] },
  { id: "camaron",    name: "Camarón",    category: "pescados", emoji: "🦐", aliases: ["camarones", "gambas"] },
  { id: "langostino",  name: "Langostino",  category: "pescados", emoji: "🦐", aliases: [] },
  { id: "mejillon",    name: "Mejillón",    category: "pescados", emoji: "🦪", aliases: ["mejillones"] },
  { id: "calamar",     name: "Calamar",     category: "pescados", emoji: "🦑", aliases: ["calamares"] },
  { id: "pulpo",       name: "Pulpo",       category: "pescados", emoji: "🐙", aliases: [] },
  { id: "vieira",      name: "Vieira",      category: "pescados", emoji: "🦪", aliases: [] },

  // ── Lácteos y Huevos ──
  { id: "huevo",         name: "Huevo",         category: "lacteos", emoji: "🥚", aliases: ["huevos"] },
  { id: "leche",         name: "Leche",         category: "lacteos", emoji: "🥛", aliases: [] },
  { id: "crema",         name: "Crema",         category: "lacteos", emoji: "🫙", aliases: ["crema de leche", "nata"] },
  { id: "manteca",       name: "Manteca",       category: "lacteos", emoji: "🧈", aliases: ["mantequilla"] },
  { id: "queso_crema",   name: "Queso crema",   category: "lacteos", emoji: "🧀", aliases: ["philadelphia", "cream cheese"] },
  { id: "queso_rallado", name: "Queso rallado", category: "lacteos", emoji: "🧀", aliases: [] },
  { id: "mozzarella",    name: "Mozzarella",    category: "lacteos", emoji: "🧀", aliases: ["muzarella", "muzza"] },
  { id: "parmesano",     name: "Parmesano",     category: "lacteos", emoji: "🧀", aliases: ["queso parmesano", "reggianito"] },
  { id: "provolone",     name: "Provolone",     category: "lacteos", emoji: "🧀", aliases: [] },
  { id: "queso_azul",    name: "Queso azul",    category: "lacteos", emoji: "🧀", aliases: ["roquefort"] },
  { id: "ricota",        name: "Ricota",        category: "lacteos", emoji: "🧀", aliases: ["ricotta", "requesón"] },
  { id: "yogur",         name: "Yogur",         category: "lacteos", emoji: "🫙", aliases: ["yogurt"] },
  { id: "dulce_de_leche",name: "Dulce de leche",category: "lacteos", emoji: "🫙", aliases: [] },

  // ── Granos y Harinas ──
  { id: "arroz",            name: "Arroz",            category: "granos", emoji: "🍚", aliases: ["arroz blanco"] },
  { id: "arroz_integral",   name: "Arroz integral",   category: "granos", emoji: "🍚", aliases: [] },
  { id: "fideos",           name: "Fideos",           category: "granos", emoji: "🍝", aliases: ["pasta", "spaghetti", "tallarines", "fusilli", "penne", "mostachol"] },
  { id: "noquis",           name: "Ñoquis",           category: "granos", emoji: "🍝", aliases: ["gnocchi"] },
  { id: "harina",           name: "Harina",           category: "granos", emoji: "🌾", aliases: ["harina 000", "harina 0000"] },
  { id: "pan",              name: "Pan",              category: "granos", emoji: "🍞", aliases: ["pan blanco", "pan lactal", "pan francés"] },
  { id: "pan_rallado",      name: "Pan rallado",      category: "granos", emoji: "🍞", aliases: ["rebozador"] },
  { id: "tapa_empanada",    name: "Tapa de empanada", category: "granos", emoji: "🥟", aliases: ["tapas de empanada", "discos de empanada"] },
  { id: "tapa_tarta",       name: "Tapa de tarta",    category: "granos", emoji: "🥧", aliases: ["tapas de tarta", "masa de tarta"] },
  { id: "polenta",          name: "Polenta",          category: "granos", emoji: "🌽", aliases: [] },
  { id: "avena",            name: "Avena",            category: "granos", emoji: "🌾", aliases: [] },
  { id: "quinoa",           name: "Quinoa",           category: "granos", emoji: "🌾", aliases: ["quinua"] },
  { id: "cuscus",           name: "Cuscús",           category: "granos", emoji: "🌾", aliases: ["couscous"] },
  { id: "lentejas",         name: "Lentejas",         category: "granos", emoji: "🫘", aliases: [] },
  { id: "porotos",          name: "Porotos",          category: "granos", emoji: "🫘", aliases: ["frijoles", "alubias", "porotos negros"] },
  { id: "garbanzos",        name: "Garbanzos",        category: "granos", emoji: "🫘", aliases: [] },
  { id: "semola",           name: "Sémola",           category: "granos", emoji: "🌾", aliases: [] },

  // ── Condimentos y Especias ──
  { id: "sal",            name: "Sal",            category: "condimentos", emoji: "🧂", aliases: [] },
  { id: "pimienta",       name: "Pimienta",       category: "condimentos", emoji: "🌶️", aliases: ["pimienta negra"] },
  { id: "oregano",        name: "Orégano",        category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "pimenton",       name: "Pimentón",       category: "condimentos", emoji: "🌶️", aliases: ["pimentón dulce", "paprika"] },
  { id: "comino",         name: "Comino",         category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "curry",          name: "Curry",          category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "curcuma",        name: "Cúrcuma",        category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "canela",         name: "Canela",         category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "nuez_moscada",   name: "Nuez moscada",   category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "laurel",         name: "Laurel",         category: "condimentos", emoji: "🍃", aliases: ["hoja de laurel"] },
  { id: "tomillo",        name: "Tomillo",        category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "romero",         name: "Romero",         category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "aji_molido",     name: "Ají molido",     category: "condimentos", emoji: "🌶️", aliases: [] },
  { id: "provenzal",      name: "Provenzal",      category: "condimentos", emoji: "🌿", aliases: [] },
  { id: "mostaza",        name: "Mostaza",        category: "condimentos", emoji: "🟡", aliases: [] },
  { id: "mayonesa",       name: "Mayonesa",       category: "condimentos", emoji: "🟡", aliases: ["mayo"] },
  { id: "ketchup",        name: "Ketchup",        category: "condimentos", emoji: "🔴", aliases: [] },
  { id: "salsa_soja",     name: "Salsa de soja",  category: "condimentos", emoji: "🟤", aliases: ["soja", "soy sauce"] },
  { id: "vinagre",        name: "Vinagre",        category: "condimentos", emoji: "🫙", aliases: [] },
  { id: "aceite_oliva",   name: "Aceite de oliva",category: "condimentos", emoji: "🫒", aliases: ["aceite"] },
  { id: "azucar",         name: "Azúcar",         category: "condimentos", emoji: "🍬", aliases: [] },
  { id: "miel",           name: "Miel",           category: "condimentos", emoji: "🍯", aliases: [] },

  // ── Enlatados y Conservas ──
  { id: "tomate_triturado",name: "Tomate triturado",category: "enlatados", emoji: "🥫", aliases: ["tomate en lata"] },
  { id: "tomate_perita",   name: "Tomate perita",   category: "enlatados", emoji: "🥫", aliases: [] },
  { id: "salsa_tomate",    name: "Salsa de tomate",  category: "enlatados", emoji: "🥫", aliases: ["puré de tomate"] },
  { id: "atun_lata",       name: "Atún en lata",     category: "enlatados", emoji: "🥫", aliases: ["atún en conserva"] },
  { id: "caballa_lata",    name: "Caballa",          category: "enlatados", emoji: "🥫", aliases: ["caballa en lata"] },
  { id: "sardinas",        name: "Sardinas",         category: "enlatados", emoji: "🥫", aliases: ["sardinas en lata"] },
  { id: "choclo_lata",     name: "Choclo en lata",   category: "enlatados", emoji: "🥫", aliases: [] },
  { id: "arvejas_lata",    name: "Arvejas en lata",  category: "enlatados", emoji: "🥫", aliases: [] },
  { id: "palmitos",        name: "Palmitos",         category: "enlatados", emoji: "🥫", aliases: [] },
  { id: "aceitunas",       name: "Aceitunas",        category: "enlatados", emoji: "🫒", aliases: [] },
  { id: "alcaparras",      name: "Alcaparras",       category: "enlatados", emoji: "🫒", aliases: [] },
  { id: "pickles",         name: "Pickles",          category: "enlatados", emoji: "🥒", aliases: ["pepinillos"] },
  { id: "duraznos_almibar",name: "Duraznos en almíbar",category: "enlatados",emoji: "🍑", aliases: [] },

  // ── Otros ──
  { id: "vino_blanco",     name: "Vino blanco",     category: "otros", emoji: "🍷", aliases: [] },
  { id: "vino_tinto",      name: "Vino tinto",      category: "otros", emoji: "🍷", aliases: [] },
  { id: "cerveza",         name: "Cerveza",         category: "otros", emoji: "🍺", aliases: [] },
  { id: "caldo_verduras",  name: "Caldo de verduras",category: "otros", emoji: "🥣", aliases: ["caldo vegetal"] },
  { id: "caldo_pollo",     name: "Caldo de pollo",   category: "otros", emoji: "🥣", aliases: ["caldo"] },
  { id: "levadura",        name: "Levadura",        category: "otros", emoji: "🍞", aliases: [] },
  { id: "gelatina",        name: "Gelatina",        category: "otros", emoji: "🍮", aliases: [] },
  { id: "chocolate",       name: "Chocolate",       category: "otros", emoji: "🍫", aliases: [] },
  { id: "cacao",           name: "Cacao",           category: "otros", emoji: "🍫", aliases: ["cacao en polvo"] },
  { id: "cafe",            name: "Café",            category: "otros", emoji: "☕", aliases: [] },
  { id: "te",              name: "Té",              category: "otros", emoji: "🍵", aliases: [] },
  { id: "mani",            name: "Maní",            category: "otros", emoji: "🥜", aliases: ["cacahuate"] },
  { id: "nueces",          name: "Nueces",          category: "otros", emoji: "🌰", aliases: [] },
  { id: "almendras",       name: "Almendras",       category: "otros", emoji: "🌰", aliases: [] },
  { id: "pasas",           name: "Pasas de uva",    category: "otros", emoji: "🍇", aliases: ["pasas"] },
  { id: "coco_rallado",    name: "Coco rallado",    category: "otros", emoji: "🥥", aliases: [] },
  { id: "tortilla",        name: "Tortilla",        category: "otros", emoji: "🫓", aliases: ["tortillas", "tortilla de trigo", "tortilla de maíz", "wrap"] },
];

// ── Utility functions ──

/** Build a lookup map: name/alias → ingredient ID */
const _lookupMap = new Map<string, string>();
NORMALIZED_INGREDIENTS.forEach(ing => {
  _lookupMap.set(ing.name.toLowerCase(), ing.id);
  _lookupMap.set(ing.id, ing.id);
  ing.aliases.forEach(alias => _lookupMap.set(alias.toLowerCase(), ing.id));
});

/** Resolve any text to a normalized ingredient ID, or null */
export function resolveIngredientId(text: string): string | null {
  return _lookupMap.get(text.toLowerCase().trim()) ?? null;
}

/** Get ingredient by ID */
export function getIngredientById(id: string): NormalizedIngredient | undefined {
  return NORMALIZED_INGREDIENTS.find(i => i.id === id);
}

/** Search ingredients by query (name, aliases) */
export function searchIngredients(query: string, maxResults = 10): NormalizedIngredient[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  const exact: NormalizedIngredient[] = [];
  const startsWith: NormalizedIngredient[] = [];
  const contains: NormalizedIngredient[] = [];

  for (const ing of NORMALIZED_INGREDIENTS) {
    const nameLower = ing.name.toLowerCase();
    if (nameLower === q) {
      exact.push(ing);
    } else if (nameLower.startsWith(q)) {
      startsWith.push(ing);
    } else if (nameLower.includes(q) || ing.aliases.some(a => a.toLowerCase().includes(q))) {
      contains.push(ing);
    }
  }

  return [...exact, ...startsWith, ...contains].slice(0, maxResults);
}

/** Get all ingredients grouped by category */
export function getIngredientsByCategory(): Record<string, NormalizedIngredient[]> {
  const grouped: Record<string, NormalizedIngredient[]> = {};
  for (const ing of NORMALIZED_INGREDIENTS) {
    if (!grouped[ing.category]) grouped[ing.category] = [];
    grouped[ing.category].push(ing);
  }
  return grouped;
}

export const MAX_INGREDIENTS = 5;
export const MIN_INGREDIENTS = 1;
