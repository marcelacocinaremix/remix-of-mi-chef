import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalize(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeName, recipeIngredients, recipeTime, recipeDifficulty } = await req.json();

    if (!recipeName) {
      return new Response(JSON.stringify({ description: '¡Esta opción se ve deliciosa!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalized = normalize(recipeName);

    // 1. Check cache first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cached } = await supabase
      .from('cached_descriptions')
      .select('*')
      .eq('recipe_name_normalized', normalized)
      .maybeSingle();

    if (cached) {
      console.log(`Description cache HIT for "${recipeName}"`);
      await supabase
        .from('cached_descriptions')
        .update({ usage_count: (cached.usage_count || 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', cached.id);

      return new Response(JSON.stringify({ description: cached.description }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Description cache MISS for "${recipeName}", calling AI`);

    // 2. No cache → call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ description: '¡Esta opción se ve deliciosa!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Sos Marcela, una chef amigable. Dame UNA frase corta y entusiasta (máximo 15 palabras) describiendo esta receta:
    
Nombre: ${recipeName}
Ingredientes principales: ${recipeIngredients?.slice(0, 3).join(', ') || 'varios'}
Tiempo: ${recipeTime} minutos
Dificultad: ${recipeDifficulty}

Respondé SOLO con la frase, sin comillas, sin emojis al inicio. Ejemplo: "Esta opción es perfecta para un almuerzo rápido y nutritivo"`;

    const models = [
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash',
      'openai/gpt-5-nano',
    ];
    
    let response: Response | null = null;
    
    for (const model of models) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          console.log(`describe-recipe success with model: ${model}`);
          break;
        }
        
        if (response.status === 429) continue;
      } catch (e) {
        console.error(`describe-recipe fetch error with ${model}:`, e);
      }
    }

    if (!response || !response.ok) {
      return new Response(JSON.stringify({ description: '¡Esta opción se ve deliciosa!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || '¡Esta opción se ve deliciosa!';

    // 3. Cache the result
    try {
      await supabase.from('cached_descriptions').insert({
        recipe_name: recipeName.trim(),
        recipe_name_normalized: normalized,
        description,
      });
      console.log(`Cached description for "${recipeName}"`);
    } catch (cacheErr) {
      console.error('Error caching description:', cacheErr);
    }

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ description: '¡Esta opción se ve deliciosa!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
