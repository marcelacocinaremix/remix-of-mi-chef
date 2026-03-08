import { useState, useEffect, useCallback } from "react";
import { TipsSection } from "./TipsSection";
import { FoodStorageGuide } from "./FoodStorageGuide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import learnBanner from "@/assets/learn-banner.jpg";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChefHat,
  Flame,
  Leaf,
  Beef,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Lock,
  Play,
  Gamepad2,
  GraduationCap,
  Star,
  BookOpen,
  Lightbulb,
  Utensils,
  Egg,
  Fish,
  Salad,
  Cookie,
  Coffee,
  Soup,
  Sandwich,
  Pizza,
  IceCream,
  Apple,
  Carrot,
  Wheat,
  Droplets,
  ThermometerSun,
  Timer,
  Scale,
  Refrigerator,
  ShoppingBasket,
  Heart,
  Baby,
  Users,
  Dumbbell,
  Brain,
  Zap,
  Shield,
  Recycle,
  Coins,
  Clock,
  ArrowRight,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";
import { usePremium } from "@/hooks/usePremium";
import { PaywallModal } from "@/components/PaywallModal";

interface Lesson {
  id: string;
  title: string;
  description: string;
  tips: string[];
  steps?: string[];
  marcelaMessage: string;
  funFact?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  lessons: Lesson[];
}

interface Level {
  id: string;
  name: string;
  description: string;
  color: string;
  gradient: string;
  categories: Category[];
}

const learningContent: Level[] = [
  {
    id: "principiante",
    name: "Principiante",
    description: "Empezá desde cero con lo básico de la cocina",
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    categories: [
      {
        id: "tecnicas-basicas",
        name: "Técnicas Básicas",
        icon: ChefHat,
        description: "Los fundamentos que todo cocinero debe conocer",
        lessons: [
          {
            id: "cortar-verduras",
            title: "Cómo cortar verduras",
            description: "Aprendé los cortes básicos: juliana, cubos, rodajas y más",
            tips: [
              "Usá un cuchillo bien afilado - es más seguro que uno desafilado",
              "Mantené los dedos curvados como una garra para protegerlos",
              "Cortá sobre una tabla estable, ponele un trapo húmedo abajo",
              "Practicá el corte en 'puente' para frutas redondas",
              "Empezá lento, la velocidad viene con la práctica"
            ],
            steps: [
              "Lavá y secá bien las verduras antes de cortar",
              "Estabilizá la verdura cortando una base plana si es necesario",
              "Posicioná tu mano guía con dedos curvados",
              "Cortá con movimientos suaves hacia adelante y abajo",
              "Mantené la punta del cuchillo en contacto con la tabla"
            ],
            marcelaMessage: "¡El corte es la base de todo! Con práctica vas a ser un experto. Empezá con papas que son más fáciles 🔪",
            funFact: "Los chefs profesionales practican cortes durante años antes de dominarlos completamente"
          },
          {
            id: "medir-ingredientes",
            title: "Medir ingredientes correctamente",
            description: "La precisión es clave para recetas exitosas",
            tips: [
              "Una taza = 240ml / 16 cucharadas",
              "Una cucharada = 15ml / 3 cucharaditas",
              "Una cucharadita = 5ml",
              "Para harina: no la compactes, usá el método de cuchara",
              "Medí líquidos a la altura de los ojos",
              "Para ingredientes pegajosos, rocía el medidor con aceite"
            ],
            steps: [
              "Juntá todos los ingredientes antes de empezar",
              "Usá tazas medidoras para secos y jarras para líquidos",
              "Nivelá los ingredientes secos con el dorso de un cuchillo",
              "No midas sobre el bowl - si te pasás, arruinás todo"
            ],
            marcelaMessage: "Las medidas exactas hacen la diferencia entre bueno y excelente. En pastelería especialmente, ¡no improvises! 📏",
            funFact: "La pastelería se considera una ciencia porque requiere precisión matemática"
          },
          {
            id: "mise-en-place",
            title: "Mise en place",
            description: "El secreto francés: tener todo listo antes de cocinar",
            tips: [
              "Leé la receta completa dos veces antes de empezar",
              "Prepará y medí todos los ingredientes en bowls separados",
              "Organizá los utensilios que vas a necesitar",
              "Tené un bowl para residuos cerca",
              "Precalentá el horno si lo vas a necesitar",
              "Despejá y limpiá tu área de trabajo"
            ],
            marcelaMessage: "Un buen cocinero siempre está preparado. Esto te ahorra estrés y errores ✨"
          },
          {
            id: "lavar-alimentos",
            title: "Lavar alimentos correctamente",
            description: "Higiene básica para cocinar seguro",
            tips: [
              "Lavá frutas y verduras bajo agua corriente",
              "Usá un cepillo para vegetales de piel dura",
              "No laves la carne cruda - esparce bacterias",
              "Secá bien las hojas verdes con un centrifugador",
              "Lavate las manos 20 segundos antes y después de manipular alimentos"
            ],
            marcelaMessage: "La higiene es lo primero. ¡Manos limpias, comida segura! 🧼"
          },
          {
            id: "organizar-cocina",
            title: "Organizar tu cocina",
            description: "Un espacio ordenado hace todo más fácil",
            tips: [
              "Guardá lo que más usás a mano",
              "Especias cerca de la cocina, no del calor directo",
              "Tené siempre trapos limpios disponibles",
              "Un bowl para basura mientras cocinás ahorra tiempo",
              "Limpiá mientras cocinás para no acumular"
            ],
            marcelaMessage: "Cocina ordenada, mente ordenada. ¡Es más fácil cocinar cuando encontrás todo! 🏠"
          }
        ]
      },
      {
        id: "metodos-coccion-basicos",
        name: "Métodos de Cocción Básicos",
        icon: Flame,
        description: "Las técnicas fundamentales para transformar ingredientes",
        lessons: [
          {
            id: "hervir",
            title: "Hervir correctamente",
            description: "Agua + calor = magia culinaria",
            tips: [
              "Esperá a que el agua hierva (burbujas grandes) antes de agregar pasta",
              "Agregá sal cuando el agua hierva - 1 cucharada por litro",
              "No tapes la olla cuando hiervas verduras verdes (se ponen marrones)",
              "Hervir suave (simmer) es para cocciones largas",
              "El agua con almidón de pasta sirve para espesar salsas"
            ],
            steps: [
              "Llená la olla con suficiente agua (la pasta necesita espacio)",
              "Tapá para que hierva más rápido",
              "Cuando hierva, agregá sal generosamente",
              "Sumergí los alimentos y ajustá el fuego",
              "Controlá el tiempo con un timer"
            ],
            marcelaMessage: "Hervir parece simple pero tiene sus secretos. El agua bien salada hace toda la diferencia 🫕",
            funFact: "El agua hierve a 100°C al nivel del mar, pero a menor temperatura en la altura"
          },
          {
            id: "saltear",
            title: "Saltear en sartén",
            description: "Cocción rápida a fuego alto para máximo sabor",
            tips: [
              "Calentá bien la sartén ANTES de agregar aceite",
              "El aceite debe brillar y moverse fácilmente",
              "No llenes demasiado la sartén - cocina en tandas",
              "Mové los ingredientes constantemente",
              "Cortá todo del mismo tamaño para cocción pareja"
            ],
            steps: [
              "Calentá la sartén vacía a fuego alto",
              "Agregá aceite y esperá que brille",
              "Añadí los ingredientes en una sola capa",
              "Mové con espátula o sacudiendo la sartén",
              "Cociná hasta dorar, unos 3-5 minutos"
            ],
            marcelaMessage: "¡El salteado es arte en movimiento! La clave es el fuego alto y no sobrecargar 🍳"
          },
          {
            id: "freir",
            title: "Freír sin miedo",
            description: "Técnicas para frituras perfectas y seguras",
            tips: [
              "Usá aceite con punto de humo alto (girasol, maní)",
              "La temperatura ideal es 180°C - usá termómetro",
              "Secá bien los alimentos antes de freír para evitar salpicaduras",
              "No llenes la sartén - baja la temperatura",
              "Escurrí sobre papel absorbente"
            ],
            marcelaMessage: "Freír bien es un arte. La temperatura correcta es TODO 🌡️",
            funFact: "Las papas fritas perfectas se fríen dos veces: primero a 160°C, luego a 190°C"
          },
          {
            id: "hornear-basico",
            title: "Hornear básico",
            description: "Tu horno es tu mejor amigo",
            tips: [
              "Siempre precalentá el horno 10-15 minutos antes",
              "Usá la rejilla del medio para cocción pareja",
              "No abras la puerta constantemente - pierde calor",
              "Conocé tu horno: algunos calientan más arriba o abajo",
              "Rotá las bandejas a mitad de cocción"
            ],
            marcelaMessage: "El horno tiene su personalidad. Conocelo y van a ser grandes amigos 🔥"
          },
          {
            id: "vapor",
            title: "Cocinar al vapor",
            description: "La cocción más saludable que existe",
            tips: [
              "El agua no debe tocar los alimentos",
              "No destapes durante la cocción",
              "Los vegetales quedan más verdes y crujientes",
              "Agregá aromáticos al agua para dar sabor",
              "Es perfecto para pescados delicados"
            ],
            marcelaMessage: "El vapor preserva nutrientes y sabor. ¡Es mi método favorito para verduras! 💨"
          }
        ]
      },
      {
        id: "condimentos-basicos",
        name: "Condimentos Básicos",
        icon: Sparkles,
        description: "Los sabores que transforman cualquier plato",
        lessons: [
          {
            id: "sal-pimienta",
            title: "Sal y pimienta: los pilares",
            description: "Dominá los condimentos más importantes",
            tips: [
              "Sazoná en capas durante la cocción, no solo al final",
              "La pimienta recién molida tiene 10x más sabor",
              "La sal gruesa es para cocinar, la fina para terminar",
              "Probá siempre antes de servir y ajustá",
              "Menos es más - siempre podés agregar, no quitar"
            ],
            marcelaMessage: "Sal y pimienta son tus mejores amigos. Aprendé a usarlos bien y todo mejora 🧂",
            funFact: "La sal realza el sabor de otros ingredientes, no solo agrega sabor salado"
          },
          {
            id: "aceites",
            title: "Tipos de aceites y usos",
            description: "Cada aceite tiene su momento",
            tips: [
              "Aceite de oliva extra virgen: ensaladas y terminar platos",
              "Aceite de oliva común: saltear a fuego medio",
              "Aceite de girasol/maíz: frituras y fuego alto",
              "Aceite de sésamo: toque asiático al final",
              "Guardá los aceites lejos de la luz y el calor"
            ],
            marcelaMessage: "El aceite correcto hace toda la diferencia. ¡No uses extra virgen para freír! 🫒"
          },
          {
            id: "acidos",
            title: "Ácidos: limón, vinagre y más",
            description: "El toque que levanta cualquier plato",
            tips: [
              "Un chorrito de limón al final levanta cualquier plato",
              "El vinagre balsámico es dulce, ideal para ensaladas",
              "El vinagre de vino es más fuerte, úsalo con moderación",
              "Los ácidos ayudan a balancear la grasa",
              "Agregá el ácido al final para preservar el sabor"
            ],
            marcelaMessage: "Si algo le falta a tu plato, probablemente sea acidez. ¡Un limoncito hace magia! 🍋"
          },
          {
            id: "ajo-cebolla",
            title: "Ajo y cebolla: la base de todo",
            description: "Los aromáticos esenciales de la cocina",
            tips: [
              "El ajo se quema rápido - agregalo después de la cebolla",
              "Cebolla caramelizada: fuego bajo, 30-45 minutos",
              "Aplastá el ajo para más sabor, picalo para menos",
              "La cebolla cortada fina se cocina más rápido",
              "El ajo dorado es amargo - retiralo antes de que se queme"
            ],
            marcelaMessage: "Ajo y cebolla son la base de casi todo. Aprendé a manejarlos y tenés medio camino andado 🧄"
          },
          {
            id: "hierbas-frescas",
            title: "Hierbas frescas básicas",
            description: "Verde que da vida a tus platos",
            tips: [
              "Hierbas tiernas (perejil, cilantro, albahaca): agregar al final",
              "Hierbas duras (romero, tomillo): pueden cocinarse",
              "Guardá las hierbas en agua en la heladera",
              "La albahaca no va a la heladera - se pone negra",
              "Picá las hierbas justo antes de usar"
            ],
            marcelaMessage: "Las hierbas frescas transforman un plato aburrido en algo especial 🌿"
          }
        ]
      },
      {
        id: "huevos",
        name: "Huevos Perfectos",
        icon: Egg,
        description: "El ingrediente más versátil de la cocina",
        lessons: [
          {
            id: "huevo-frito",
            title: "Huevo frito perfecto",
            description: "Clara cocida, yema líquida",
            tips: [
              "Fuego medio-bajo, nunca alto",
              "Manteca o aceite bien caliente pero sin humear",
              "Rompé el huevo en un bowl primero para evitar cáscaras",
              "Tapá la sartén para cocinar la parte de arriba",
              "Sazoná solo la clara para no marcar la yema"
            ],
            marcelaMessage: "El huevo frito perfecto tiene la clara blanca y la yema cremosa ☀️"
          },
          {
            id: "huevo-revuelto",
            title: "Huevos revueltos cremosos",
            description: "El secreto está en el fuego bajo",
            tips: [
              "Batí los huevos justo antes de cocinar",
              "Fuego bajo y paciencia",
              "Mové constantemente con espátula de silicona",
              "Sacá del fuego ANTES de que estén listos - siguen cocinándose",
              "Agregá un poco de crema o manteca para más cremosidad"
            ],
            marcelaMessage: "Huevos revueltos cremosos = fuego bajo + paciencia. ¡No los apures! 🍳"
          },
          {
            id: "huevo-duro",
            title: "Huevo duro sin aro verde",
            description: "Cocción perfecta en tiempo exacto",
            tips: [
              "Empezá con huevos a temperatura ambiente",
              "Cubrilos con agua fría, llevá a hervor",
              "Apagá el fuego y tapá 10-12 minutos",
              "Pasá a agua helada inmediatamente",
              "El aro verde sale por sobrecocción"
            ],
            steps: [
              "Poné los huevos en olla con agua fría",
              "Llevá a hervor a fuego alto",
              "Cuando hierva, apagá y tapá",
              "10 min para duro, 6-7 para semilíquido",
              "Pasá a agua con hielo 5 minutos"
            ],
            marcelaMessage: "El huevo duro perfecto no tiene aro verde. ¡El secreto es no sobrecocinar! 🥚"
          },
          {
            id: "tortilla",
            title: "Tortilla esponjosa",
            description: "El clásico que nunca falla",
            tips: [
              "Batí bien los huevos con un tenedor",
              "Agregá una cucharada de agua o leche por huevo",
              "La sartén debe estar caliente pero no humeando",
              "Mové los bordes hacia el centro mientras cuaja",
              "Doblá cuando la superficie esté apenas húmeda"
            ],
            marcelaMessage: "Una buena tortilla es jugosa por dentro. ¡No la seques! 🌟"
          }
        ]
      },
      {
        id: "arroz-pastas",
        name: "Arroz y Pastas",
        icon: Wheat,
        description: "Carbohidratos perfectos siempre",
        lessons: [
          {
            id: "arroz-blanco",
            title: "Arroz blanco suelto",
            description: "Granos separados y perfectos",
            tips: [
              "Lavá el arroz hasta que el agua salga clara",
              "Proporción: 1 taza arroz, 2 tazas agua",
              "Llevá a hervor, bajá a mínimo, tapá 18 minutos",
              "No destapes ni revuelvas durante la cocción",
              "Dejá reposar 5 minutos antes de servir"
            ],
            marcelaMessage: "El secreto del arroz suelto: no lo toques mientras cocina 🍚"
          },
          {
            id: "pasta-perfecta",
            title: "Pasta al dente",
            description: "Ni muy dura ni muy blanda",
            tips: [
              "Usá mucha agua: 1 litro por 100g de pasta",
              "El agua debe estar MUY salada - como el mar",
              "No agregues aceite al agua",
              "Probá 2 minutos antes del tiempo del paquete",
              "Guardá 1 taza de agua de cocción para la salsa"
            ],
            marcelaMessage: "La pasta perfecta tiene un puntito blanco en el centro. ¡Eso es al dente! 🍝"
          },
          {
            id: "fideos-salsa",
            title: "Unir pasta y salsa",
            description: "El matrimonio perfecto",
            tips: [
              "Terminá de cocinar la pasta EN la salsa",
              "El agua de pasta espesa y une la salsa",
              "Agregá pasta a la salsa, no al revés",
              "Mové constantemente para que se integre",
              "Servir inmediatamente"
            ],
            marcelaMessage: "La pasta y la salsa se enamoran en la sartén. ¡No las sirvas separadas! 💕"
          }
        ]
      },
      {
        id: "seguridad",
        name: "Seguridad en la Cocina",
        icon: Shield,
        description: "Cocinando seguro, cocinás mejor",
        lessons: [
          {
            id: "temperaturas-seguras",
            title: "Temperaturas seguras",
            description: "Evitá enfermedades alimentarias",
            tips: [
              "Pollo: 75°C interno mínimo",
              "Carne molida: 71°C",
              "Cerdo: 63°C (rosa ok)",
              "Pescado: 63°C o que se deshaga",
              "Sobras: recalentá a 74°C"
            ],
            marcelaMessage: "Un termómetro de cocina es tu mejor inversión en salud 🌡️"
          },
          {
            id: "contaminacion-cruzada",
            title: "Evitar contaminación cruzada",
            description: "Mantené los alimentos separados",
            tips: [
              "Usá tablas diferentes para carnes y vegetales",
              "Lavá cuchillos entre usos con diferentes alimentos",
              "Guardá carnes crudas en la parte baja de la heladera",
              "No uses el mismo plato para carne cruda y cocida",
              "Lavate las manos después de tocar carne cruda"
            ],
            marcelaMessage: "La seguridad alimentaria no es opcional. ¡Cuidá a tu familia! 🛡️"
          },
          {
            id: "almacenamiento",
            title: "Almacenar alimentos correctamente",
            description: "Que duren más y seguros",
            tips: [
              "Heladera: debajo de 4°C",
              "Freezer: -18°C o menos",
              "No dejes comida fuera más de 2 horas",
              "Enfriá rápido las sobras antes de guardar",
              "Etiquetá con fecha todo lo que freezes"
            ],
            marcelaMessage: "Guardá bien y desperdiciá menos. ¡Tu bolsillo y el planeta te lo agradecen! ♻️"
          }
        ]
      }
    ]
  },
  {
    id: "intermedio",
    name: "Intermedio",
    description: "Perfeccioná tus habilidades y expandí tu repertorio",
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-500",
    categories: [
      {
        id: "carnes",
        name: "Carnes",
        icon: Beef,
        description: "Dominá las proteínas más populares",
        lessons: [
          {
            id: "punto-carne",
            title: "Puntos de cocción",
            description: "Jugoso, a punto o bien cocido - controlá cada uno",
            tips: [
              "Sacá la carne de la heladera 30 min antes de cocinar",
              "Dejá reposar 5-10 min después de cocinar - redistribuye jugos",
              "Usá el test del dedo o un termómetro",
              "No pinches ni cortes la carne mientras se cocina",
              "El carry-over cooking: sube 3-5°C después de sacar del fuego"
            ],
            steps: [
              "Jugoso (rare): 52-55°C - centro rojo frío",
              "A punto (medium-rare): 55-60°C - centro rojo tibio",
              "Medio (medium): 60-65°C - centro rosa",
              "Tres cuartos: 65-70°C - ligeramente rosa",
              "Bien cocido: 70°C+ - marrón parejo"
            ],
            marcelaMessage: "El punto perfecto es cuestión de práctica. ¡Un termómetro es tu mejor amigo! 🥩",
            funFact: "Los grandes restaurantes usan termómetros digitales para garantizar el punto exacto"
          },
          {
            id: "sellar-carne",
            title: "Sellar correctamente",
            description: "Dorado exterior, jugoso interior",
            tips: [
              "Secá MUY bien la carne con papel antes de sellar",
              "La sartén debe estar casi humeando",
              "No muevas la carne hasta que se despegue sola",
              "Sellá los bordes también para costra completa",
              "Usá aceite con punto de humo alto"
            ],
            marcelaMessage: "El sellado perfecto es pura satisfacción. ¡Escuchá ese chisporroteo! 🔥"
          },
          {
            id: "pollo-jugoso",
            title: "Pollo siempre jugoso",
            description: "Nunca más pollo seco",
            tips: [
              "Salá el pollo 1 hora antes y dejalo destapado en heladera",
              "Llevalo a temperatura ambiente antes de cocinar",
              "La piel crujiente necesita calor alto al final",
              "Dejá reposar 5 minutos antes de cortar",
              "75°C en la parte más gruesa = listo"
            ],
            marcelaMessage: "El pollo seco es un crimen culinario. ¡La temperatura es todo! 🍗"
          },
          {
            id: "carne-molida",
            title: "Carne molida perfecta",
            description: "Hamburguesas, albóndigas y más",
            tips: [
              "No amases demasiado - queda dura",
              "Hacé un hoyuelo en las hamburguesas para que no se inflen",
              "Sazoná generosamente antes de formar",
              "Cociná a fuego medio-alto",
              "No aplastes con la espátula - pierde jugos"
            ],
            marcelaMessage: "Las mejores hamburguesas son simples: buena carne, poca manipulación 🍔"
          },
          {
            id: "cerdo",
            title: "Cerdo en su punto",
            description: "Rosa está bien, seco nunca",
            tips: [
              "El cerdo moderno se puede comer rosado (63°C)",
              "Marinar hace maravillas con el cerdo",
              "El costillar bajo y lento es la gloria",
              "El solomillo es magro - no lo pases",
              "La grasa = sabor, no la cortes toda"
            ],
            marcelaMessage: "El cerdo ya no se cocina hasta la suela. ¡Un poco rosa es perfecto! 🐷"
          }
        ]
      },
      {
        id: "verduras-avanzado",
        name: "Verduras Avanzado",
        icon: Leaf,
        description: "Vegetales que brillan en cada plato",
        lessons: [
          {
            id: "asar-verduras",
            title: "Asar verduras perfectas",
            description: "Caramelización y sabor intenso",
            tips: [
              "Cortá las verduras en tamaños similares",
              "No amontones - necesitan espacio para dorar",
              "Horno a 200-220°C mínimo",
              "Aceite generoso y sal ANTES de meter al horno",
              "Girá a mitad de cocción"
            ],
            steps: [
              "Precalentá el horno con la bandeja adentro",
              "Cortá verduras en trozos parejos",
              "Mezclá con aceite, sal y especias",
              "Distribuí en una sola capa",
              "Asá 25-40 min según la verdura, girando una vez"
            ],
            marcelaMessage: "Las verduras asadas son puro comfort food. El secreto es espacio y calor alto 🥕"
          },
          {
            id: "blanquear-verduras",
            title: "Blanquear verduras",
            description: "Color vibrante y textura perfecta",
            tips: [
              "Prepará un bowl grande con agua y MUCHO hielo",
              "El agua debe estar bien salada",
              "Cocción corta: 2-3 minutos máximo",
              "Pasá inmediatamente al agua helada",
              "Escurrí bien antes de usar"
            ],
            marcelaMessage: "El blanqueado preserva color y nutrientes. ¡Verduras vibrantes siempre! 💚"
          },
          {
            id: "grillar-verduras",
            title: "Grillar verduras",
            description: "Marcas de parrilla y sabor ahumado",
            tips: [
              "Cortá en rodajas de 1cm mínimo",
              "Aceite las verduras, no la parrilla",
              "Fuego medio-alto",
              "No las muevas hasta que tengan marcas",
              "Berenjenas, zucchinis y morrones son ideales"
            ],
            marcelaMessage: "Las verduras a la parrilla son espectaculares. ¡Perfectas para acompañar! 🔥"
          },
          {
            id: "pure-verduras",
            title: "Purés de verduras cremosos",
            description: "Más allá del puré de papas",
            tips: [
              "Cociná las verduras hasta que estén MUY blandas",
              "Procesá en caliente con manteca y crema",
              "Pasá por tamiz para textura súper suave",
              "Ajustá la consistencia con el líquido de cocción",
              "Zapallo, zanahoria, coliflor: todos hacen purés increíbles"
            ],
            marcelaMessage: "Un buen puré es terciopelo. ¡Paciencia y buenos ingredientes! 🥔"
          },
          {
            id: "ensaladas",
            title: "Ensaladas memorables",
            description: "Mucho más que lechuga y tomate",
            tips: [
              "Secá MUY bien las hojas - el agua diluye el aderezo",
              "Aderezá justo antes de servir",
              "Mezclá texturas: crocante, cremoso, tierno",
              "La vinagreta básica: 3 partes aceite, 1 parte ácido",
              "Sazoná cada componente por separado"
            ],
            marcelaMessage: "Una ensalada aburrida es un desperdicio. ¡Ponele onda! 🥗"
          }
        ]
      },
      {
        id: "salsas",
        name: "Salsas Madre",
        icon: Droplets,
        description: "Las bases de la cocina francesa y mundial",
        lessons: [
          {
            id: "salsa-tomate",
            title: "Salsa de tomate casera",
            description: "La base de miles de platos italianos",
            tips: [
              "Usá tomates maduros o enlatados de calidad",
              "Cocción lenta = más sabor",
              "Un poquito de azúcar balancea la acidez",
              "El ajo va al principio, la albahaca al final",
              "Dejá reducir para concentrar sabor"
            ],
            steps: [
              "Sofríe ajo en aceite de oliva hasta dorar",
              "Agregá tomates y aplastá con cuchara",
              "Sazoná con sal, pimienta, pizca de azúcar",
              "Cociná a fuego bajo 30-45 minutos",
              "Agregá albahaca fresca al final"
            ],
            marcelaMessage: "Una buena salsa de tomate es amor líquido. ¡Tomáte tu tiempo! 🍅"
          },
          {
            id: "salsa-blanca",
            title: "Salsa blanca (Béchamel)",
            description: "La madre de muchas salsas cremosas",
            tips: [
              "Misma cantidad de manteca que harina",
              "Agregá la leche de a poco, batiendo siempre",
              "La leche puede estar tibia para evitar grumos",
              "Cociná 5 minutos después de espesar para quitar gusto a harina",
              "Sazoná con nuez moscada para el toque clásico"
            ],
            steps: [
              "Derretí la manteca a fuego medio",
              "Agregá la harina y mové 2 minutos",
              "Incorporá la leche de a poco batiendo",
              "Cociná hasta que espese y cubra la cuchara",
              "Sazoná con sal, pimienta y nuez moscada"
            ],
            marcelaMessage: "La béchamel es la base de lasañas, gratinados y más. ¡Dominala! 🥛"
          },
          {
            id: "vinagreta",
            title: "Vinagretas perfectas",
            description: "El aderezo que transforma ensaladas",
            tips: [
              "Proporción clásica: 3 aceite, 1 vinagre",
              "Emulsioná agregando aceite de a poco batiendo",
              "La mostaza ayuda a mantener la emulsión",
              "Probá y ajustá el balance ácido-graso",
              "Hacela justo antes de usar o embotellarla agitando antes"
            ],
            marcelaMessage: "Una buena vinagreta eleva cualquier ensalada de 'meh' a 'wow' ✨"
          },
          {
            id: "fondo-caldo",
            title: "Fondos y caldos caseros",
            description: "El secreto de los restaurantes",
            tips: [
              "Usá huesos, restos de verduras, hierbas",
              "Cocción lenta: 2-4 horas mínimo",
              "No hiervas fuerte - queda turbio",
              "Colá bien y dejá enfriar para desgrasar",
              "Congelá en cubeteras para usar de a poco"
            ],
            marcelaMessage: "Un buen caldo casero es oro líquido. ¡No tires los huesos! 🍲"
          }
        ]
      },
      {
        id: "pescados-mariscos",
        name: "Pescados y Mariscos",
        icon: Fish,
        description: "Frutos del mar cocinados a la perfección",
        lessons: [
          {
            id: "elegir-pescado",
            title: "Elegir pescado fresco",
            description: "Signos de frescura que no fallan",
            tips: [
              "Ojos brillantes y saltones, no hundidos",
              "Olor a mar, nunca a amoníaco",
              "Carne firme que vuelve al presionar",
              "Agallas rojas brillantes",
              "Escamas adheridas, no sueltas"
            ],
            marcelaMessage: "El pescado fresco casi no huele. Si huele fuerte, ¡no lo compres! 🐟"
          },
          {
            id: "cocinar-pescado",
            title: "Cocinar pescado sin pasarlo",
            description: "Del crudo al perfecto en minutos",
            tips: [
              "La regla: 10 minutos por pulgada de grosor",
              "Está listo cuando se deshace con tenedor",
              "Fuego medio, nunca alto",
              "Secalo bien antes de cocinar",
              "La piel crujiente: empezá del lado de la piel"
            ],
            marcelaMessage: "El pescado pasado es seco y triste. ¡Menos tiempo es mejor! 🎣"
          },
          {
            id: "mariscos-basicos",
            title: "Mariscos: lo básico",
            description: "Camarones, mejillones y más",
            tips: [
              "Camarones: cuando se pongan rosados, ya están (2-3 min)",
              "Mejillones: se abren cuando están listos",
              "No comas los que no se abrieron",
              "Descongelá en heladera, nunca a temperatura ambiente",
              "Cociná el mismo día que los comprás"
            ],
            marcelaMessage: "Los mariscos se cocinan en minutos. ¡No los pases! 🦐"
          }
        ]
      },
      {
        id: "tecnicas-intermedias",
        name: "Técnicas Intermedias",
        icon: ChefHat,
        description: "Subí tu nivel en la cocina",
        lessons: [
          {
            id: "desglasar",
            title: "Desglasar la sartén",
            description: "Rescatá todo el sabor del fondo",
            tips: [
              "Usá vino, caldo, vinagre o jugo",
              "El líquido debe estar caliente o a temperatura ambiente",
              "Raspá con cuchara de madera todos los fonditos",
              "Dejá reducir a la mitad para concentrar sabor",
              "Esta es la base de las mejores salsas"
            ],
            marcelaMessage: "Esos fonditos dorados son oro puro. ¡No los desperdicies! 🍷"
          },
          {
            id: "marinar",
            title: "Marinar correctamente",
            description: "Sabor profundo y carne tierna",
            tips: [
              "Ácido + aceite + aromáticos = marinada perfecta",
              "Carnes rojas: 2-24 horas",
              "Pollo: 2-12 horas",
              "Pescado: 15-30 minutos máximo (el ácido lo cocina)",
              "Siempre mariná en la heladera, nunca afuera"
            ],
            marcelaMessage: "Una buena marinada transforma proteínas simples en algo extraordinario 🌟"
          },
          {
            id: "brasear",
            title: "Brasear: cocción lenta",
            description: "Cortes duros transformados en manteca",
            tips: [
              "Sellá primero la carne para color y sabor",
              "El líquido debe llegar a 1/3 de la carne",
              "Horno bajo (150-160°C) o fuego mínimo",
              "Mínimo 2 horas, a veces 4+",
              "Está listo cuando se deshace solo"
            ],
            marcelaMessage: "Lo barato + tiempo = lujo. El braseado es alquimia pura 🍖"
          },
          {
            id: "gratinar",
            title: "Gratinar perfecto",
            description: "Esa costra dorada irresistible",
            tips: [
              "Queso rallado grueso gratina mejor",
              "El grill debe estar precalentado",
              "Vigilá constantemente - se quema en segundos",
              "Pan rallado + manteca = gratín clásico",
              "Dejá reposar 5 min antes de servir"
            ],
            marcelaMessage: "El gratinado es el final perfecto. ¡Esa costra crujiente es adictiva! 🧀"
          }
        ]
      },
      {
        id: "cocina-economica",
        name: "Cocina Económica",
        icon: Coins,
        description: "Cociná rico gastando poco",
        lessons: [
          {
            id: "planificar-menu",
            title: "Planificar el menú semanal",
            description: "Ahorrá tiempo y dinero",
            tips: [
              "Revisá qué tenés antes de ir al super",
              "Planificá comidas con ingredientes en común",
              "Aprovechá las ofertas para armar el menú",
              "Cociná en cantidad y congelá porciones",
              "Un día de 'vaciá la heladera' reduce desperdicio"
            ],
            marcelaMessage: "Planificar es la clave del ahorro. ¡Y comés mejor! 📝"
          },
          {
            id: "cortes-economicos",
            title: "Cortes económicos deliciosos",
            description: "Lo barato puede ser lo mejor",
            tips: [
              "Osobuco, falda, aguja: perfectos para braseados",
              "Pollo entero es más barato que en partes",
              "Las vísceras son nutritivas y económicas",
              "Huesos para caldo = gratis o muy barato",
              "Carne molida: versátil y accesible"
            ],
            marcelaMessage: "Los cortes 'feos' bien cocinados son los más sabrosos 💪"
          },
          {
            id: "aprovechamiento",
            title: "Aprovechamiento total",
            description: "Cero desperdicio en la cocina",
            tips: [
              "Tallos de brócoli: pelados son deliciosos",
              "Hojas de zanahoria: pesto o chimichurri",
              "Cáscaras de papa: chips crujientes",
              "Pan duro: pan rallado, budín, migas",
              "Cáscaras de verduras: para caldo"
            ],
            marcelaMessage: "No tires nada. Todo tiene un uso si sos creativo ♻️"
          }
        ]
      }
    ]
  },
  {
    id: "avanzado",
    name: "Avanzado",
    description: "Dominá la cocina como un chef profesional",
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-blue-500",
    categories: [
      {
        id: "errores-soluciones",
        name: "Errores y Soluciones",
        icon: AlertTriangle,
        description: "Aprendé a rescatar cualquier plato",
        lessons: [
          {
            id: "errores-principiante",
            title: "Errores que todos cometemos",
            description: "Reconocé y evitá los problemas más comunes",
            tips: [
              "No precalentar suficiente la sartén",
              "Agregar ajo cuando el aceite está muy caliente",
              "No dejar reposar las carnes",
              "Revolver demasiado (no deja dorar)",
              "No probar mientras cocinás",
              "Agregar todos los ingredientes juntos"
            ],
            marcelaMessage: "Los errores son nuestros mejores maestros. ¡Yo también los cometí! 📚"
          },
          {
            id: "rescatar-platos",
            title: "Rescatar platos arruinados",
            description: "Soluciones para emergencias culinarias",
            tips: [
              "Muy salado: agregá papa, arroz o un poco de azúcar",
              "Muy picante: agregá lácteos, azúcar o grasa",
              "Muy ácido: agregá azúcar o bicarbonato (poquito)",
              "Muy dulce: agregá ácido (limón/vinagre) o sal",
              "Quemado: pasá a olla limpia SIN raspar el fondo",
              "Salsa cortada: batí con hielo o más líquido frío"
            ],
            marcelaMessage: "Siempre hay forma de salvar un plato. ¡No lo tires antes de intentar! 🆘"
          },
          {
            id: "textura-problemas",
            title: "Problemas de textura",
            description: "Cuando algo sale raro",
            tips: [
              "Salsa grumosa: licuala o pasala por colador",
              "Arroz pegado: enjuagá con agua caliente y escurrí",
              "Carne dura: braseala en líquido 2+ horas",
              "Puré aguado: cocinalo más para evaporar agua",
              "Masa dura: es por amasar demasiado, ¡menos es más!"
            ],
            marcelaMessage: "La textura importa tanto como el sabor. ¡Prestale atención! 🎯"
          }
        ]
      },
      {
        id: "tecnicas-chef",
        name: "Técnicas de Chef",
        icon: GraduationCap,
        description: "Lo que aprenden en las escuelas de cocina",
        lessons: [
          {
            id: "emulsiones",
            title: "Emulsiones perfectas",
            description: "Mayonesa, vinagretas estables y más",
            tips: [
              "Todos los ingredientes a temperatura ambiente",
              "Agregá el aceite MUY lentamente al principio",
              "Batí constantemente sin parar",
              "La yema y la mostaza son emulsificantes naturales",
              "Si se corta, empezá con nueva yema y agregá la cortada de a poco"
            ],
            steps: [
              "Empezá con la fase acuosa (yema, mostaza, vinagre)",
              "Batí hasta que esté espumoso",
              "Agregá aceite gota a gota al principio",
              "Cuando empiece a espesar, podés agregar en hilo fino",
              "Sazoná al final"
            ],
            marcelaMessage: "Las emulsiones son química deliciosa. Paciencia y temperatura son todo 🧪"
          },
          {
            id: "reducir-salsas",
            title: "Reducir salsas como un pro",
            description: "Concentrar sabores al máximo",
            tips: [
              "Fuego medio-bajo para control",
              "Mové ocasionalmente para evitar que se pegue",
              "La salsa espesa al enfriar - sacala antes del punto final",
              "Reducir a la mitad = duplicar el sabor",
              "Una cucharada de manteca al final = brillo y sedosidad"
            ],
            marcelaMessage: "Paciencia y fuego lento = sabor intenso. ¡No hay atajos! ⏰"
          },
          {
            id: "confitar",
            title: "Confitar en grasa",
            description: "Cocción lenta en aceite o grasa",
            tips: [
              "Temperatura: 80-90°C, muy por debajo de fritura",
              "El ingrediente debe estar sumergido completamente",
              "Ajo confitado: dulce y untable en 45 min",
              "Tomates confitados: intensos y caramelizados en 2h",
              "Podés reusar la grasa aromática"
            ],
            marcelaMessage: "Confitar transforma lo simple en extraordinario. ¡Es magia lenta! ✨"
          },
          {
            id: "sous-vide-casero",
            title: "Sous vide casero",
            description: "Cocción de precisión sin equipo caro",
            tips: [
              "Usá una olla grande y termómetro digital",
              "Bolsas de cierre hermético funcionan (sacá el aire)",
              "Mantené la temperatura constante ajustando el fuego",
              "Sellá después para la costra",
              "Es ideal para carnes y huevos"
            ],
            marcelaMessage: "No necesitás equipos caros para cocinar como un pro 🎓"
          }
        ]
      },
      {
        id: "masas-panes",
        name: "Masas y Panes",
        icon: Cookie,
        description: "El arte de la panificación casera",
        lessons: [
          {
            id: "pan-casero",
            title: "Pan casero básico",
            description: "Nada como el olor a pan recién horneado",
            tips: [
              "La levadura necesita azúcar para activarse",
              "El agua tibia (37°C) - si quema el dedo, está muy caliente",
              "Amasá mínimo 10 minutos hasta que esté elástico",
              "Dejá levar en lugar tibio, tapado, 1-2 horas",
              "Golpeá la base del pan: si suena hueco, está listo"
            ],
            marcelaMessage: "Hacer pan es terapéutico. ¡Y el olor de la casa no tiene precio! 🍞"
          },
          {
            id: "masa-pizza",
            title: "Masa de pizza perfecta",
            description: "Crocante afuera, tierna adentro",
            tips: [
              "Más agua = más crujiente",
              "Dejá levar mínimo 24 horas en heladera (idealmente 72h)",
              "Estirar a mano, no con palote",
              "El horno lo más caliente posible (250°C+)",
              "Precalentá la piedra o bandeja"
            ],
            marcelaMessage: "La mejor pizza necesita tiempo. ¡Planificá con 1-3 días de anticipación! 🍕"
          },
          {
            id: "masa-tarta",
            title: "Masa quebrada (brisée)",
            description: "Base de tartas dulces y saladas",
            tips: [
              "Manteca FRÍA cortada en cubos",
              "No amases demasiado - tiene que quedar arenosa",
              "Descanso en heladera 30 min mínimo",
              "Pinchá el fondo con tenedor antes de hornear",
              "Para hornear vacía: poné porotos secos encima"
            ],
            marcelaMessage: "La masa quebrada perfecta es crocante y se deshace. ¡Manteca fría es el secreto! 🥧"
          }
        ]
      },
      {
        id: "postres",
        name: "Postres y Pastelería",
        icon: IceCream,
        description: "Finales dulces que impresionan",
        lessons: [
          {
            id: "crema-pastelera",
            title: "Crema pastelera",
            description: "La base de infinitos postres",
            tips: [
              "Batí las yemas con azúcar hasta que blanqueen",
              "Agregá la leche caliente de a poco batiendo",
              "Cociná sin dejar de mover hasta que hierva",
              "Pasá por colador y cubrí con film al contacto",
              "Enfriá rápido para evitar nata"
            ],
            marcelaMessage: "Con buena crema pastelera hacés mil postres. ¡Dominala! 🍮"
          },
          {
            id: "merengue",
            title: "Merengue perfecto",
            description: "Blanco, brillante y estable",
            tips: [
              "Los utensilios deben estar impecables y secos",
              "Las claras a temperatura ambiente montan mejor",
              "Agregá el azúcar de a poco, batiendo siempre",
              "Picos firmes = está listo",
              "No sobrebatas - se separa el agua"
            ],
            marcelaMessage: "El merengue perfecto es como nubes comestibles ☁️"
          },
          {
            id: "chocolate",
            title: "Trabajar con chocolate",
            description: "Derretir, templar y brillar",
            tips: [
              "Derretí a baño maría, sin que toque el agua",
              "El agua es el enemigo - ni una gota",
              "Temperado: derretir, enfriar, calentar ligeramente",
              "El chocolate blanco se quema más fácil",
              "Guardá en lugar fresco y seco, no heladera"
            ],
            marcelaMessage: "El chocolate es delicado pero el resultado vale cada esfuerzo 🍫"
          },
          {
            id: "caramelo",
            title: "Caramelo sin miedo",
            description: "El azúcar transformado en oro",
            tips: [
              "No revuelvas - solo movés la olla",
              "Tené agua fría cerca por si te quemás",
              "El color te dice el punto: dorado claro a oscuro",
              "Sacalo del fuego antes del color deseado - sigue cocinando",
              "Para limpiarlo: llená la olla de agua y herví"
            ],
            marcelaMessage: "El caramelo requiere respeto y atención. ¡Pero es magia pura! 🔶"
          }
        ]
      },
      {
        id: "presentacion",
        name: "Presentación",
        icon: Sparkles,
        description: "Comemos primero con los ojos",
        lessons: [
          {
            id: "emplatado",
            title: "Emplatado básico",
            description: "Platos que parecen de restaurante",
            tips: [
              "Menos es más - no sobrecargues el plato",
              "Números impares son más atractivos (3 o 5 elementos)",
              "Colores que contrasten",
              "Limpiá los bordes del plato antes de servir",
              "La altura agrega interés visual"
            ],
            marcelaMessage: "Un plato lindo se disfruta más. ¡Tomate 2 minutos para presentar! 🎨"
          },
          {
            id: "guarniciones",
            title: "Guarniciones que complementan",
            description: "El acompañamiento perfecto",
            tips: [
              "Debe complementar, no competir con el principal",
              "Variá texturas: algo crujiente con algo cremoso",
              "Los colores vibrantes alegran el plato",
              "Las guarniciones también necesitan sazonarse",
              "Pensá en el balance nutricional"
            ],
            marcelaMessage: "Una buena guarnición eleva todo el plato. ¡No la subestimes! 🥗"
          }
        ]
      },
      {
        id: "cocina-saludable",
        name: "Cocina Saludable",
        icon: Heart,
        description: "Rico y nutritivo es posible",
        lessons: [
          {
            id: "sustituir-ingredientes",
            title: "Sustituciones saludables",
            description: "Pequeños cambios, grandes beneficios",
            tips: [
              "Yogur griego en lugar de crema",
              "Caldo en lugar de aceite para saltear",
              "Puré de banana o manzana en lugar de azúcar en postres",
              "Arroz integral o quinoa en lugar de blanco",
              "Leche de almendras en lugar de crema"
            ],
            marcelaMessage: "Comer sano no es aburrido. ¡Es cuestión de creatividad! 💚"
          },
          {
            id: "porciones",
            title: "Control de porciones",
            description: "Cuánto comer sin privarte",
            tips: [
              "Usá platos más chicos - parece más comida",
              "La porción de proteína: del tamaño de tu palma",
              "Carbohidratos: del tamaño de tu puño",
              "Verduras: todo lo que quieras",
              "Comé despacio - el cerebro tarda 20 min en registrar saciedad"
            ],
            marcelaMessage: "No se trata de comer menos, sino de comer inteligente 🧠"
          },
          {
            id: "batch-cooking",
            title: "Batch cooking semanal",
            description: "Prepará todo el domingo, comé bien toda la semana",
            tips: [
              "Cociná bases: arroz, legumbres, verduras asadas",
              "Prepará proteínas para varios días",
              "Los aderezos duran 1 semana en heladera",
              "Guardá en porciones individuales",
              "Etiquetá con fecha todo"
            ],
            marcelaMessage: "2-3 horas el domingo = semana de comida casera sin esfuerzo 📅"
          }
        ]
      },
      {
        id: "fermentacion",
        name: "Fermentación",
        icon: Timer,
        description: "El arte ancestral de conservar y potenciar sabores",
        lessons: [
          {
            id: "fermentos-basicos",
            title: "Fermentos básicos",
            description: "Pickles, chucrut y más",
            tips: [
              "Limpieza absoluta de frascos y utensilios",
              "La sal inhibe bacterias malas y promueve las buenas",
              "Los vegetales deben estar sumergidos en líquido",
              "Temperatura ambiente constante, lejos de la luz",
              "Probá cada día hasta lograr el sabor deseado"
            ],
            marcelaMessage: "La fermentación es como tener mascotas microscópicas que cocinan para vos 🦠"
          },
          {
            id: "masa-madre",
            title: "Masa madre",
            description: "El fermento para pan artesanal",
            tips: [
              "Empezá con harina integral, tiene más levaduras naturales",
              "Alimentala todos los días: igual parte de harina y agua",
              "Cuando duplique su tamaño en 4-6h, está lista",
              "El descarte sirve para pancakes, galletitas, crackers",
              "Podés guardarla en heladera y alimentar 1 vez por semana"
            ],
            marcelaMessage: "La masa madre tiene personalidad propia. ¡Conocé a tu nueva amiga! 🥖"
          }
        ]
      }
    ]
  },
  {
    id: "especialidades",
    name: "Especialidades",
    description: "Postres, cocina del mundo, saludable y técnicas avanzadas",
    color: "bg-pink-500",
    gradient: "from-pink-500 to-rose-500",
    categories: [
      {
        id: "reposteria-avanzada",
        name: "Repostería & Postres",
        icon: IceCream,
        description: "Tortas, budines, cookies y mucho más",
        lessons: [
          {
            id: "bizcochuelo-perfecto",
            title: "Bizcochuelo perfecto",
            description: "La base de todas las tortas",
            tips: [
              "Los huevos y la manteca deben estar a temperatura ambiente",
              "Batí huevos y azúcar hasta triplicar el volumen (10 min)",
              "Tamizá la harina para evitar grumos",
              "Incorporá la harina con movimientos envolventes, no batiendo",
              "No abras el horno antes de los 25 min",
              "Pinchá con palillo: si sale limpio, está listo"
            ],
            steps: [
              "Precalentá horno a 180°C y enmantecá el molde",
              "Batí huevos + azúcar hasta que esté espumoso y pálido",
              "Incorporá manteca derretida (fría) en hilo",
              "Sumá harina tamizada con movimientos suaves",
              "Volcá en molde y horneá 30-35 min sin abrir el horno"
            ],
            marcelaMessage: "Un buen bizcochuelo aireado es el secreto de toda torta espectacular 🎂",
            funFact: "El secreto del bizcochuelo esponjoso es el aire atrapado al batir los huevos"
          },
          {
            id: "cookies-crunchy",
            title: "Cookies crujientes por fuera, tiernas por dentro",
            description: "El balance perfecto en cada mordida",
            tips: [
              "Manteca pomada (no derretida) para cookies más gruesas",
              "Más yema = más masticable, más clara = más crujiente",
              "Azúcar negra da humedad y sabor acaramelado",
              "Enfriá la masa 1 hora en heladera antes de hornear",
              "Sacalas del horno cuando parezcan 'poco hechas' - terminan en la bandeja"
            ],
            marcelaMessage: "La cookie perfecta requiere paciencia, pero el resultado lo vale 🍪",
            funFact: "Las cookies se inventaron como 'tazas de pastel de prueba' para verificar la temperatura del horno"
          },
          {
            id: "mousse-chocolate",
            title: "Mousse de chocolate",
            description: "Aireado, intenso y sin horno",
            tips: [
              "Usá chocolate con 60-70% de cacao para sabor intenso",
              "Las claras deben estar impecablemente limpias para montar",
              "Incorporá las claras en 2-3 tandas para no perder aire",
              "Enfriá mínimo 4 horas en heladera",
              "El toque de sal potencia el chocolate"
            ],
            steps: [
              "Derretí el chocolate a baño maría y dejá enfriar",
              "Batí las claras a nieve con una pizca de sal",
              "Montá la crema de leche a picos suaves",
              "Mezclá chocolate con crema, luego incorporá claras",
              "Distribuí en copas y refrigerá 4+ horas"
            ],
            marcelaMessage: "La mousse de chocolate es elegancia pura con pocos ingredientes 🍫"
          },
          {
            id: "cheesecake-cremoso",
            title: "Cheesecake cremoso sin horno",
            description: "Suave, firme y delicioso",
            tips: [
              "Cream cheese a temperatura ambiente para evitar grumos",
              "La gelatina sin sabor asegura que corte perfecto",
              "La base de galletitas necesita descansar en heladera",
              "No desmoldes apurado: mínimo 6 horas de frío",
              "Para cortes limpios: cuchillo caliente y seco"
            ],
            marcelaMessage: "Sin horno, sin estrés. ¡Este cheesecake impresiona a todos! 🍰"
          },
          {
            id: "budines-rapidos",
            title: "Budines rápidos y variados",
            description: "Merienda lista en 40 minutos",
            tips: [
              "Los ingredientes húmedos + secos: mezclá por separado antes de unir",
              "No sobrebatas: unos pocos grumos están bien",
              "El banano maduro es mejor endulzante y humectante natural",
              "Cubrí con aluminio si se dora demasiado arriba",
              "Enfriá en rejilla para evitar que se humedezca la base"
            ],
            marcelaMessage: "Un buen budín convierte ingredientes simples en algo especial 🫐"
          }
        ]
      },
      {
        id: "cocina-mundo",
        name: "Cocina del Mundo",
        icon: Globe,
        description: "Viajá sin salir de la cocina",
        lessons: [
          {
            id: "cocina-italiana",
            title: "Italia en tu cocina",
            description: "Pastas frescas, risotto y más",
            tips: [
              "Pasta fresca: 100g de harina + 1 huevo por persona",
              "Risotto: agregá el caldo caliente de a cucharones",
              "Soffritto (cebolla, zanahoria, apio) es la base italiana",
              "El queso parmesano se agrega fuera del fuego",
              "La pasta se termina de cocinar EN la salsa"
            ],
            steps: [
              "Hacé la pasta: harina en volcán, huevos en el centro",
              "Amasá 10 min hasta que esté lisa y elástica",
              "Cubrí y descansá 30 min",
              "Estirá finísima y cortá como quieras",
              "Cociná 2-3 min en agua con mucha sal"
            ],
            marcelaMessage: "La cocina italiana es simplicidad y calidad de ingredientes. ¡Menos es más! 🍝",
            funFact: "En Italia hay más de 350 formas diferentes de pasta, cada una diseñada para un tipo de salsa"
          },
          {
            id: "cocina-asiatica",
            title: "Asia Wok & Sabores",
            description: "Salteados, arroces y salsas asiáticas",
            tips: [
              "El wok debe estar bien caliente (casi rojo) antes de cocinar",
              "Salsa de soja, jengibre y ajo = base de casi todo",
              "El aceite de sésamo se agrega SIEMPRE al final",
              "El arroz asiático se lava hasta que el agua salga clara",
              "La salsa de ostras da profundidad sin ser pescado"
            ],
            marcelaMessage: "La cocina asiática es fuego alto, rapidez y sabores intensos. ¡Dominá el wok! 🥢"
          },
          {
            id: "cocina-mexicana",
            title: "México: especias y color",
            description: "Tacos, guacamole y salsas vibrantes",
            tips: [
              "El aguacate para guacamole debe estar muy maduro",
              "Los chiles secos se tuestan y rehidratan antes de usar",
              "El sofrito mexicano lleva tomate, cebolla y ajo asados",
              "Las tortillas de maíz se calientan directo sobre la llama",
              "El limón es imprescindible para terminar casi todos los platos"
            ],
            marcelaMessage: "La cocina mexicana es pura alma y color. ¡Cada bocado cuenta una historia! 🌮"
          },
          {
            id: "cocina-francesa",
            title: "Francia: técnica y elegancia",
            description: "Las bases de la cocina clásica",
            tips: [
              "Las salsas madre francesas son la base de todo (bechamel, velouté, espagnole)",
              "Beurre blanc: reducción de vino + crema + manteca fría en cubos",
              "El roux (harina + manteca) espesa sin grumos si se hace bien",
              "Brunoise: corte en cubos de 2mm - requiere precisión",
              "La manteca clarificada tiene mayor punto de humo"
            ],
            marcelaMessage: "Francia nos enseñó las técnicas que usa el mundo. ¡Valen la pena aprenderse! 🥐"
          },
          {
            id: "cocina-mediterranea",
            title: "Mediterráneo: salud y sabor",
            description: "Hummus, falafel, tabbouleh y más",
            tips: [
              "El aceite de oliva extra virgen es protagonista, no actor de reparto",
              "Las legumbres remojadas 12h reducen tiempo de cocción a la mitad",
              "El sumac da acidez sin líquido - ideal para aderezar",
              "Las hierbas frescas en cantidad, no como decoración",
              "El yogur griego espeso funciona como salsa, dip y postre"
            ],
            marcelaMessage: "La dieta mediterránea es la más saludable y la más sabrosa del mundo 🫒"
          }
        ]
      },
      {
        id: "cocina-fit",
        name: "Cocina Fit & Saludable",
        icon: Dumbbell,
        description: "Rico, nutritivo y sin culpa",
        lessons: [
          {
            id: "proteinas-magras",
            title: "Proteínas magras bien cocinadas",
            description: "Pechuga, pescado y legumbres sin aburrirse",
            tips: [
              "Marinado de 2-24h transforma cualquier proteína magra",
              "La pechuga se seca por sobrecocción: termómetro al centro (74°C)",
              "El pescado al limón + papel aluminio queda jugoso sin grasa",
              "Las legumbres combinadas con arroz forman proteína completa",
              "El tofu presado y marinado absorbe todos los sabores"
            ],
            marcelaMessage: "La proteína no tiene que ser aburrida. ¡Con marinado y técnica es deliciosa! 💪"
          },
          {
            id: "bowls-nutritivos",
            title: "Bowls nutritivos y coloridos",
            description: "El armado perfecto para comer completo",
            tips: [
              "Base (granos): arroz, quinoa, batata, coliflor triturado",
              "Proteína: pollo, huevo, garbanzos, tofu, atún",
              "Verduras crudas y cocidas: para variedad de texturas",
              "Grasa buena: palta, semillas, aceite de oliva",
              "Aderezo ácido al final para unificar todos los sabores"
            ],
            marcelaMessage: "Un buen bowl es nutrición y arte en el mismo plato 🥗"
          },
          {
            id: "snacks-saludables",
            title: "Snacks saludables DIY",
            description: "Opciones caseras para picar sin culpa",
            tips: [
              "Hummus casero: garbanzos + tahini + limón + ajo + aceite",
              "Chips de batata al horno con páprika y aceite de oliva",
              "Bolitas de avena, banana y miel sin horno en 10 min",
              "Palitos de apio y zanahoria con dips de yogur condimentado",
              "Granola casera: avena + miel + frutos secos al horno"
            ],
            marcelaMessage: "Si tenés buenos snacks en casa, no caés en lo procesado. ¡Preparalos el domingo! 🥕"
          },
          {
            id: "jugos-smoothies",
            title: "Jugos y smoothies nutritivos",
            description: "Licuados que nutren de verdad",
            tips: [
              "Smoothie base: frutas congeladas + líquido + proteína",
              "El verde sin que sepa a pasto: espinaca + banana + mango",
              "La avena da cremosidad y fibra sin sabor fuerte",
              "Jengibre fresco en licuado mejora digestión",
              "Sin azúcar: el dulzor viene de las frutas"
            ],
            marcelaMessage: "Un smoothie equilibrado reemplaza un desayuno completo. ¡Sin azúcar agregada! 🥤"
          },
          {
            id: "cocina-plant-based",
            title: "Cocina plant-based",
            description: "Comer vegetal sin sacrificar sabor",
            tips: [
              "Levadura nutricional = sabor a queso sin lácteos",
              "Leche de coco cocida reduce y espesa como crema",
              "Los champiñones dan textura y umami como la carne",
              "Anacardos remojados licuados = crema vegetal perfecta",
              "El miso en salsas da profundidad y fermentación natural"
            ],
            marcelaMessage: "La cocina plant-based no es renuncia, es descubrimiento de nuevos sabores 🌱"
          }
        ]
      },
      {
        id: "tecnicas-pro",
        name: "Técnicas Pro",
        icon: GraduationCap,
        description: "Elevá tu cocina al siguiente nivel",
        lessons: [
          {
            id: "esferificacion-basica",
            title: "Esferificación básica",
            description: "Cocina molecular para impresionar",
            tips: [
              "Alginato de sodio + líquido = base de la esfera",
              "Cloruro de calcio + agua = baño de gelificación",
              "Las esferas se forman al instante - sacalas rápido",
              "Enjuagá con agua limpia para detener la reacción",
              "Funciona con jugos, caldos, aceites saborizados"
            ],
            marcelaMessage: "La cocina molecular parece magia pero es pura ciencia. ¡Impresioná con esto! 🔮"
          },
          {
            id: "ahumado-casero",
            title: "Ahumado casero",
            description: "Sabor profundo sin ahumador profesional",
            tips: [
              "Astillas de madera de manzano, roble o nogal americano",
              "Wok con tapa + rejilla + astillas = ahumador casero",
              "Carne y pescado se ahúman en frío (bajo 25°C) o caliente",
              "Sal ahumada: sal gruesa + 20 min de humo = sal gourmet",
              "El tiempo de ahumado varía: pescado 20 min, cerdo 2-4h"
            ],
            marcelaMessage: "El humo es el condimento más primitivo y más sofisticado a la vez 🔥"
          },
          {
            id: "gelificantes",
            title: "Gelificantes naturales",
            description: "Agar, gelatina y pectina",
            tips: [
              "Agar agar: vegetal, gelifica más firme que gelatina, soporta calor",
              "Gelatina: animal, más suave y elástica",
              "Pectina: de frutas, ideal para jaleas y mermeladas",
              "El agar funciona en caliente, la gelatina solo en frío",
              "1g de agar por 100ml de líquido para textura media"
            ],
            marcelaMessage: "Dominar los gelificantes abre un mundo de texturas y presentaciones 🧊"
          },
          {
            id: "fermentacion-avanzada",
            title: "Kimchi y fermentos asiáticos",
            description: "El fermento más conocido del mundo",
            tips: [
              "Col napa + gochugaru (ají coreano) + ajo + jengibre + daikon",
              "El sal seca la col y crea el ambiente correcto",
              "Fermenta 1-5 días a temperatura ambiente",
              "El gas producido es señal de que funciona - abrí el frasco a diario",
              "El kimchi maduro (2+ semanas) se usa para cocinar"
            ],
            marcelaMessage: "El kimchi es probiótico, delicioso y lleva fermento de siglos. ¡Vale la pena! 🥬"
          },
          {
            id: "caldo-base",
            title: "Caldos base perfectos",
            description: "El alma invisible de los mejores platos",
            tips: [
              "Caldo claro: partí en agua fría para extraer proteínas lentamente",
              "Caldo oscuro (fondo): asá los huesos antes de hervir",
              "Mínimo 4h para caldo de res, 2h para pollo, 45min para pescado",
              "El skimming (espumar) da un caldo cristalino",
              "Congelá en cubiteras para tener porciones listas"
            ],
            marcelaMessage: "Un buen caldo casero eleva cualquier plato. ¡Es el secreto de los chefs! 🍲"
          }
        ]
      }
    ]
  }
];



interface LearnSectionProps {
  onNavigateToCooking?: () => void;
  onNavigateToGame?: () => void;
  onSubTabChange?: (subTab: string) => void;
}

export const LearnSection = ({ onNavigateToCooking, onNavigateToGame, onSubTabChange }: LearnSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { play } = useSound();
  const { canUseFeature, isTrialActive, trialDaysRemaining, isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const learnBlocked = !canUseFeature('learn');
  const [activeSubMenu, setActiveSubMenu] = useState<"aprender" | "guia">("aprender");
  const [activeLevel, setActiveLevel] = useState("principiante");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Load user progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_learning_progress')
          .select('level, category, lesson_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (error) throw error;

        const completed = new Set<string>();
        data?.forEach(item => {
          completed.add(`${item.level}-${item.category}-${item.lesson_id}`);
        });
        setCompletedLessons(completed);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const markLessonComplete = async (level: string, category: string, lessonId: string) => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar tu progreso",
        variant: "destructive"
      });
      return;
    }

    const key = `${level}-${category}-${lessonId}`;
    if (completedLessons.has(key)) return;

    try {
      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          level,
          category,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,level,category,lesson_id'
        });

      if (error) throw error;

      // Play completion sound
      play('chime');

      const newCompleted = new Set([...completedLessons, key]);
      setCompletedLessons(newCompleted);
      
      // Check if 100% complete
      let totalLessons = 0;
      learningContent.forEach(lvl => {
        lvl.categories.forEach(cat => {
          cat.lessons.forEach(() => totalLessons++);
        });
      });
      
      const newProgress = Math.round((newCompleted.size / totalLessons) * 100);
      
      if (newProgress === 100) {
        // Trigger confetti celebration
        play('success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        toast({
          title: "🎉 ¡Felicitaciones!",
          description: "¡Completaste todas las lecciones! Sos un chef experto"
        });
      } else {
        toast({
          title: "¡Lección completada!",
          description: "Tu progreso ha sido guardado ✨"
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive"
      });
    }
  };

  const getLevelProgress = (levelId: string) => {
    const level = learningContent.find(l => l.id === levelId);
    if (!level) return 0;

    let total = 0;
    let completed = 0;

    level.categories.forEach(cat => {
      cat.lessons.forEach(lesson => {
        total++;
        if (completedLessons.has(`${levelId}-${cat.id}-${lesson.id}`)) {
          completed++;
        }
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCategoryProgress = (levelId: string, categoryId: string) => {
    const level = learningContent.find(l => l.id === levelId);
    const category = level?.categories.find(c => c.id === categoryId);
    if (!category) return { completed: 0, total: 0 };

    let completed = 0;
    category.lessons.forEach(lesson => {
      if (completedLessons.has(`${levelId}-${categoryId}-${lesson.id}`)) {
        completed++;
      }
    });

    return { completed, total: category.lessons.length };
  };

  const getTotalStats = () => {
    let totalLessons = 0;
    let completedLessonsCount = 0;
    let totalCategories = 0;
    
    learningContent.forEach(level => {
      level.categories.forEach(cat => {
        totalCategories++;
        cat.lessons.forEach(lesson => {
          totalLessons++;
          if (completedLessons.has(`${level.id}-${cat.id}-${lesson.id}`)) {
            completedLessonsCount++;
          }
        });
      });
    });

    return { totalLessons, completedLessonsCount, totalCategories };
  };

  const currentLevel = learningContent.find(l => l.id === activeLevel);
  const stats = getTotalStats();
  const actualProgress = stats.totalLessons > 0 ? (stats.completedLessonsCount / stats.totalLessons) * 100 : 0;

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(actualProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [actualProgress]);

  // Lesson Detail View
  if (activeLesson && activeCategory) {
    const isCompleted = completedLessons.has(`${activeLevel}-${activeCategory}-${activeLesson.id}`);
    
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => setActiveLesson(null)}
          className="mb-2"
        >
          {t("learnBack")}
        </Button>

        <Card className="border-2 border-primary/20 overflow-hidden">
          <div className={cn(
            "h-2 bg-gradient-to-r",
            currentLevel?.gradient
          )} />
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {activeLesson.title}
                </CardTitle>
                <p className="text-muted-foreground">{activeLesson.description}</p>
              </div>
                {isCompleted && (
                  <Badge className="bg-emerald-500 shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("learnCompleted")}
                  </Badge>
                )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps if available */}
            {activeLesson.steps && activeLesson.steps.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  {t("learnStepByStep")}
                </h3>
                <ol className="space-y-2 list-decimal list-inside">
                  {activeLesson.steps.map((step, index) => (
                    <li key={index} className="text-sm leading-relaxed pl-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                {t("learnImportantTips")}
              </h3>
              <ul className="space-y-2">
                {activeLesson.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fun Fact */}
            {activeLesson.funFact && (
              <Card className="bg-muted/50 border-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-amber-600 dark:text-amber-400">{t("learnDidYouKnow")}</p>
                      <p className="text-sm mt-1">{activeLesson.funFact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marcela Message */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-primary">Marcela dice:</p>
                    <p className="text-sm mt-1">{activeLesson.marcelaMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {!isCompleted && (
                <Button
                  onClick={() => markLessonComplete(activeLevel, activeCategory, activeLesson.id)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como completado
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Banner Image with overlay */}
      <div className="relative w-full h-32 md:h-40 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={learnBanner} 
          alt="Aprender a cocinar" 
          className="w-full h-full object-cover transition-all duration-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
          <div className="px-5">
            <h3 className="text-white font-bold text-xl drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Aprender</h3>
            <p className="text-white text-sm drop-shadow-md" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Dominá la cocina con Marcela</p>
          </div>
        </div>
      </div>

      {/* Submenu Tabs */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-2xl p-1.5 border border-border/50">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setActiveSubMenu("aprender");
              onSubTabChange?.("aprender");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium transition-all duration-300",
              activeSubMenu === "aprender"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "bg-background/60 hover:bg-background text-foreground"
            )}
          >
            <BookOpen className={cn("w-6 h-6", activeSubMenu === "aprender" && "animate-bounce")} />
            <span className="text-xs">Aprender</span>
          </button>
          <button
            onClick={() => {
              setActiveSubMenu("guia");
              onSubTabChange?.("guia");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium transition-all duration-300",
              activeSubMenu === "guia"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "bg-background/60 hover:bg-background text-foreground"
            )}
          >
            <div className="relative">
              <Lightbulb className={cn("w-6 h-6", activeSubMenu === "guia" && "animate-pulse")} />
              {learnBlocked && (
                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-500" />
              )}
            </div>
            <span className="text-xs">Guía de Alimentos</span>
          </button>
        </div>
      </div>

      {/* Aprender a Cocinar Content */}
      {activeSubMenu === "aprender" && (
        <div className="space-y-6 animate-fade-in relative">

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Overall Stats */}
      <Card className="bg-gradient-to-r from-primary/5 to-amber-500/5 border-primary/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.completedLessonsCount}</p>
              <p className="text-xs text-muted-foreground">Lecciones completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{stats.totalLessons}</p>
              <p className="text-xs text-muted-foreground">Lecciones totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">{stats.totalCategories}</p>
              <p className="text-xs text-muted-foreground">Categorías</p>
            </div>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="relative mt-4">
            <Progress 
              value={animatedProgress} 
              className="h-3 transition-all duration-1000 ease-out" 
            />
            {animatedProgress === 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-yellow-400/30 to-emerald-400/20 animate-pulse rounded-full" />
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground">
              {Math.round(animatedProgress)}% completado
            </p>
            {animatedProgress === 100 && (
              <span className="text-xs animate-bounce">🎉</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Level Tabs */}
      <Tabs value={activeLevel} onValueChange={setActiveLevel} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          {learningContent.map(level => (
            <TabsTrigger
              key={level.id}
              value={level.id}
              className="relative py-3 data-[state=active]:bg-background"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 font-medium">
                  {level.name}
                  {getLevelProgress(level.id) === 100 && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getLevelProgress(level.id)}%
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {learningContent.map(level => (
          <TabsContent key={level.id} value={level.id} className="mt-6 space-y-6">
            {/* Level Header */}
            <Card className={cn(
              "border-0 bg-gradient-to-r text-white",
              level.gradient
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{level.name}</h3>
                    <p className="text-sm text-white/80">{level.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{getLevelProgress(level.id)}%</p>
                    <p className="text-xs text-white/80">completado</p>
                  </div>
                </div>
                <Progress 
                  value={getLevelProgress(level.id)} 
                  className="h-2 mt-3 bg-white/20" 
                />
              </CardContent>
            </Card>

            {/* Categories Accordion */}
            <Accordion 
              type="single" 
              collapsible 
              className="space-y-3"
              value={activeCategory || undefined}
              onValueChange={(val) => setActiveCategory(val || null)}
            >
              {level.categories.map(category => {
                const progress = getCategoryProgress(level.id, category.id);
                const Icon = category.icon;
                const isComplete = progress.completed === progress.total;
                
                return (
                  <AccordionItem 
                    key={category.id} 
                    value={category.id}
                    className="border rounded-xl overflow-hidden bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          level.color
                        )}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{category.name}</span>
                            {isComplete && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 mr-2">
                          {progress.completed}/{progress.total}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 pt-2">
                        {category.lessons.map((lesson, index) => {
                          const isLessonCompleted = completedLessons.has(
                            `${level.id}-${category.id}-${lesson.id}`
                          );
                          
                          return (
                            <Button
                              key={lesson.id}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-muted"
                              onClick={() => setActiveLesson(lesson)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                  isLessonCompleted 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {isLessonCompleted ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "font-medium truncate",
                                    isLessonCompleted && "text-muted-foreground"
                                  )}>
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lesson.description}
                                  </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>


      {/* Motivational Footer */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground italic">
          "La cocina es un arte que se aprende practicando. ¡Cada error te acerca más a la maestría!" - Marcela
        </p>
      </div>
        </div>
      )}

      {/* Guía de Alimentos Content */}
      {activeSubMenu === "guia" && (
        <>
          {learnBlocked && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tu prueba gratuita terminó</p>
                <p className="text-xs text-muted-foreground">La Guía de Alimentos es de solo lectura. Desbloqueá con Premium.</p>
              </div>
              <Button size="sm" onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                Premium
              </Button>
            </div>
          )}
          <div className={cn(learnBlocked && "opacity-60 pointer-events-none")}>
            <FoodStorageGuide />
          </div>
        </>
      )}

      {/* Trial info */}
      {!isPremium && isTrialActive && (
        <div className="text-center py-2">
          <span className="text-xs text-muted-foreground">
            🎁 Prueba gratuita: {trialDaysRemaining} días restantes
          </span>
        </div>
      )}

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  );
};
