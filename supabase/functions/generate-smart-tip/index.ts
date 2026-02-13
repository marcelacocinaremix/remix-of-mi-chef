import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkAuth(req: Request): Promise<{ authenticated: boolean; userId: string | null }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { authenticated: false, userId: null };
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) return { authenticated: false, userId: null };
  return { authenticated: true, userId: user.id };
}

// Pool of fallback tips to avoid AI calls
const FALLBACK_TIPS = [
  "¡Planificá tus comidas para ahorrar tiempo y dinero! 💡",
  "Si tenés verduras que están por pasarse, hacé una sopa o un salteado rápido. ¡Nada se desperdicia! 🥕",
  "Cuando cocines arroz, hacé el doble y guardá en la heladera. Mañana podés hacer un arroz frito. 🍚",
  "Los restos de verduras son oro: guardálos en el freezer para hacer un caldo casero. 🥗",
  "¡No te olvides de revisar qué tenés en la heladera antes de ir al súper! 🛒",
  "Congelá las hierbas frescas en cubeteras con aceite de oliva. Siempre listas para cocinar. 🌿",
  "Marinar las carnes la noche anterior hace toda la diferencia en sabor. Probalo. 🥩",
  "Las frutas muy maduras son perfectas para licuados o para hacer budín. 🍌",
  "Organizá la heladera: lo que vence primero, adelante. ¡Así no se pierde nada! ❄️",
  "Un buen caldo casero transforma cualquier plato simple en algo especial. 🍲",
  "Lavá y cortá las verduras apenas las comprás. Así las usás más rápido durante la semana. 🥬",
  "El ajo y la cebolla son la base de todo. Tené siempre stock en casa. 🧅",
  "Usá el agua de cocción de las verduras para hacer sopas o caldos. ¡Tiene nutrientes! 💧",
  "Congelá porciones individuales de guiso o salsa. Tenés comida lista para toda la semana. 🧊",
  "Las legumbres son baratas, nutritivas y rinden mucho. Incorporálas más seguido. 🫘",
  "Si el pan está duro, rallalo y hacé pan rallado casero. ¡Queda mejor que el comprado! 🍞",
  "Comprá frutas y verduras de estación. Son más baratas, frescas y sabrosas. 🍎",
  "Cocinás para uno? Hacé porciones dobles y congelá la mitad. Futuro vos te va a agradecer. 🏠",
  "El limón le da vida a cualquier plato. Siempre tené uno a mano. 🍋",
  "Antes de cocinar, leé toda la receta completa. Así evitás sorpresas a mitad de camino. 📖",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authenticated, userId } = await checkAuth(req);
    if (!authenticated || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Necesitás iniciar sesión para ver tips personalizados',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pantryIngredients, recentRecipes } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Try to serve from cached tips pool first
    const { data: cachedTips } = await supabase
      .from('cached_smart_tips')
      .select('*')
      .order('usage_count', { ascending: true })
      .limit(10);

    if (cachedTips && cachedTips.length >= 5) {
      // Pick a random tip from the least-used ones
      const randomTip = cachedTips[Math.floor(Math.random() * cachedTips.length)];
      console.log(`Smart tip served from cache: "${randomTip.tip.slice(0, 50)}..."`);
      
      await supabase
        .from('cached_smart_tips')
        .update({ usage_count: (randomTip.usage_count || 1) + 1 })
        .eq('id', randomTip.id);

      return new Response(
        JSON.stringify({ tip: randomTip.tip }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Not enough cached tips → try AI to generate a batch and cache them
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      return new Response(
        JSON.stringify({ tip }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Sos Marcela, una cocinera argentina experta en cocina casera, económica y práctica.
Generá 5 TIPS diferentes, cortos y útiles (máximo 2 oraciones cada uno) sobre cocina casera.

REGLAS:
- Usá español rioplatense (vos, tenés, cocinás)
- Sé cálida y cercana
- Cada tip debe ser práctico y diferente
- Incluí un emoji al final de cada tip
- Respondé SOLO con un JSON array de strings

Respondé así: ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]`;

    let userPrompt = "Generame 5 tips de cocina útiles y variados.";
    if (pantryIngredients) userPrompt += `\nIngredientes disponibles: ${pantryIngredients}`;
    if (recentRecipes) userPrompt += `\nRecetas recientes: ${recentRecipes}`;

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || "";
        
        // Try to parse as array
        let tips: string[] = [];
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            tips = JSON.parse(jsonMatch[0]);
          }
        } catch { /* ignore */ }

        if (tips.length > 0) {
          // Cache all tips
          for (const tip of tips) {
            if (typeof tip === 'string' && tip.length > 10) {
              await supabase.from('cached_smart_tips').insert({
                tip,
                context_type: pantryIngredients ? 'pantry' : 'general',
              }).catch(() => {});
            }
          }
          console.log(`Cached ${tips.length} new smart tips`);
          
          return new Response(
            JSON.stringify({ tip: tips[0] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (e) {
      console.error('AI error for smart tips:', e);
    }

    // 3. Fallback
    const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    return new Response(
      JSON.stringify({ tip }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-smart-tip:", error);
    return new Response(
      JSON.stringify({ tip: "¡Aprovechá los ingredientes que tenés antes de comprar más! 💡" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
