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
    // Check authentication (optional - describe-recipe works for all but logs for debugging)
    const { authenticated, userId } = await checkAuth(req);
    
    if (authenticated && userId) {
      console.log(`Authorized: User ${userId} accessing describe-recipe`);
    } else {
      console.log('Anonymous user accessing describe-recipe');
    }

    const { recipeName, recipeIngredients, recipeTime, recipeDifficulty } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Sos Marcela, una chef amigable. Dame UNA frase corta y entusiasta (máximo 15 palabras) describiendo esta receta:
    
Nombre: ${recipeName}
Ingredientes principales: ${recipeIngredients?.slice(0, 3).join(', ') || 'varios'}
Tiempo: ${recipeTime} minutos
Dificultad: ${recipeDifficulty}

Respondé SOLO con la frase, sin comillas, sin emojis al inicio. Ejemplo: "Esta opción es perfecta para un almuerzo rápido y nutritivo"`;

    // Multiple models for fallback
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
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (response.ok) {
          console.log(`describe-recipe success with model: ${model}`);
          break;
        }
        
        console.log(`describe-recipe model ${model} failed: ${response.status}`);
        
        if (response.status === 429) continue; // Rate limited, try next
      } catch (e) {
        console.error(`describe-recipe fetch error with ${model}:`, e);
      }
    }

    if (!response || !response.ok) {
      console.log('All AI models failed for describe-recipe');
      return new Response(JSON.stringify({ description: '¡Esta opción se ve deliciosa!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || '¡Esta opción se ve deliciosa!';

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
