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
  
  if (!authHeader) {
    return { authenticated: false, userId: null };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    return { authenticated: false, userId: null };
  }

  return { authenticated: true, userId: user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication
    const { authenticated, userId } = await checkAuth(req);
    
    if (!authenticated || !userId) {
      console.log('Rejected: No authenticated user for generate-smart-tip');
      return new Response(JSON.stringify({ 
        error: 'Necesitás iniciar sesión para ver tips personalizados',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authorized: User ${userId} accessing generate-smart-tip`);

    const { pantryIngredients, recentRecipes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ tip: "¡Planificá tus comidas para ahorrar tiempo y dinero! 💡" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Sos Marcela, una cocinera argentina experta en cocina casera, económica y práctica.
Tu tarea es generar UN SOLO TIP corto y útil (máximo 2 oraciones) para el usuario.

REGLAS:
- Usá español rioplatense (vos, tenés, cocinás)
- Sé cálida y cercana
- El tip debe ser práctico y relacionado con la cocina casera
- Podés hacer referencia a los ingredientes o recetas del usuario si los tiene
- Incluí un emoji al final

EJEMPLOS DE TIPS:
- "Si tenés tomates maduros, hacé una salsa casera y congelá porciones. ¡Te salva cualquier cena rápida! 🍅"
- "Cuando cocines arroz, hacé el doble y guardá en la heladera. Mañana podés hacer un arroz frito o ensalada. 🍚"
- "Los restos de verduras son oro: guardálos en el freezer y cuando tengas varios, hacé un caldo casero. 🥕"`;

    let userPrompt = "Generame un tip de cocina útil para hoy.";
    
    if (pantryIngredients) {
      userPrompt += `\n\nIngredientes en mi despensa: ${pantryIngredients}`;
    }
    
    if (recentRecipes) {
      userPrompt += `\n\nRecetas que cociné recientemente: ${recentRecipes}`;
    }

    console.log("Generating smart tip with context:", { pantryIngredients, recentRecipes });

    // Try multiple models for fallback - maximum reliability
    const models = [
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash',
      'openai/gpt-5-nano',
      'openai/gpt-5-mini',
      'google/gemini-2.5-pro',
      'google/gemini-3-pro-preview',
      'openai/gpt-5'
    ];
    let response: Response | null = null;
    
    for (const model of models) {
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
          }),
        });

        if (response.ok) {
          console.log(`Smart tip success with model: ${model}`);
          break;
        }
        
        console.log(`Smart tip model ${model} failed: ${response.status}`);
      } catch (e) {
        console.error(`Smart tip fetch error with ${model}:`, e);
      }
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ tip: "¡No te olvides de revisar qué tenés en la heladera antes de ir al súper! 🛒" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const tip = data.choices?.[0]?.message?.content?.trim() || "¡Planificá tus comidas de la semana para ahorrar tiempo! 📅";

    console.log("Generated tip:", tip);

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
