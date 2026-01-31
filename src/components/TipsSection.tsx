import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChefHat,
  Flame,
  Utensils,
  ThermometerSun,
  Timer,
  Refrigerator,
  Coins,
  Clock,
  Star,
  Droplets,
  Zap,
  Recycle,
  Sparkles,
  Leaf,
  Apple,
  Scale,
  Shield,
  Heart,
  Egg,
  Fish,
  Beef,
  Wheat,
  Cookie,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface TipsSectionProps {
  onNavigateToCooking: () => void;
}

interface TipCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  tips: {
    title: string;
    description: string;
  }[];
}

const tipsCategories: TipCategory[] = [
  {
    id: "cortes",
    name: "Cortes",
    icon: Utensils,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    tips: [
      { title: "Juliana", description: "Tiras finas de 5cm x 3mm, ideal para salteados y woks" },
      { title: "Brunoise", description: "Cubitos de 3mm, perfecto para salsas y sofritos" },
      { title: "Chiffonade", description: "Tiras finísimas enrollando hojas verdes" },
      { title: "Mirepoix", description: "Cubos de 1cm para bases de sopas y guisos" },
      { title: "Concassé", description: "Tomate pelado, sin semillas, en cubos pequeños" },
      { title: "Bastones", description: "Tiras de 6cm x 1cm, clásico para papas fritas" },
      { title: "Paisana", description: "Cubos medianos de 1.5cm para ensaladas" },
      { title: "Pluma", description: "Corte diagonal fino, ideal para cebollas en ensaladas" },
      { title: "Macedonia", description: "Cubos de 5mm para frutas y verduras mixtas" },
      { title: "Rodajas", description: "Cortes transversales, espesor según uso" },
    ]
  },
  {
    id: "temperaturas",
    name: "Temperaturas",
    icon: ThermometerSun,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    tips: [
      { title: "Pollo", description: "74°C interno mínimo - nunca menos por seguridad" },
      { title: "Carne jugosa", description: "52-54°C para punto rojo/jugoso perfecto" },
      { title: "Carne a punto", description: "60-63°C para término medio ideal" },
      { title: "Carne cocida", description: "70°C+ para bien cocido sin sangre" },
      { title: "Pescado", description: "63°C - se desmenuza fácil con tenedor" },
      { title: "Cerdo", description: "63-68°C, ya no necesita estar muy cocido" },
      { title: "Horno general", description: "180°C para la mayoría de preparaciones" },
      { title: "Horno dorar", description: "200-220°C para gratinar y dorar" },
      { title: "Fritura", description: "180°C ideal, máximo 190°C" },
      { title: "Caramelo", description: "160-170°C para caramelo claro a oscuro" },
    ]
  },
  {
    id: "conservacion",
    name: "Conservación",
    icon: Refrigerator,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    tips: [
      { title: "Hierbas frescas", description: "En agua como flores, duran hasta 2 semanas" },
      { title: "Verduras de hoja", description: "Envueltas en papel, no lavar hasta usar" },
      { title: "Huevos", description: "Siempre en heladera, duran 3-4 semanas" },
      { title: "Carnes", description: "Freezer hasta 6 meses bien envueltas sin aire" },
      { title: "Pan", description: "Freezer en bolsa, tostar directo sin descongelar" },
      { title: "Quesos duros", description: "Envueltos en papel, no plástico, hasta 1 mes" },
      { title: "Frutas maduras", description: "Separar de las verdes, aceleran maduración" },
      { title: "Tomates", description: "Fuera de la heladera, pierden sabor en frío" },
      { title: "Cebollas y ajos", description: "Lugar fresco y oscuro, no en heladera" },
      { title: "Jengibre", description: "Freezer entero, rallar congelado cuando necesites" },
    ]
  },
  {
    id: "tiempos",
    name: "Tiempos",
    icon: Timer,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    tips: [
      { title: "Pasta al horno", description: "Hervir 2 min menos que el paquete indica" },
      { title: "Arroz blanco", description: "18 min tapado + 5 min reposo sin destapar" },
      { title: "Huevo duro", description: "10 min desde que hierve, luego agua fría" },
      { title: "Huevo pasado", description: "6-7 min desde hervor para yema cremosa" },
      { title: "Verduras al dente", description: "5-7 min en agua hirviendo" },
      { title: "Verduras blandas", description: "12-15 min para puré o sopas" },
      { title: "Legumbres", description: "1-2 horas según tipo, remojar 8h antes" },
      { title: "Pollo entero", description: "20 min por cada 500g a 180°C" },
      { title: "Bizcochuelo", description: "35-40 min a 180°C, palillo sale limpio" },
      { title: "Caramelizar cebolla", description: "30-45 min a fuego bajo con paciencia" },
    ]
  },
  {
    id: "ahorro",
    name: "Ahorro",
    icon: Coins,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    tips: [
      { title: "Caldo casero", description: "Guardá cáscaras y huesos en freezer para caldo" },
      { title: "Pan duro", description: "Pan rallado, crutones o budín de pan gratis" },
      { title: "Menú semanal", description: "Planificar = menos desperdicio y menos compras" },
      { title: "Batch cooking", description: "Cociná una vez, comé toda la semana" },
      { title: "Verduras feas", description: "Perfectas para sopas, nadie nota la forma" },
      { title: "Hojas de remolacha", description: "Comestibles y nutritivas como espinaca" },
      { title: "Tallos de brócoli", description: "Pelados son tan ricos como las flores" },
      { title: "Agua de legumbres", description: "Aquafaba: el agua de garbanzos es merengue vegano" },
      { title: "Comprar de estación", description: "Más barato, más fresco, más sabroso" },
      { title: "Congelar porciones", description: "Evita desperdiciar sobras, solo descongelás lo que usás" },
    ]
  },
  {
    id: "salsas",
    name: "Salsas",
    icon: Droplets,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    tips: [
      { title: "Agua de pasta", description: "Una taza antes de colar, espesa cualquier salsa" },
      { title: "Roux", description: "Partes iguales manteca y harina, base de salsas blancas" },
      { title: "Reducir", description: "Fuego medio sin tapar, concentra sabores" },
      { title: "Montar manteca", description: "Agregar manteca fría al final, brillo y cremosidad" },
      { title: "Salsa de tomate", description: "Cocción larga = menos acidez, agregar zanahoria" },
      { title: "Vinagreta", description: "3 partes aceite, 1 parte vinagre, sal, emulsionar" },
      { title: "Mayonesa casera", description: "Huevo a temperatura ambiente, aceite en hilo fino" },
      { title: "Pesto", description: "No calentar la albahaca, se oxida y amarga" },
      { title: "Salsa BBQ", description: "Agregar café o chocolate, intensifica el sabor" },
      { title: "Chimichurri", description: "Reposo 1 hora mínimo, mejor al día siguiente" },
    ]
  },
  {
    id: "proteinas",
    name: "Proteínas",
    icon: Beef,
    color: "text-rose-500",
    bgColor: "bg-rose-500/20",
    tips: [
      { title: "Carne a temperatura", description: "Sacar 30 min antes de cocinar, cocción pareja" },
      { title: "Secar la carne", description: "Con papel, la humedad impide el dorado" },
      { title: "No pinchar", description: "Pierde jugos, usar pinzas no tenedor" },
      { title: "Descanso", description: "5-10 min tapada antes de cortar, redistribuye jugos" },
      { title: "Cortar a contrafibra", description: "Más tierno, mirá la dirección de las fibras" },
      { title: "Pollo crujiente", description: "Secar bien la piel, no tapar mientras dora" },
      { title: "Pescado sin pegar", description: "Sartén muy caliente, no mover al principio" },
      { title: "Mariscos", description: "Cocción rápida, se ponen gomosos si pasan" },
      { title: "Huevo pochado", description: "Vinagre en agua, remolino suave, 3 min" },
      { title: "Hamburguesa jugosa", description: "80% carne 20% grasa, hueco en el centro" },
    ]
  },
  {
    id: "verduras",
    name: "Verduras",
    icon: Leaf,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    tips: [
      { title: "Verduras verdes", description: "No tapar al hervir, mantienen color brillante" },
      { title: "Blanquear", description: "Hervir 2 min, pasar a agua helada, quedan perfectas" },
      { title: "Asar en seco", description: "Aceite después de asar, absorben menos" },
      { title: "Papas crocantes", description: "Hervir 5 min, secar, sacudir, luego al horno" },
      { title: "Berenjena sin amargo", description: "Salar 30 min, enjuagar, escurrir bien" },
      { title: "Champiñones", description: "No lavar, limpiar con trapo húmedo" },
      { title: "Espárragos", description: "Romper donde se quiebran natural, no cortar" },
      { title: "Palta sin oxidar", description: "Limón o cubrirla con agua, sin aire" },
      { title: "Ajo sin amargo", description: "Sacar el brote verde del centro" },
      { title: "Zapallo", description: "Pinchar y microondas 3 min, más fácil de pelar" },
    ]
  },
  {
    id: "pasteleria",
    name: "Pastelería",
    icon: Cookie,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    tips: [
      { title: "Ingredientes fríos", description: "Manteca fría para masas hojaldradas crujientes" },
      { title: "Ingredientes tibios", description: "Huevos a temperatura para batidos esponjosos" },
      { title: "No amasar de más", description: "Desarrolla gluten, masa dura en vez de tierna" },
      { title: "Pesar, no medir", description: "La balanza es más precisa que tazas" },
      { title: "Tamizar", description: "Harina sin grumos, más aire, mejor textura" },
      { title: "Movimientos envolventes", description: "De abajo hacia arriba, no pierdas el aire" },
      { title: "Horno precalentado", description: "Al menos 15 min antes, temperatura real" },
      { title: "No abrir el horno", description: "Los primeros 20 min son críticos" },
      { title: "Merengue perfecto", description: "Bowl y batidores sin grasa, agregar azúcar despacio" },
      { title: "Chocolate templado", description: "Derretir 2/3, agregar 1/3 picado, mezclar hasta fundir" },
    ]
  },
  {
    id: "cafe",
    name: "Bebidas",
    icon: Coffee,
    color: "text-amber-700",
    bgColor: "bg-amber-700/20",
    tips: [
      { title: "Café perfecto", description: "Agua a 92-96°C, no hirviendo que quema" },
      { title: "Té verde", description: "Agua a 70-80°C, 2-3 min máximo, sin amargor" },
      { title: "Té negro", description: "Agua hirviendo, 3-5 min para cuerpo completo" },
      { title: "Limonada", description: "Infusionar cáscara en el almíbar, más aroma" },
      { title: "Smoothie cremoso", description: "Banana congelada en vez de hielo" },
      { title: "Chocolate caliente", description: "Chocolate real rallado, no cacao en polvo" },
      { title: "Agua saborizada", description: "Hierbas machacadas liberan más sabor" },
      { title: "Hielo sin diluir", description: "Congelar el mismo jugo para los cubitos" },
      { title: "Cóctel equilibrado", description: "2 partes fuerte, 1 dulce, 1 ácido" },
      { title: "Leche espumada", description: "Fría y con grasa, no descremada" },
    ]
  },
  {
    id: "trucos",
    name: "Trucos Pro",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/20",
    tips: [
      { title: "Ajo sin olor", description: "Sacá el centro verde antes de picar" },
      { title: "Cebolla sin llorar", description: "10 min en freezer o cortar bajo agua" },
      { title: "Salsa cremosa", description: "Agua de pasta en vez de crema, más liviana" },
      { title: "Sartén caliente", description: "La gota de agua debe bailar, no evaporarse" },
      { title: "Sal al final", description: "En carnes y pescados, antes seca la superficie" },
      { title: "Limón caliente", description: "20 seg en microondas, rinde el doble de jugo" },
      { title: "Jengibre pelado", description: "Con cuchara raspando, más fácil que cuchillo" },
      { title: "Ajo pelado fácil", description: "Aplastar con el lado del cuchillo, sale solo" },
      { title: "Perejil fresco", description: "Picar solo las hojas, los tallos para caldos" },
      { title: "Mise en place", description: "Todo listo antes de empezar, cero estrés" },
    ]
  },
  {
    id: "seguridad",
    name: "Seguridad",
    icon: Shield,
    color: "text-slate-500",
    bgColor: "bg-slate-500/20",
    tips: [
      { title: "Cuchillo afilado", description: "Más seguro que desafilado, corta sin fuerza" },
      { title: "Tabla estable", description: "Trapo húmedo abajo para que no se mueva" },
      { title: "Manos secas", description: "Mojadas se resbalan, cuidado con cuchillos" },
      { title: "Mangos hacia adentro", description: "Sartenes con mangos hacia la cocina" },
      { title: "No agua en aceite", description: "Explota y salpica, secar todo antes de freír" },
      { title: "Abrir ollas tapadas", description: "Hacia el otro lado, el vapor quema" },
      { title: "Contaminación cruzada", description: "Tabla distinta para carnes crudas" },
      { title: "Zona de peligro", description: "5-60°C, no dejar comida más de 2 horas" },
      { title: "Descongelar seguro", description: "En heladera o microondas, nunca a temperatura" },
      { title: "Probar con cuchara", description: "No la vuelvas a meter, nueva cada vez" },
    ]
  },
];

export const TipsSection = ({ onNavigateToCooking }: TipsSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("cortes");
  const { t } = useLanguage();

  const getCategoryName = (id: string) => {
    const categoryNames: Record<string, string> = {
      cortes: t("tipsCuts"),
      temperaturas: t("tipsTemperatures"),
      conservacion: t("tipsConservation"),
      tiempos: t("tipsTimes"),
      ahorro: t("tipsSavings"),
      salsas: t("tipsSauces"),
      proteinas: t("tipsProteins"),
      verduras: t("tipsVegetables"),
      pasteleria: t("tipsPastry"),
      cafe: t("tipsBeverages"),
      trucos: t("tipsProTricks"),
      seguridad: t("tipsSafety"),
    };
    return categoryNames[id] || id;
  };

  const currentCategory = tipsCategories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Selector */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {tipsCategories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap shrink-0",
                  isActive
                    ? `${category.bgColor} ${category.color} shadow-md scale-105`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{getCategoryName(category.id)}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Tips Grid */}
      {currentCategory && (
        <Card className={cn(
          "border-2 transition-colors",
          `border-${currentCategory.id === 'trucos' ? 'primary' : currentCategory.color.replace('text-', '')}/30`
        )}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                currentCategory.bgColor
              )}>
                <currentCategory.icon className={cn("h-6 w-6", currentCategory.color)} />
              </div>
              <div>
                <span className="text-xl">{getCategoryName(currentCategory.id)}</span>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  {currentCategory.tips.length} {t("practicalTips")}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentCategory.tips.map((tip, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    currentCategory.bgColor
                  )}>
                    <Star className={cn("h-3 w-3", currentCategory.color)} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-primary">{tipsCategories.length}</p>
          <p className="text-xs text-muted-foreground">{t("tipsCategories")}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-amber-500">
            {tipsCategories.reduce((acc, c) => acc + c.tips.length, 0)}
          </p>
          <p className="text-xs text-muted-foreground">{t("totalTips")}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-emerald-500">∞</p>
          <p className="text-xs text-muted-foreground">{t("extraFlavor")}</p>
        </Card>
      </div>

      {/* Practice CTA */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg">{t("tipsLearnByDoing")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("tipsPracticeDesc")}
              </p>
            </div>
            <Button onClick={onNavigateToCooking} className="gap-2">
              <ChefHat className="h-4 w-4" />
              {t("tipsPracticeButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
