import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

const ALL_CATEGORIES = [
  "conservacion", "congelacion", "compra", "temperaturas", "tiempos",
  "preparacion", "coccion", "sustitutos", "combinaciones", "nutricion",
  "ahorro", "seguridad"
];

const categoryPrompts: Record<string, string> = {
  conservacion: `Proporciona información sobre CONSERVACIÓN del alimento: dónde guardarlo, cuánto dura, temperatura ideal, señales de mal estado.`,
  congelacion: `Proporciona información sobre CONGELACIÓN: si se puede congelar, cuánto dura, cómo descongelar, si pierde propiedades.`,
  compra: `Proporciona información sobre CÓMO COMPRAR/ELEGIR fresco: qué mirar, señales de calidad, qué evitar, mejor época.`,
  temperaturas: `Proporciona información sobre TEMPERATURAS DE COCCIÓN: temperatura interna segura, temperatura de horno/sartén, puntos de cocción.`,
  tiempos: `Proporciona información sobre TIEMPOS DE COCCIÓN: tiempo según método, según tamaño, tiempo de reposo.`,
  preparacion: `Proporciona información sobre PREPARACIÓN Y CORTES: cómo limpiar, tipos de cortes, cómo pelar, preparación previa.`,
  coccion: `Proporciona información sobre MÉTODOS DE COCCIÓN: mejores métodos, cómo lograr mejores resultados, errores comunes, técnicas profesionales.`,
  sustitutos: `Proporciona información sobre SUSTITUTOS: con qué reemplazar, proporciones, en qué recetas funciona cada sustituto.`,
  combinaciones: `Proporciona información sobre COMBINACIONES Y MARIDAJES: con qué combina bien, hierbas y especias, bebidas, combinaciones clásicas.`,
  nutricion: `Proporciona información sobre NUTRICIÓN: principales nutrientes, beneficios, calorías por porción, para quién es beneficioso.`,
  ahorro: `Proporciona información sobre AHORRO Y APROVECHAMIENTO: cómo aprovechar al máximo, evitar desperdicio, usar restos.`,
  seguridad: `Proporciona información sobre SEGURIDAD ALIMENTARIA: manipulación segura, contaminación cruzada, descongelación segura, tiempos fuera de refrigeración.`,
};

const COMMON_FOODS = [
  "Pollo", "Carne vacuna", "Carne molida", "Cerdo", "Merluza", "Atún", "Salmón",
  "Huevo", "Leche", "Queso cremoso", "Queso rallado", "Yogur", "Manteca", "Crema de leche",
  "Arroz", "Fideos", "Harina", "Pan", "Papa", "Batata", "Lentejas", "Garbanzos",
  "Tomate", "Cebolla", "Ajo", "Zanahoria", "Zapallo", "Lechuga", "Espinaca", "Brócoli",
  "Morrón", "Choclo", "Arvejas", "Berenjena", "Calabacín", "Pepino",
  "Banana", "Manzana", "Naranja", "Limón", "Frutilla", "Palta",
  "Aceite de oliva", "Sal", "Pimienta", "Orégano", "Azúcar", "Miel",
  "Chocolate", "Jamón cocido"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foods, categories, batchSize = 3 } = await req.json();
    const foodList: string[] = foods || COMMON_FOODS;
    const catList: string[] = categories || ALL_CATEGORIES;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const food of foodList) {
      const normalized = normalize(food);

      // Get existing categories for this food
      const { data: existing } = await supabase
        .from('cached_food_guides')
        .select('category')
        .eq('food_name_normalized', normalized);

      const existingCats = new Set((existing || []).map(e => e.category));
      const missingCats = catList.filter(c => !existingCats.has(c));

      if (missingCats.length === 0) {
        skipped += catList.length;
        continue;
      }

      // Process in batches
      for (let i = 0; i < missingCats.length; i += batchSize) {
        const batch = missingCats.slice(i, i + batchSize);
        
        const promises = batch.map(async (category) => {
          try {
            const prompt = categoryPrompts[category];
            const systemPrompt = `Eres un experto en cocina y seguridad alimentaria argentina. ${prompt}

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "isFood": true,
  "name": "${food}",
  "category": "${category}",
  "mainInfo": "información principal resumida en 1-2 oraciones",
  "details": ["detalle 1", "detalle 2", "detalle 3", "detalle 4"],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "warnings": ["precaución 1", "precaución 2"]
}
Responde en español argentino, de forma clara, práctica y concisa.`;

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: `Alimento: ${food}\nCategoría: ${category}` },
                ],
                temperature: 0.3,
              }),
            });

            if (!response.ok) {
              console.error(`AI error for ${food}/${category}: ${response.status}`);
              errors++;
              return;
            }

            const aiResponse = await response.json();
            const content = aiResponse.choices?.[0]?.message?.content;
            if (!content) { errors++; return; }

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) { errors++; return; }

            const foodInfo = JSON.parse(jsonMatch[0]);
            if (!foodInfo.isFood) { skipped++; return; }

            await supabase.from('cached_food_guides').insert({
              food_name: food,
              food_name_normalized: normalized,
              category,
              response_data: foodInfo,
            });

            created++;
            console.log(`✅ ${food} / ${category}`);
          } catch (err) {
            console.error(`Error ${food}/${category}:`, err);
            errors++;
          }
        });

        await Promise.all(promises);
        // Small delay between batches to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ created, skipped, errors, total: foodList.length * catList.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed food guides error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
