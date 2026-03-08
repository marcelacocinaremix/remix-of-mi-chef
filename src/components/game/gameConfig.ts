export interface PlayerLevel {
  nameKey: string;
  icon: string;
  minXP: number;
  color: string;
}

export const PLAYER_LEVELS: PlayerLevel[] = [
  { nameKey: "levelApprentice", icon: "🥄", minXP: 0, color: "text-gray-500" },
  { nameKey: "levelCook", icon: "🍳", minXP: 100, color: "text-blue-500" },
  { nameKey: "levelChef", icon: "👨‍🍳", minXP: 300, color: "text-green-500" },
  { nameKey: "levelExpertChef", icon: "⭐", minXP: 700, color: "text-amber-500" },
  { nameKey: "levelMasterChef", icon: "👑", minXP: 1500, color: "text-purple-500" },
];

export type GameMode = "recipe" | "timer" | "order" | "ingredients";

export interface DailyChallenge {
  id: string;
  type: "complete_recipes" | "time_attack" | "no_errors";
  targetValue: number;
  xpReward: number;
  descKey: string;
}

export function getDailyChallenge(): DailyChallenge {
  const day = new Date().getDay();
  const challenges: DailyChallenge[] = [
    { id: "c0", type: "complete_recipes", targetValue: 3, xpReward: 150, descKey: "challengeComplete3" },
    { id: "c1", type: "time_attack", targetValue: 60, xpReward: 200, descKey: "challengeTimeAttack" },
    { id: "c2", type: "no_errors", targetValue: 1, xpReward: 100, descKey: "challengeNoErrors" },
    { id: "c3", type: "complete_recipes", targetValue: 5, xpReward: 250, descKey: "challengeComplete5" },
    { id: "c4", type: "time_attack", targetValue: 45, xpReward: 300, descKey: "challengeTimeAttackFast" },
    { id: "c5", type: "no_errors", targetValue: 2, xpReward: 200, descKey: "challengeNoErrors2" },
    { id: "c6", type: "complete_recipes", targetValue: 2, xpReward: 100, descKey: "challengeComplete2" },
  ];
  return challenges[day];
}

export const INGREDIENTS_POOL = [
  { id: "carne", name: "Carne Vacuna", emoji: "🥩" },
  { id: "chorizo", name: "Chorizo", emoji: "🌭" },
  { id: "matambre", name: "Matambre", emoji: "🥓" },
  { id: "bondiola", name: "Bondiola", emoji: "🍖" },
  { id: "jamon", name: "Jamón", emoji: "🥓" },
  { id: "pollo", name: "Pollo", emoji: "🍗" },
  { id: "pescado", name: "Pescado", emoji: "🐟" },
  { id: "huevo", name: "Huevo", emoji: "🥚" },
  { id: "queso", name: "Queso", emoji: "🧀" },
  { id: "leche", name: "Leche", emoji: "🥛" },
  { id: "manteca", name: "Manteca", emoji: "🧈" },
  { id: "harina", name: "Harina", emoji: "🌾" },
  { id: "pan_rallado", name: "Pan Rallado", emoji: "🍞" },
  { id: "pan", name: "Pan", emoji: "🥖" },
  { id: "maicena", name: "Maicena", emoji: "🥣" },
  { id: "cebolla", name: "Cebolla", emoji: "🧅" },
  { id: "tomate", name: "Tomate", emoji: "🍅" },
  { id: "ajo", name: "Ajo", emoji: "🧄" },
  { id: "papa", name: "Papa", emoji: "🥔" },
  { id: "zanahoria", name: "Zanahoria", emoji: "🥕" },
  { id: "arroz", name: "Arroz", emoji: "🍚" },
  { id: "pasta", name: "Pasta", emoji: "🍝" },
  { id: "maiz", name: "Maíz", emoji: "🌽" },
  { id: "porotos", name: "Porotos", emoji: "🫘" },
  { id: "sal", name: "Sal", emoji: "🧂" },
  { id: "comino", name: "Comino", emoji: "🫙" },
  { id: "oregano", name: "Orégano", emoji: "🌿" },
  { id: "aceite", name: "Aceite", emoji: "🫒" },
  { id: "dulce_leche", name: "Dulce de Leche", emoji: "🍯" },
  { id: "azucar", name: "Azúcar", emoji: "🍬" },
  { id: "miel", name: "Miel", emoji: "🍯" },
  { id: "limón", name: "Limón", emoji: "🍋" },
  { id: "pimiento", name: "Pimiento", emoji: "🫑" },
];

export const GAME_RECIPES = [
  { id: "empanadas", name: "Empanadas de Carne", emoji: "🥟", ingredients: ["harina", "carne", "cebolla", "comino"], steps: ["Hacer la masa con harina y agua", "Saltear la carne con cebolla", "Condimentar con comino", "Rellenar y cerrar las tapas", "Hornear o freír"], baseScore: 100 },
  { id: "milanesa", name: "Milanesa Clásica", emoji: "🥩", ingredients: ["carne", "huevo", "pan_rallado"], steps: ["Golpear la carne para afinarla", "Pasar por huevo batido", "Empanar con pan rallado", "Freír en aceite caliente", "Escurrir sobre papel"], baseScore: 80 },
  { id: "milanesa_napo", name: "Milanesa Napolitana", emoji: "🍖", ingredients: ["carne", "tomate", "jamon", "queso"], steps: ["Preparar la milanesa base", "Agregar salsa de tomate", "Colocar jamón encima", "Cubrir con queso", "Gratinar al horno"], baseScore: 120 },
  { id: "choripan", name: "Choripán", emoji: "🌭", ingredients: ["chorizo", "pan", "tomate", "oregano"], steps: ["Cocinar el chorizo a la parrilla", "Cortar el pan francés", "Abrir el chorizo al medio", "Agregar condimentos", "Armar el sándwich"], baseScore: 70 },
  { id: "tortilla", name: "Tortilla de Papas", emoji: "🍳", ingredients: ["papa", "huevo", "cebolla", "aceite"], steps: ["Cortar las papas en rodajas", "Pochar en aceite con cebolla", "Batir los huevos", "Mezclar todo y cocinar", "Dar vuelta con un plato"], baseScore: 90 },
  { id: "fideos", name: "Fideos con Salsa", emoji: "🍝", ingredients: ["pasta", "tomate", "ajo", "aceite"], steps: ["Hervir agua con sal", "Cocinar la pasta al dente", "Sofreír ajo en aceite", "Agregar tomate picado", "Mezclar con la pasta"], baseScore: 75 },
  { id: "arroz", name: "Arroz con Pollo", emoji: "🍗", ingredients: ["arroz", "pollo", "cebolla", "ajo"], steps: ["Dorar el pollo troceado", "Saltear cebolla y ajo", "Agregar arroz y mesclar", "Cubrir con caldo caliente", "Cocinar a fuego lento"], baseScore: 110 },
  { id: "alfajores", name: "Alfajores de Maicena", emoji: "🍪", ingredients: ["maicena", "harina", "dulce_leche", "azucar"], steps: ["Mezclar maicena con harina", "Agregar manteca y azúcar", "Formar las tapas", "Hornear hasta dorar", "Rellenar con dulce de leche"], baseScore: 100 },
  { id: "asado", name: "Asado Argentino", emoji: "🔥", ingredients: ["carne", "sal", "limón", "pan"], steps: ["Encender las brasas", "Salar bien la carne", "Cocinar del lado del hueso primero", "Dar vuelta una sola vez", "Servir con pan"], baseScore: 130 },
  { id: "revuelto", name: "Revuelto Gramajo", emoji: "🍳", ingredients: ["papa", "jamon", "huevo", "aceite"], steps: ["Freír las papas en juliana", "Agregar el jamón", "Batir y verter los huevos", "Revolver suavemente", "Servir caliente"], baseScore: 85 },
];
