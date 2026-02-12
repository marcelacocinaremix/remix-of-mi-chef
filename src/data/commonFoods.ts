export interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
  category: string;
}

export const COMMON_FOODS: CommonFood[] = [
  // Desayuno
  { name: "Tostada con manteca", calories: 120, protein: 2, carbs: 15, fats: 6, portion: "1 unidad", category: "Desayuno" },
  { name: "Medialunas", calories: 180, protein: 4, carbs: 22, fats: 8, portion: "2 unidades", category: "Desayuno" },
  { name: "Medialuna", calories: 90, protein: 2, carbs: 11, fats: 4, portion: "1 unidad", category: "Desayuno" },
  { name: "Yogur natural", calories: 100, protein: 8, carbs: 12, fats: 3, portion: "1 vaso", category: "Lácteos" },
  { name: "Yogur con granola", calories: 220, protein: 10, carbs: 30, fats: 7, portion: "1 vaso", category: "Desayuno" },
  { name: "Café con leche", calories: 80, protein: 4, carbs: 8, fats: 3, portion: "1 taza", category: "Bebidas" },
  { name: "Café solo", calories: 5, protein: 0, carbs: 1, fats: 0, portion: "1 taza", category: "Bebidas" },
  { name: "Mate con galletitas", calories: 150, protein: 2, carbs: 20, fats: 6, portion: "porción", category: "Desayuno" },
  { name: "Huevos revueltos", calories: 200, protein: 14, carbs: 2, fats: 15, portion: "2 huevos", category: "Proteínas" },
  { name: "Huevo frito", calories: 120, protein: 7, carbs: 1, fats: 10, portion: "1 huevo", category: "Proteínas" },
  { name: "Huevo duro", calories: 80, protein: 7, carbs: 1, fats: 5, portion: "1 huevo", category: "Proteínas" },
  { name: "Avena con leche", calories: 200, protein: 8, carbs: 32, fats: 5, portion: "1 bowl", category: "Desayuno" },
  { name: "Tostada con palta", calories: 180, protein: 4, carbs: 15, fats: 12, portion: "1 unidad", category: "Desayuno" },
  { name: "Tostada con mermelada", calories: 130, protein: 2, carbs: 25, fats: 2, portion: "1 unidad", category: "Desayuno" },
  { name: "Tostada con queso crema", calories: 140, protein: 4, carbs: 15, fats: 7, portion: "1 unidad", category: "Desayuno" },
  { name: "Pan con manteca", calories: 150, protein: 3, carbs: 18, fats: 7, portion: "1 rebanada", category: "Desayuno" },
  { name: "Cereales con leche", calories: 250, protein: 6, carbs: 42, fats: 5, portion: "1 bowl", category: "Desayuno" },
  
  // Almuerzo / Cena - Argentinos y Latinos
  { name: "Milanesa de pollo", calories: 350, protein: 30, carbs: 20, fats: 18, portion: "1 unidad", category: "Proteínas" },
  { name: "Milanesa de carne", calories: 400, protein: 28, carbs: 22, fats: 22, portion: "1 unidad", category: "Proteínas" },
  { name: "Milanesa napolitana", calories: 500, protein: 32, carbs: 25, fats: 28, portion: "1 unidad", category: "Proteínas" },
  { name: "Arroz blanco", calories: 200, protein: 4, carbs: 44, fats: 1, portion: "1 taza", category: "Carbohidratos" },
  { name: "Arroz integral", calories: 220, protein: 5, carbs: 46, fats: 2, portion: "1 taza", category: "Carbohidratos" },
  { name: "Fideos con salsa", calories: 350, protein: 12, carbs: 55, fats: 8, portion: "1 plato", category: "Carbohidratos" },
  { name: "Fideos con pesto", calories: 400, protein: 14, carbs: 50, fats: 16, portion: "1 plato", category: "Carbohidratos" },
  { name: "Ñoquis con salsa", calories: 380, protein: 10, carbs: 58, fats: 12, portion: "1 plato", category: "Carbohidratos" },
  { name: "Ravioles con salsa", calories: 400, protein: 16, carbs: 48, fats: 14, portion: "1 plato", category: "Carbohidratos" },
  { name: "Ensalada mixta", calories: 80, protein: 3, carbs: 10, fats: 3, portion: "1 plato", category: "Verduras" },
  { name: "Ensalada César", calories: 250, protein: 15, carbs: 12, fats: 16, portion: "1 plato", category: "Verduras" },
  { name: "Pollo a la plancha", calories: 250, protein: 35, carbs: 0, fats: 10, portion: "1 pechuga", category: "Proteínas" },
  { name: "Pollo al horno", calories: 280, protein: 32, carbs: 0, fats: 14, portion: "1 porción", category: "Proteínas" },
  { name: "Carne a la plancha", calories: 300, protein: 30, carbs: 0, fats: 18, portion: "1 porción", category: "Proteínas" },
  { name: "Bife de chorizo", calories: 350, protein: 32, carbs: 0, fats: 22, portion: "1 porción", category: "Proteínas" },
  { name: "Asado", calories: 400, protein: 35, carbs: 0, fats: 25, portion: "1 porción", category: "Proteínas" },
  { name: "Choripán", calories: 450, protein: 18, carbs: 30, fats: 28, portion: "1 unidad", category: "Comida rápida" },
  { name: "Hamburguesa completa", calories: 500, protein: 25, carbs: 35, fats: 28, portion: "1 unidad", category: "Comida rápida" },
  { name: "Pizza (2 porciones)", calories: 450, protein: 18, carbs: 50, fats: 20, portion: "2 porciones", category: "Comida rápida" },
  { name: "Pizza (1 porción)", calories: 225, protein: 9, carbs: 25, fats: 10, portion: "1 porción", category: "Comida rápida" },
  { name: "Empanadas", calories: 350, protein: 12, carbs: 28, fats: 20, portion: "2 unidades", category: "Comida rápida" },
  { name: "Empanada", calories: 175, protein: 6, carbs: 14, fats: 10, portion: "1 unidad", category: "Comida rápida" },
  { name: "Tarta de verduras", calories: 280, protein: 10, carbs: 25, fats: 16, portion: "1 porción", category: "Tartas" },
  { name: "Tarta de jamón y queso", calories: 320, protein: 14, carbs: 22, fats: 20, portion: "1 porción", category: "Tartas" },
  { name: "Sopa de verduras", calories: 120, protein: 4, carbs: 18, fats: 3, portion: "1 bowl", category: "Sopas" },
  { name: "Sopa crema", calories: 180, protein: 5, carbs: 20, fats: 8, portion: "1 bowl", category: "Sopas" },
  { name: "Guiso de lentejas", calories: 350, protein: 20, carbs: 45, fats: 8, portion: "1 plato", category: "Legumbres" },
  { name: "Guiso de arroz", calories: 320, protein: 15, carbs: 42, fats: 10, portion: "1 plato", category: "Legumbres" },
  { name: "Locro", calories: 400, protein: 18, carbs: 48, fats: 14, portion: "1 plato", category: "Legumbres" },
  { name: "Puré de papa", calories: 180, protein: 3, carbs: 30, fats: 6, portion: "1 porción", category: "Guarniciones" },
  { name: "Puré de calabaza", calories: 120, protein: 2, carbs: 22, fats: 3, portion: "1 porción", category: "Guarniciones" },
  { name: "Verduras salteadas", calories: 100, protein: 3, carbs: 12, fats: 5, portion: "1 porción", category: "Verduras" },
  { name: "Verduras al horno", calories: 130, protein: 3, carbs: 18, fats: 5, portion: "1 porción", category: "Verduras" },
  { name: "Tortilla de papa", calories: 300, protein: 12, carbs: 28, fats: 16, portion: "1 porción", category: "Proteínas" },
  { name: "Omelette", calories: 220, protein: 14, carbs: 2, fats: 16, portion: "1 unidad", category: "Proteínas" },
  { name: "Pancho", calories: 350, protein: 12, carbs: 30, fats: 20, portion: "1 unidad", category: "Comida rápida" },
  { name: "Sándwich de milanesa", calories: 550, protein: 28, carbs: 40, fats: 28, portion: "1 unidad", category: "Comida rápida" },
  { name: "Sándwich de jamón y queso", calories: 300, protein: 16, carbs: 28, fats: 14, portion: "1 unidad", category: "Comida rápida" },
  { name: "Tostado", calories: 280, protein: 14, carbs: 26, fats: 12, portion: "1 unidad", category: "Comida rápida" },
  { name: "Matambre a la pizza", calories: 380, protein: 28, carbs: 10, fats: 26, portion: "1 porción", category: "Proteínas" },
  { name: "Bondiola", calories: 320, protein: 26, carbs: 0, fats: 22, portion: "1 porción", category: "Proteínas" },
  { name: "Pescado a la plancha", calories: 200, protein: 30, carbs: 0, fats: 8, portion: "1 filet", category: "Proteínas" },
  { name: "Atún en lata", calories: 120, protein: 26, carbs: 0, fats: 1, portion: "1 lata", category: "Proteínas" },
  
  // Frutas
  { name: "Banana", calories: 100, protein: 1, carbs: 26, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Manzana", calories: 80, protein: 0, carbs: 20, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Naranja", calories: 60, protein: 1, carbs: 15, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Mandarina", calories: 50, protein: 1, carbs: 12, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Pera", calories: 85, protein: 0, carbs: 22, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Durazno", calories: 60, protein: 1, carbs: 14, fats: 0, portion: "1 unidad", category: "Frutas" },
  { name: "Uvas", calories: 70, protein: 1, carbs: 18, fats: 0, portion: "1 racimo chico", category: "Frutas" },
  { name: "Frutillas", calories: 45, protein: 1, carbs: 10, fats: 0, portion: "1 taza", category: "Frutas" },
  { name: "Sandía", calories: 50, protein: 1, carbs: 12, fats: 0, portion: "1 tajada", category: "Frutas" },
  { name: "Melón", calories: 55, protein: 1, carbs: 13, fats: 0, portion: "1 tajada", category: "Frutas" },
  
  // Lácteos
  { name: "Leche", calories: 120, protein: 6, carbs: 10, fats: 6, portion: "1 vaso", category: "Lácteos" },
  { name: "Queso crema", calories: 80, protein: 2, carbs: 1, fats: 8, portion: "1 cucharada", category: "Lácteos" },
  { name: "Queso rallado", calories: 110, protein: 8, carbs: 1, fats: 8, portion: "2 cucharadas", category: "Lácteos" },
  { name: "Dulce de leche", calories: 160, protein: 3, carbs: 28, fats: 4, portion: "2 cucharadas", category: "Lácteos" },
  
  // Snacks
  { name: "Barra de cereal", calories: 120, protein: 2, carbs: 22, fats: 3, portion: "1 unidad", category: "Snacks" },
  { name: "Frutos secos mix", calories: 200, protein: 6, carbs: 8, fats: 18, portion: "puñado", category: "Snacks" },
  { name: "Galletitas de arroz", calories: 70, protein: 1, carbs: 16, fats: 0, portion: "2 unidades", category: "Snacks" },
  { name: "Alfajor", calories: 250, protein: 4, carbs: 35, fats: 10, portion: "1 unidad", category: "Snacks" },
  { name: "Galletitas dulces", calories: 150, protein: 2, carbs: 22, fats: 6, portion: "4 unidades", category: "Snacks" },
  { name: "Galletitas saladas", calories: 130, protein: 3, carbs: 18, fats: 5, portion: "4 unidades", category: "Snacks" },
  { name: "Facturas", calories: 200, protein: 4, carbs: 26, fats: 9, portion: "1 unidad", category: "Snacks" },
  
  // Bebidas
  { name: "Jugo de naranja", calories: 90, protein: 1, carbs: 22, fats: 0, portion: "1 vaso", category: "Bebidas" },
  { name: "Licuado de frutas", calories: 150, protein: 4, carbs: 30, fats: 2, portion: "1 vaso", category: "Bebidas" },
  { name: "Mate", calories: 5, protein: 0, carbs: 1, fats: 0, portion: "varios", category: "Bebidas" },
  { name: "Gaseosa", calories: 140, protein: 0, carbs: 35, fats: 0, portion: "1 vaso", category: "Bebidas" },
  { name: "Agua", calories: 0, protein: 0, carbs: 0, fats: 0, portion: "1 vaso", category: "Bebidas" },
  { name: "Cerveza", calories: 150, protein: 1, carbs: 13, fats: 0, portion: "1 lata", category: "Bebidas" },
  { name: "Vino", calories: 125, protein: 0, carbs: 4, fats: 0, portion: "1 copa", category: "Bebidas" },
];

/** Find best matching food by name (case-insensitive, partial match) */
export function findCommonFood(name: string): CommonFood | null {
  if (!name.trim()) return null;
  const q = name.trim().toLowerCase();
  // Exact match first
  const exact = COMMON_FOODS.find((f) => f.name.toLowerCase() === q);
  if (exact) return exact;
  // Partial match
  const partial = COMMON_FOODS.find((f) => f.name.toLowerCase().includes(q) || q.includes(f.name.toLowerCase()));
  return partial || null;
}
