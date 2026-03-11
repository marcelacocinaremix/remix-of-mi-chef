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
  { id: "carne_cerdo", name: "Carne de Cerdo", emoji: "🥩" },
  // Lácteos
  { id: "queso", name: "Queso", emoji: "🧀" },
  { id: "leche", name: "Leche", emoji: "🥛" },
  { id: "manteca", name: "Manteca", emoji: "🧈" },
  { id: "crema", name: "Crema", emoji: "🫙" },
  { id: "queso_crema", name: "Queso Crema", emoji: "🧀" },
  { id: "yogurt", name: "Yogurt", emoji: "🥛" },
  { id: "mozzarella", name: "Mozzarella", emoji: "🧀" },
  { id: "parmesano", name: "Parmesano", emoji: "🧀" },
  { id: "mascarpone", name: "Mascarpone", emoji: "🧀" },
  // Harinas y carbohidratos
  { id: "harina", name: "Harina", emoji: "🌾" },
  { id: "pan_rallado", name: "Pan Rallado", emoji: "🍞" },
  { id: "pan", name: "Pan", emoji: "🥖" },
  { id: "maicena", name: "Maicena", emoji: "🥣" },
  { id: "arroz", name: "Arroz", emoji: "🍚" },
  { id: "pasta", name: "Pasta", emoji: "🍝" },
  { id: "pasta_larga", name: "Spaghetti", emoji: "🍝" },
  { id: "fideos_arroz", name: "Fideos de Arroz", emoji: "🍜" },
  { id: "papa", name: "Papa", emoji: "🥔" },
  { id: "batata", name: "Batata", emoji: "🍠" },
  { id: "tortilla_maiz", name: "Tortilla de Maíz", emoji: "🫓" },
  { id: "bizcochuelo", name: "Bizcochuelo", emoji: "🍰" },
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
  { id: "champiñones", name: "Champiñones", emoji: "🍄" },
  { id: "berenjena", name: "Berenjena", emoji: "🍆" },
  { id: "zapallito", name: "Zapallito", emoji: "🥒" },
  { id: "puerro", name: "Puerro", emoji: "🧅" },
  { id: "jengibre", name: "Jengibre", emoji: "🫚" },
  { id: "albahaca_fresca", name: "Albahaca fresca", emoji: "🌿" },
  { id: "nori", name: "Nori (alga)", emoji: "🌊" },
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
  { id: "vinagre_arroz", name: "Vinagre de Arroz", emoji: "🍶" },
  { id: "salsa_tomate", name: "Salsa de Tomate", emoji: "🍅" },
  { id: "curry", name: "Curry", emoji: "🫙" },
  { id: "paprika", name: "Paprika", emoji: "🌶️" },
  { id: "canela", name: "Canela", emoji: "🍂" },
  { id: "chile", name: "Chile", emoji: "🌶️" },
  { id: "cilantro", name: "Cilantro", emoji: "🌿" },
  { id: "albahaca", name: "Albahaca", emoji: "🌿" },
  { id: "mostaza", name: "Mostaza", emoji: "🟡" },
  { id: "mayonesa", name: "Mayonesa", emoji: "🫙" },
  { id: "cafe", name: "Café expreso", emoji: "☕" },
  { id: "wasabi", name: "Wasabi", emoji: "🟢" },
  { id: "pimienta", name: "Pimienta", emoji: "🧂" },
  { id: "tomillo", name: "Tomillo", emoji: "🌿" },
  { id: "nuez_moscada", name: "Nuez Moscada", emoji: "🥜" },
  // Dulces y repostería
  { id: "dulce_leche", name: "Dulce de Leche", emoji: "🍯" },
  { id: "azucar", name: "Azúcar", emoji: "🍬" },
  { id: "miel", name: "Miel", emoji: "🍯" },
  { id: "chocolate", name: "Chocolate", emoji: "🍫" },
  { id: "vainilla", name: "Vainilla", emoji: "🫙" },
  { id: "levadura", name: "Levadura", emoji: "🫧" },
  { id: "cacao_polvo", name: "Cacao en polvo", emoji: "🍫" },
  { id: "ladyfingers", name: "Bizcochos Savoiardi", emoji: "🍪" },
  // Frutas
  { id: "limon", name: "Limón", emoji: "🍋" },
  { id: "naranja", name: "Naranja", emoji: "🍊" },
  { id: "manzana", name: "Manzana", emoji: "🍎" },
  { id: "platano", name: "Plátano", emoji: "🍌" },
  { id: "aguacate", name: "Aguacate", emoji: "🥑" },
  // Frutos secos
  { id: "nueces", name: "Nueces", emoji: "🥜" },
  { id: "almendras", name: "Almendras", emoji: "🥜" },
  { id: "sesamo", name: "Sésamo", emoji: "🌰" },
  // Caldos y líquidos
  { id: "caldo", name: "Caldo", emoji: "🍲" },
  { id: "vino", name: "Vino", emoji: "🍷" },
  { id: "cerveza", name: "Cerveza", emoji: "🍺" },
  { id: "agua", name: "Agua", emoji: "💧" },
];

export const GAME_RECIPES = [
  // 🇦🇷 Argentina
  {
    id: "empanadas",
    name: "Empanadas Argentinas",
    emoji: "🥟",
    country: "🇦🇷",
    ingredients: ["harina", "carne", "cebolla", "huevo"],
    steps: [
      "Mezclar harina con agua tibia y sal para la masa",
      "Saltear la carne picada con cebolla y comino",
      "Dejar enfriar el relleno completamente",
      "Rellenar las tapas y cerrar haciendo el repulgue",
      "Hornear a 200°C por 20 minutos hasta dorar",
    ],
    baseScore: 100,
  },
  {
    id: "milanesa",
    name: "Milanesa a la Napolitana",
    emoji: "🥩",
    country: "🇦🇷",
    ingredients: ["carne", "huevo", "pan_rallado", "mozzarella"],
    steps: [
      "Golpear la carne hasta aplanarla",
      "Pasar por huevo batido con sal y pimienta",
      "Empanar bien con pan rallado",
      "Freír en aceite caliente hasta dorar",
      "Cubrir con salsa de tomate y mozzarella, gratinar",
    ],
    baseScore: 90,
  },
  {
    id: "alfajores",
    name: "Alfajores de Maicena",
    emoji: "🍪",
    country: "🇦🇷",
    ingredients: ["maicena", "harina", "manteca", "dulce_leche"],
    steps: [
      "Batir manteca con azúcar hasta cremar",
      "Incorporar maicena, harina y yemas de huevo",
      "Estirar la masa y cortar discos",
      "Hornear 12 minutos a 180°C hasta blanquear",
      "Unir de a dos con dulce de leche generoso",
    ],
    baseScore: 100,
  },
  {
    id: "asado",
    name: "Asado Argentino",
    emoji: "🔥",
    country: "🇦🇷",
    ingredients: ["carne", "sal", "limon", "vino"],
    steps: [
      "Encender el fuego y dejar que las brasas maduren",
      "Salar la carne en el momento de colocarla",
      "Cocinar del lado del hueso primero a fuego suave",
      "Dar vuelta una sola vez cuando sale jugo",
      "Servir con chimichurri y pan",
    ],
    baseScore: 130,
  },

  // 🇮🇹 Italia
  {
    id: "pasta_carbonara",
    name: "Pasta Carbonara",
    emoji: "🍝",
    country: "🇮🇹",
    ingredients: ["pasta_larga", "panceta", "huevo", "parmesano"],
    steps: [
      "Hervir los spaghetti en agua con mucha sal",
      "Dorar la panceta en cubos en una sartén",
      "Batir yemas de huevo con parmesano rallado",
      "Mezclar la pasta caliente con la panceta fuera del fuego",
      "Agregar la crema de yemas y mezclar rápido para no cocinarla",
    ],
    baseScore: 110,
  },
  {
    id: "pizza_margarita",
    name: "Pizza Margherita",
    emoji: "🍕",
    country: "🇮🇹",
    ingredients: ["harina", "salsa_tomate", "mozzarella", "albahaca_fresca"],
    steps: [
      "Preparar la masa con harina, levadura, agua y sal",
      "Dejar leudar tapada en lugar cálido por 1 hora",
      "Extender la masa con los dedos en círculo",
      "Cubrir con salsa de tomate y mozzarella fresca",
      "Hornear a temperatura máxima 450°C por 8-10 minutos",
    ],
    baseScore: 120,
  },
  {
    id: "risotto",
    name: "Risotto alla Milanese",
    emoji: "🍚",
    country: "🇮🇹",
    ingredients: ["arroz", "cebolla", "vino", "parmesano"],
    steps: [
      "Saltear cebolla picada fina en manteca hasta transparentar",
      "Agregar el arroz y tostar 2 minutos revolviendo",
      "Verter vino blanco y revolver hasta absorber",
      "Incorporar el caldo caliente de a cucharones",
      "Retirar del fuego y agregar manteca fría y parmesano (mantecatura)",
    ],
    baseScore: 115,
  },
  {
    id: "tiramisu",
    name: "Tiramisú",
    emoji: "🍰",
    country: "🇮🇹",
    ingredients: ["ladyfingers", "mascarpone", "huevo", "cafe"],
    steps: [
      "Batir las yemas con azúcar hasta obtener una crema pálida",
      "Incorporar el mascarpone y mezclar suavemente",
      "Batir las claras a nieve e integrar a la crema",
      "Mojar los bizcochos en café frío con marsala",
      "Alternar capas y cubrir con cacao en polvo, refrigerar 4 horas",
    ],
    baseScore: 125,
  },

  // 🇲🇽 México
  {
    id: "tacos_al_pastor",
    name: "Tacos al Pastor",
    emoji: "🌮",
    country: "🇲🇽",
    ingredients: ["tortilla_maiz", "carne_cerdo", "aguacate", "cilantro"],
    steps: [
      "Marinar el cerdo con chile, achiote, piña y especias",
      "Cocinar la carne en sartén o a la plancha bien caliente",
      "Calentar las tortillas de maíz directamente en la llama",
      "Armar los tacos con la carne y piña",
      "Agregar cebolla, cilantro, guacamole y salsa verde",
    ],
    baseScore: 105,
  },
  {
    id: "guacamole",
    name: "Guacamole Clásico",
    emoji: "🥑",
    country: "🇲🇽",
    ingredients: ["aguacate", "tomate", "cebolla", "limon"],
    steps: [
      "Elegir aguacates maduros que cedan al presionar",
      "Aplastar el aguacate con un tenedor dejando trozos",
      "Agregar tomate picado sin semillas y cebolla fina",
      "Incorporar cilantro fresco, chile y sal",
      "Exprimir limón y ajustar sazón, servir de inmediato",
    ],
    baseScore: 70,
  },

  // 🇯🇵 Japón
  {
    id: "sushi",
    name: "Sushi de Salmón",
    emoji: "🍣",
    country: "🇯🇵",
    ingredients: ["arroz", "salmon", "nori", "vinagre_arroz"],
    steps: [
      "Cocinar arroz de sushi y condimentar con vinagre de arroz, sal y azúcar",
      "Dejar enfriar el arroz en temperatura ambiente",
      "Cortar el salmón fresco en láminas finas con cuchillo afilado",
      "Extender el arroz sobre la lámina de nori húmeda",
      "Enrollar con la esterilla presionando firme y cortar en 8 piezas",
    ],
    baseScore: 130,
  },
  {
    id: "ramen",
    name: "Ramen Tonkotsu",
    emoji: "🍜",
    country: "🇯🇵",
    ingredients: ["fideos_arroz", "caldo", "huevo", "carne_cerdo"],
    steps: [
      "Preparar el caldo cocinando huesos de cerdo por 8 horas",
      "Marinar los huevos duros en salsa de soja y mirin",
      "Cocinar los fideos de ramen en agua aparte",
      "Armar el bol con el caldo muy caliente y los fideos",
      "Decorar con chashu de cerdo, huevo, nori y cebollita",
    ],
    baseScore: 125,
  },
  {
    id: "gyoza",
    name: "Gyoza Japonesas",
    emoji: "🥟",
    country: "🇯🇵",
    ingredients: ["harina", "cerdo", "cebolla", "jengibre"],
    steps: [
      "Mezclar cerdo picado con col, jengibre, soja y sésamo",
      "Preparar la masa fina con harina y agua caliente",
      "Rellenar cada tapa con la mezcla y doblar haciendo pliegues",
      "Dorar en sartén con aceite por 2 minutos",
      "Agregar agua, tapar y cocinar al vapor 4 minutos",
    ],
    baseScore: 110,
  },

  // 🇺🇸 Estados Unidos
  {
    id: "hamburguesa",
    name: "Smash Burger",
    emoji: "🍔",
    country: "🇺🇸",
    ingredients: ["carne", "queso", "lechuga", "tomate"],
    steps: [
      "Formar una bola de carne molida de 120g con sal y pimienta",
      "Aplastar sobre la plancha bien caliente con una espátula",
      "Cocinar 2 minutos hasta que los bordes se oscurezcan",
      "Voltear, poner queso y cocinar 1 minuto más",
      "Armar en pan brioche tostado con lechuga, tomate y salsa",
    ],
    baseScore: 90,
  },
  {
    id: "mac_cheese",
    name: "Mac and Cheese",
    emoji: "🧀",
    country: "🇺🇸",
    ingredients: ["pasta", "queso", "leche", "manteca"],
    steps: [
      "Hervir los macarrones al dente en agua salada",
      "Hacer una salsa bechamel con manteca, harina y leche",
      "Agregar queso cheddar rallado y mezclar hasta derretir",
      "Mezclar los macarrones con la salsa de queso",
      "Gratinar en el horno con queso extra por 10 minutos",
    ],
    baseScore: 85,
  },

  // 🇫🇷 Francia
  {
    id: "crepes",
    name: "Crêpes Suzette",
    emoji: "🥞",
    country: "🇫🇷",
    ingredients: ["harina", "huevo", "leche", "manteca"],
    steps: [
      "Mezclar harina, huevos, leche y una pizca de sal",
      "Dejar reposar la masa 30 minutos en la heladera",
      "Derretir manteca en sartén antiadherente a fuego medio",
      "Verter una fina capa de masa y cocinar 1 minuto por lado",
      "Doblar en cuartos y flambear con Grand Marnier y naranja",
    ],
    baseScore: 90,
  },
  {
    id: "quiche_lorraine",
    name: "Quiche Lorraine",
    emoji: "🥧",
    country: "🇫🇷",
    ingredients: ["harina", "panceta", "crema", "huevo"],
    steps: [
      "Preparar la masa quebrada con harina, manteca fría y agua helada",
      "Forrar el molde, pinchar la base y hornear en blanco 15 minutos",
      "Dorar la panceta en cubos sin aceite",
      "Batir huevos con crema, sal, pimienta y nuez moscada",
      "Colocar panceta en la base, verter la mezcla y hornear 35 minutos",
    ],
    baseScore: 115,
  },

  // 🇪🇸 España
  {
    id: "paella",
    name: "Paella Valenciana",
    emoji: "🥘",
    country: "🇪🇸",
    ingredients: ["arroz", "pollo", "pimiento_rojo", "aceite_oliva"],
    steps: [
      "Sofreír el pollo troceado en aceite de oliva en la paellera",
      "Agregar pimiento, tomate y ajo picado, sofreír 5 minutos",
      "Incorporar el arroz y revolver con el sofrito",
      "Verter el caldo caliente con azafrán, no revolver más",
      "Cocinar a fuego fuerte luego suave hasta lograr el socarrat",
    ],
    baseScore: 140,
  },
  {
    id: "tortilla_esp",
    name: "Tortilla Española",
    emoji: "🍳",
    country: "🇪🇸",
    ingredients: ["papa", "huevo", "cebolla", "aceite_oliva"],
    steps: [
      "Pelar y cortar las papas en láminas finas",
      "Confitar las papas con cebolla en aceite de oliva a fuego bajo",
      "Escurrir las papas y mezclar con huevos batidos con sal",
      "Cocinar en sartén a fuego medio bajo hasta casi cuajar",
      "Dar vuelta con un plato y terminar de cuajar por el otro lado",
    ],
    baseScore: 90,
  },

  // 🇨🇳 China
  {
    id: "arroz_frito",
    name: "Arroz Frito Yangzhou",
    emoji: "🍳",
    country: "🇨🇳",
    ingredients: ["arroz", "huevo", "camarones", "salsa_soja"],
    steps: [
      "Usar arroz del día anterior, bien seco y frío",
      "Calentar el wok hasta que humee, agregar aceite",
      "Saltear los camarones y retirar, luego revolver los huevos",
      "Agregar el arroz y saltear a fuego alto 3 minutos",
      "Incorporar camarones, salsa de soja y cebollita verde",
    ],
    baseScore: 95,
  },

  // 🇮🇳 India
  {
    id: "chicken_tikka_masala",
    name: "Chicken Tikka Masala",
    emoji: "🍛",
    country: "🇮🇳",
    ingredients: ["pollo", "yogurt", "curry", "tomate"],
    steps: [
      "Marinar el pollo en yogurt, curry, comino y cúrcuma mínimo 2 horas",
      "Asar el pollo marinado en horno o plancha hasta chamuscar",
      "Saltear cebolla, ajo y jengibre hasta dorar",
      "Agregar tomate triturado, garam masala y cocinar la salsa",
      "Incorporar el pollo asado y crema, cocinar 10 minutos",
    ],
    baseScore: 120,
  },

  // 🇬🇷 Grecia
  {
    id: "moussaka",
    name: "Moussaka Griega",
    emoji: "🍆",
    country: "🇬🇷",
    ingredients: ["berenjena", "carne", "tomate", "parmesano"],
    steps: [
      "Cortar la berenjena en rodajas, salar y dejar reposar 30 minutos",
      "Dorar la berenjena en aceite de oliva y reservar",
      "Preparar la boloñesa con carne, tomate, canela y allspice",
      "Hacer una bechamel espesa con huevo incorporado",
      "Capas: berenjena, carne, bechamel, hornear 45 minutos",
    ],
    baseScore: 130,
  },

  // 🇹🇭 Tailandia
  {
    id: "pad_thai",
    name: "Pad Thai",
    emoji: "🍜",
    country: "🇹🇭",
    ingredients: ["fideos_arroz", "camarones", "huevo", "sesamo"],
    steps: [
      "Remojar los fideos de arroz en agua fría 30 minutos",
      "Saltear camarones en wok muy caliente con aceite",
      "Agregar los fideos escurridos y saltear 2 minutos",
      "Empujar a un lado, revolver 2 huevos en el wok",
      "Mezclar todo con salsa de tamarindo, limón y sésamo",
    ],
    baseScore: 120,
  },

  // 🇧🇷 Brasil
  {
    id: "feijoada",
    name: "Feijoada Brasileña",
    emoji: "🫘",
    country: "🇧🇷",
    ingredients: ["porotos", "cerdo", "ajo", "naranja"],
    steps: [
      "Remojar los porotos negros en agua fría toda la noche",
      "Dorar el chorizo, costilla y panceta de cerdo en la olla",
      "Agregar ajo y cebolla, sofreír hasta dorar",
      "Incorporar los porotos remojados con agua y cocinar 2 horas",
      "Servir sobre arroz blanco con gajos de naranja y farofa",
    ],
    baseScore: 130,
  },

  // 🇰🇷 Corea
  {
    id: "bibimbap",
    name: "Bibimbap",
    emoji: "🍱",
    country: "🇰🇷",
    ingredients: ["arroz", "huevo", "espinaca", "zanahoria"],
    steps: [
      "Preparar arroz blanco bien cocido",
      "Saltear cada verdura por separado con sal y sésamo",
      "Freír el huevo con yema líquida",
      "Colocar arroz en bol caliente y disponer las verduras en secciones",
      "Agregar huevo frito encima y mezclar con salsa gochujang al gusto",
    ],
    baseScore: 115,
  },

  // 🇲🇦 Marruecos
  {
    id: "tagine",
    name: "Tagine de Cordero",
    emoji: "🍲",
    country: "🇲🇦",
    ingredients: ["carne", "zanahoria", "garbanzos", "canela"],
    steps: [
      "Sellar los trozos de cordero en el tagine con aceite de oliva",
      "Agregar cebolla y ajo picados, sofreír 5 minutos",
      "Incorporar especias: cúrcuma, jengibre, canela y ras el hanout",
      "Agregar zanahoria, garbanzos y un poco de agua o caldo",
      "Tapar y cocinar a fuego muy bajo por 2 horas",
    ],
    baseScore: 120,
  },

  // 🇺🇸 Clásico
  {
    id: "cheesecake",
    name: "New York Cheesecake",
    emoji: "🍰",
    country: "🇺🇸",
    ingredients: ["queso_crema", "huevo", "azucar", "manteca"],
    steps: [
      "Moler galletitas y mezclar con manteca derretida para la base",
      "Batir queso crema con azúcar hasta quedar completamente liso",
      "Agregar los huevos de a uno sin sobrebatir",
      "Volcar sobre la base en molde desmontable",
      "Hornear a baño María 60 minutos a 160°C, enfriar en horno apagado",
    ],
    baseScore: 110,
  },
];
