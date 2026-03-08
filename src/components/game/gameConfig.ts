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
  // Carnes y proteínas
  { id: "carne", name: "Carne Vacuna", emoji: "🥩" },
  { id: "pollo", name: "Pollo", emoji: "🍗" },
  { id: "cerdo", name: "Cerdo", emoji: "🥓" },
  { id: "chorizo", name: "Chorizo", emoji: "🌭" },
  { id: "jamon", name: "Jamón", emoji: "🥓" },
  { id: "panceta", name: "Panceta", emoji: "🥩" },
  { id: "salmon", name: "Salmón", emoji: "🐟" },
  { id: "camarones", name: "Camarones", emoji: "🦐" },
  { id: "atun", name: "Atún", emoji: "🐠" },
  { id: "huevo", name: "Huevo", emoji: "🥚" },
  // Lácteos
  { id: "queso", name: "Queso", emoji: "🧀" },
  { id: "leche", name: "Leche", emoji: "🥛" },
  { id: "manteca", name: "Manteca", emoji: "🧈" },
  { id: "crema", name: "Crema", emoji: "🫙" },
  { id: "queso_crema", name: "Queso Crema", emoji: "🧀" },
  { id: "yogurt", name: "Yogurt", emoji: "🥛" },
  { id: "mozzarella", name: "Mozzarella", emoji: "🧀" },
  { id: "parmesano", name: "Parmesano", emoji: "🧀" },
  // Harinas y carbohidratos
  { id: "harina", name: "Harina", emoji: "🌾" },
  { id: "pan_rallado", name: "Pan Rallado", emoji: "🍞" },
  { id: "pan", name: "Pan", emoji: "🥖" },
  { id: "maicena", name: "Maicena", emoji: "🥣" },
  { id: "arroz", name: "Arroz", emoji: "🍚" },
  { id: "pasta", name: "Pasta", emoji: "🍝" },
  { id: "fideos_arroz", name: "Fideos de Arroz", emoji: "🍜" },
  { id: "papa", name: "Papa", emoji: "🥔" },
  { id: "batata", name: "Batata", emoji: "🍠" },
  { id: "tortilla_maiz", name: "Tortilla de Maíz", emoji: "🫓" },
  // Verduras
  { id: "cebolla", name: "Cebolla", emoji: "🧅" },
  { id: "tomate", name: "Tomate", emoji: "🍅" },
  { id: "ajo", name: "Ajo", emoji: "🧄" },
  { id: "zanahoria", name: "Zanahoria", emoji: "🥕" },
  { id: "pimiento", name: "Pimiento", emoji: "🫑" },
  { id: "pimiento_rojo", name: "Pimiento Rojo", emoji: "🌶️" },
  { id: "espinaca", name: "Espinaca", emoji: "🥬" },
  { id: "brocoli", name: "Brócoli", emoji: "🥦" },
  { id: "cebolla_verde", name: "Cebollita Verde", emoji: "🧅" },
  { id: "pepino", name: "Pepino", emoji: "🥒" },
  { id: "lechuga", name: "Lechuga", emoji: "🥗" },
  { id: "maiz", name: "Maíz", emoji: "🌽" },
  { id: "choclo", name: "Choclo", emoji: "🌽" },
  { id: "champiñones", name: "Champiñones", emoji: "🍄" },
  { id: "berenjena", name: "Berenjena", emoji: "🍆" },
  { id: "zapallito", name: "Zapallito", emoji: "🥒" },
  { id: "puerro", name: "Puerro", emoji: "🧅" },
  { id: "jengibre", name: "Jengibre", emoji: "🫚" },
  // Legumbres y proteínas vegetales
  { id: "porotos", name: "Porotos", emoji: "🫘" },
  { id: "lentejas", name: "Lentejas", emoji: "🫘" },
  { id: "garbanzos", name: "Garbanzos", emoji: "🫘" },
  { id: "tofu", name: "Tofu", emoji: "🧊" },
  // Condimentos y salsas
  { id: "sal", name: "Sal", emoji: "🧂" },
  { id: "comino", name: "Comino", emoji: "🫙" },
  { id: "oregano", name: "Orégano", emoji: "🌿" },
  { id: "aceite", name: "Aceite", emoji: "🫒" },
  { id: "aceite_oliva", name: "Aceite de Oliva", emoji: "🫒" },
  { id: "salsa_soja", name: "Salsa de Soja", emoji: "🫙" },
  { id: "vinagre", name: "Vinagre", emoji: "🍶" },
  { id: "salsa_tomate", name: "Salsa de Tomate", emoji: "🍅" },
  { id: "curry", name: "Curry", emoji: "🫙" },
  { id: "paprika", name: "Paprika", emoji: "🌶️" },
  { id: "canela", name: "Canela", emoji: "🍂" },
  { id: "nuez_moscada", name: "Nuez Moscada", emoji: "🥜" },
  { id: "chile", name: "Chile", emoji: "🌶️" },
  { id: "cilantro", name: "Cilantro", emoji: "🌿" },
  { id: "tomillo", name: "Tomillo", emoji: "🌿" },
  { id: "albahaca", name: "Albahaca", emoji: "🌿" },
  { id: "mostaza", name: "Mostaza", emoji: "🟡" },
  { id: "mayonesa", name: "Mayonesa", emoji: "🫙" },
  // Dulces y repostería
  { id: "dulce_leche", name: "Dulce de Leche", emoji: "🍯" },
  { id: "azucar", name: "Azúcar", emoji: "🍬" },
  { id: "miel", name: "Miel", emoji: "🍯" },
  { id: "chocolate", name: "Chocolate", emoji: "🍫" },
  { id: "vainilla", name: "Vainilla", emoji: "🫙" },
  { id: "levadura", name: "Levadura", emoji: "🫧" },
  // Frutas
  { id: "limon", name: "Limón", emoji: "🍋" },
  { id: "naranja", name: "Naranja", emoji: "🍊" },
  { id: "manzana", name: "Manzana", emoji: "🍎" },
  { id: "platano", name: "Plátano", emoji: "🍌" },
  { id: "aguacate", name: "Aguacate", emoji: "🥑" },
  { id: "coco", name: "Coco", emoji: "🥥" },
  // Frutos secos
  { id: "nueces", name: "Nueces", emoji: "🥜" },
  { id: "almendras", name: "Almendras", emoji: "🥜" },
  { id: "sesamo", name: "Sésamo", emoji: "🌰" },
  // Otros
  { id: "caldo", name: "Caldo", emoji: "🍲" },
  { id: "vino", name: "Vino", emoji: "🍷" },
  { id: "cerveza", name: "Cerveza", emoji: "🍺" },
];

export const GAME_RECIPES = [
  // 🇦🇷 Argentina
  { id: "empanadas", name: "Empanadas de Carne", emoji: "🥟", country: "🇦🇷", ingredients: ["harina", "carne", "cebolla", "comino"], steps: ["Hacer la masa con harina y agua", "Saltear la carne con cebolla", "Condimentar con comino", "Rellenar y cerrar las tapas", "Hornear o freír"], baseScore: 100 },
  { id: "milanesa", name: "Milanesa Clásica", emoji: "🥩", country: "🇦🇷", ingredients: ["carne", "huevo", "pan_rallado", "aceite"], steps: ["Golpear la carne para afinarla", "Pasar por huevo batido", "Empanar con pan rallado", "Freír en aceite caliente", "Escurrir sobre papel"], baseScore: 80 },
  { id: "alfajores", name: "Alfajores de Maicena", emoji: "🍪", country: "🇦🇷", ingredients: ["maicena", "harina", "dulce_leche", "azucar"], steps: ["Mezclar maicena con harina", "Agregar manteca y azúcar", "Formar las tapas redondas", "Hornear hasta dorar", "Rellenar con dulce de leche"], baseScore: 100 },
  { id: "asado", name: "Asado Argentino", emoji: "🔥", country: "🇦🇷", ingredients: ["carne", "sal", "limon", "pan"], steps: ["Encender las brasas", "Salar bien la carne", "Cocinar del lado del hueso primero", "Dar vuelta una sola vez", "Servir con pan"], baseScore: 130 },
  { id: "choripan", name: "Choripán", emoji: "🌭", country: "🇦🇷", ingredients: ["chorizo", "pan", "tomate", "oregano"], steps: ["Cocinar el chorizo a la parrilla", "Cortar el pan francés", "Abrir el chorizo al medio", "Agregar condimentos", "Armar el sándwich"], baseScore: 70 },

  // 🇮🇹 Italia
  { id: "pasta_carbonara", name: "Pasta Carbonara", emoji: "🍝", country: "🇮🇹", ingredients: ["pasta", "panceta", "huevo", "parmesano"], steps: ["Cocinar la pasta al dente", "Freír la panceta en cubos", "Batir huevos con queso", "Mezclar pasta con panceta", "Agregar la mezcla de huevo sin fuego"], baseScore: 110 },
  { id: "pizza_margarita", name: "Pizza Margherita", emoji: "🍕", country: "🇮🇹", ingredients: ["harina", "salsa_tomate", "mozzarella", "albahaca"], steps: ["Preparar la masa con levadura", "Dejar leudar 1 hora", "Extender la masa", "Agregar salsa y mozzarella", "Hornear a temperatura máxima"], baseScore: 120 },
  { id: "risotto", name: "Risotto de Champiñones", emoji: "🍚", country: "🇮🇹", ingredients: ["arroz", "champiñones", "cebolla", "parmesano"], steps: ["Saltear cebolla en manteca", "Agregar arroz y tostar", "Incorporar caldo de a poco", "Añadir champiñones salteados", "Terminar con parmesano"], baseScore: 115 },
  { id: "tiramisú", name: "Tiramisú", emoji: "🍰", country: "🇮🇹", ingredients: ["huevo", "azucar", "queso_crema", "chocolate"], steps: ["Batir yemas con azúcar", "Incorporar queso mascarpone", "Mojar los bizcochos en café", "Alternar capas de crema y bizcochos", "Cubrir con cacao en polvo"], baseScore: 125 },

  // 🇲🇽 México
  { id: "tacos", name: "Tacos de Pollo", emoji: "🌮", country: "🇲🇽", ingredients: ["tortilla_maiz", "pollo", "aguacate", "cilantro"], steps: ["Cocinar el pollo con especias", "Calentar las tortillas", "Preparar el guacamole", "Armar los tacos con pollo", "Agregar cilantro y limón"], baseScore: 100 },
  { id: "guacamole", name: "Guacamole", emoji: "🥑", country: "🇲🇽", ingredients: ["aguacate", "tomate", "cebolla", "cilantro"], steps: ["Aplastar el aguacate maduro", "Agregar tomate picado", "Incorporar cebolla finamente", "Mezclar con cilantro", "Sazonar con limón y sal"], baseScore: 70 },
  { id: "enchiladas", name: "Enchiladas", emoji: "🫔", country: "🇲🇽", ingredients: ["tortilla_maiz", "pollo", "salsa_tomate", "queso"], steps: ["Preparar el pollo desmenuzado", "Bañar las tortillas en salsa", "Rellenar con pollo", "Enrollar las tortillas", "Hornear con queso encima"], baseScore: 110 },

  // 🇯🇵 Japón
  { id: "sushi", name: "Sushi de Salmón", emoji: "🍣", country: "🇯🇵", ingredients: ["arroz", "salmon", "vinagre", "sesamo"], steps: ["Cocinar arroz con vinagre", "Dejar enfriar el arroz", "Cortar el salmón en láminas", "Extender el arroz sobre nori", "Enrollar y cortar en piezas"], baseScore: 130 },
  { id: "ramen", name: "Ramen Casero", emoji: "🍜", country: "🇯🇵", ingredients: ["fideos_arroz", "caldo", "huevo", "cebolla_verde"], steps: ["Preparar el caldo base", "Cocinar los fideos aparte", "Hervir los huevos 6 minutos", "Armar el bol con fideos y caldo", "Decorar con huevo y cebollita"], baseScore: 120 },
  { id: "gyoza", name: "Gyoza", emoji: "🥟", country: "🇯🇵", ingredients: ["harina", "cerdo", "cebolla", "jengibre"], steps: ["Preparar la masa de la tapa", "Mezclar cerdo con jengibre", "Rellenar y doblar las gyozas", "Freír en sartén con aceite", "Agregar agua y tapar para vapor"], baseScore: 110 },
  { id: "teriyaki", name: "Pollo Teriyaki", emoji: "🍗", country: "🇯🇵", ingredients: ["pollo", "salsa_soja", "miel", "jengibre"], steps: ["Marinar el pollo en soja y miel", "Dejar reposar 30 minutos", "Cocinar en sartén caliente", "Bañar con la salsa restante", "Servir con arroz"], baseScore: 105 },

  // 🇺🇸 Estados Unidos
  { id: "hamburguesa", name: "Hamburguesa Clásica", emoji: "🍔", country: "🇺🇸", ingredients: ["carne", "pan", "lechuga", "tomate"], steps: ["Formar la hamburguesa con carne", "Cocinar en sartén o parrilla", "Tostar el pan", "Colocar lechuga y tomate", "Armar con condimentos"], baseScore: 90 },
  { id: "mac_cheese", name: "Mac and Cheese", emoji: "🧀", country: "🇺🇸", ingredients: ["pasta", "queso", "leche", "manteca"], steps: ["Hervir los macarrones", "Hacer una salsa bechamel", "Agregar queso rallado", "Mezclar con los macarrones", "Gratinar en el horno"], baseScore: 85 },
  { id: "pancakes", name: "Pancakes", emoji: "🥞", country: "🇺🇸", ingredients: ["harina", "huevo", "leche", "azucar"], steps: ["Mezclar harina y azúcar", "Agregar huevos y leche", "Batir hasta obtener masa lisa", "Cocinar en sartén antiadherente", "Servir con miel o jarabe"], baseScore: 80 },

  // 🇫🇷 Francia
  { id: "crepes", name: "Crêpes", emoji: "🥞", country: "🇫🇷", ingredients: ["harina", "huevo", "leche", "manteca"], steps: ["Mezclar harina con huevos", "Agregar leche de a poco", "Incorporar manteca derretida", "Cocinar en sartén caliente fina", "Doblar o enrollar al gusto"], baseScore: 85 },
  { id: "ratatouille", name: "Ratatouille", emoji: "🍆", country: "🇫🇷", ingredients: ["berenjena", "zapallito", "tomate", "aceite_oliva"], steps: ["Cortar todas las verduras en rodajas", "Sofreír cebolla y ajo", "Agregar salsa de tomate", "Colocar las verduras en espiral", "Hornear 45 minutos"], baseScore: 100 },
  { id: "quiche", name: "Quiche Lorraine", emoji: "🥧", country: "🇫🇷", ingredients: ["harina", "huevo", "crema", "panceta"], steps: ["Preparar la masa quebrada", "Forrar el molde y hornear vacío", "Batir huevos con crema", "Agregar panceta dorada", "Hornear hasta cuajar"], baseScore: 115 },

  // 🇨🇳 China
  { id: "arroz_frito", name: "Arroz Frito", emoji: "🍳", country: "🇨🇳", ingredients: ["arroz", "huevo", "cebolla_verde", "salsa_soja"], steps: ["Cocinar el arroz del día anterior", "Calentar el wok a fuego alto", "Saltear los huevos revueltos", "Agregar arroz y mezclar", "Condimentar con soja y verdeo"], baseScore: 90 },
  { id: "fideos_salteados", name: "Fideos Salteados", emoji: "🍜", country: "🇨🇳", ingredients: ["fideos_arroz", "pollo", "brócoli", "salsa_soja"], steps: ["Remojar los fideos en agua caliente", "Saltear el pollo en wok", "Agregar brócoli y verduras", "Incorporar los fideos escurridos", "Condimentar con salsa de soja"], baseScore: 100 },

  // 🇮🇳 India
  { id: "curry_pollo", name: "Curry de Pollo", emoji: "🍛", country: "🇮🇳", ingredients: ["pollo", "curry", "cebolla", "tomate"], steps: ["Dorar la cebolla en aceite", "Agregar pasta de curry", "Incorporar el tomate picado", "Añadir el pollo troceado", "Cocinar hasta espesar la salsa"], baseScore: 115 },
  { id: "dhal", name: "Dhal de Lentejas", emoji: "🫘", country: "🇮🇳", ingredients: ["lentejas", "cebolla", "tomate", "curry"], steps: ["Lavar y remojar las lentejas", "Sofreír cebolla con especias", "Agregar tomate y curry", "Incorporar lentejas con agua", "Cocinar hasta que ablanden"], baseScore: 90 },
  { id: "naan", name: "Pan Naan", emoji: "🫓", country: "🇮🇳", ingredients: ["harina", "yogurt", "levadura", "manteca"], steps: ["Mezclar harina con yogurt", "Agregar levadura y dejar leudar", "Estirar porciones de masa", "Cocinar en sartén muy caliente", "Pincelar con manteca al servir"], baseScore: 80 },

  // 🇪🇸 España
  { id: "tortilla_esp", name: "Tortilla Española", emoji: "🍳", country: "🇪🇸", ingredients: ["papa", "huevo", "cebolla", "aceite_oliva"], steps: ["Pelar y rebanar las papas", "Pochar en abundante aceite", "Batir los huevos", "Mezclar papas y huevo", "Cuajar dando vuelta con plato"], baseScore: 90 },
  { id: "paella", name: "Paella de Mariscos", emoji: "🥘", country: "🇪🇸", ingredients: ["arroz", "camarones", "pimiento_rojo", "aceite_oliva"], steps: ["Sofreír pimiento y ajo en paellera", "Agregar arroz y mezclar", "Incorporar caldo caliente", "Colocar los mariscos encima", "Dejar cocinar sin revolver"], baseScore: 140 },
  { id: "gazpacho", name: "Gazpacho", emoji: "🥗", country: "🇪🇸", ingredients: ["tomate", "pepino", "pimiento", "aceite_oliva"], steps: ["Trocear todos los vegetales", "Licuar con aceite y vinagre", "Colar para textura fina", "Ajustar sal y vinagre", "Servir muy frío"], baseScore: 75 },

  // 🇬🇷 Grecia
  { id: "tzatziki", name: "Tzatziki", emoji: "🥗", country: "🇬🇷", ingredients: ["yogurt", "pepino", "ajo", "aceite_oliva"], steps: ["Rallar y escurrir el pepino", "Mezclar con yogurt griego", "Agregar ajo picado", "Incorporar aceite de oliva", "Sazonar y refrigerar"], baseScore: 70 },
  { id: "moussaka", name: "Moussaka", emoji: "🍆", country: "🇬🇷", ingredients: ["berenjena", "carne", "tomate", "queso"], steps: ["Cortar berenjenas y salar", "Preparar salsa bolognesa", "Hacer bechamel con queso", "Alternar capas en molde", "Hornear hasta dorar"], baseScore: 130 },

  // 🇹🇭 Tailandia
  { id: "pad_thai", name: "Pad Thai", emoji: "🍜", country: "🇹🇭", ingredients: ["fideos_arroz", "camarones", "huevo", "cebolla_verde"], steps: ["Remojar los fideos de arroz", "Saltear camarones en wok", "Agregar fideos escurridos", "Incorporar huevos revueltos", "Condimentar y servir con lima"], baseScore: 120 },

  // 🇲🇦 Marruecos
  { id: "cuscus", name: "Cuscús con Verduras", emoji: "🍲", country: "🇲🇦", ingredients: ["arroz", "zanahoria", "garbanzos", "curry"], steps: ["Hidratar el cuscús con agua caliente", "Saltear zanahoria y garbanzos", "Condimentar con especias", "Mezclar cuscús con las verduras", "Servir caliente con caldo"], baseScore: 100 },

  // 🇧🇷 Brasil
  { id: "feijoada", name: "Feijoada", emoji: "🫘", country: "🇧🇷", ingredients: ["porotos", "cerdo", "cebolla", "ajo"], steps: ["Remojar porotos negros toda la noche", "Cocinar el cerdo troceado", "Saltear cebolla y ajo", "Unir todo y cocinar largo", "Servir con arroz y naranja"], baseScore: 130 },

  // 🇰🇷 Corea
  { id: "bibimbap", name: "Bibimbap", emoji: "🍱", country: "🇰🇷", ingredients: ["arroz", "huevo", "espinaca", "zanahoria"], steps: ["Preparar arroz blanco", "Saltear las verduras por separado", "Freír el huevo con yema blanda", "Colocar todo sobre el arroz", "Mezclar con salsa gochujang"], baseScore: 115 },
];
