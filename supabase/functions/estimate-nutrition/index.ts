import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { food_name, portion } = await req.json();

    if (!food_name || typeof food_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'food_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalized = normalize(food_name);
    const portionNorm = portion ? portion.trim() : '';

    // 1. Check cached_nutrition table first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cached } = await supabase
      .from('cached_nutrition')
      .select('*')
      .eq('food_name_normalized', normalized)
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log(`Nutrition cache HIT for "${food_name}"`);
      // Increment usage count
      await supabase
        .from('cached_nutrition')
        .update({ usage_count: (cached.usage_count || 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', cached.id);

      return new Response(
        JSON.stringify({
          food_name,
          calories: cached.calories,
          protein: cached.protein,
          carbs: cached.carbs,
          fats: cached.fats,
          portion: cached.portion_description || '1 porción',
          source: 'cache',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Nutrition cache MISS for "${food_name}", calling AI`);

    // 2. No cache hit → call AI
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const portionText = portion ? ` (porción: ${portion})` : '';
    const prompt = `Estimá los valores nutricionales de "${food_name}"${portionText}. 
Si no se indica porción, usá una porción estándar típica.
Respondé SOLO con un JSON válido con esta estructura exacta (sin texto adicional):
{"calories":number,"protein":number,"carbs":number,"fats":number,"portion":"descripción de la porción usada"}
Los valores deben ser números enteros redondeados. Usá datos nutricionales reales y precisos.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Sos un nutricionista experto. Respondé SOLO con JSON válido, sin markdown ni texto extra.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Empty AI response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const nutrition = JSON.parse(jsonStr);

    if (typeof nutrition.calories !== 'number' || typeof nutrition.protein !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      food_name,
      calories: Math.round(nutrition.calories),
      protein: Math.round(nutrition.protein),
      carbs: Math.round(nutrition.carbs),
      fats: Math.round(nutrition.fats),
      portion: nutrition.portion || '1 porción',
      source: 'ai',
    };

    // 3. Cache the AI result for future lookups
    try {
      const { error: insertErr } = await supabase.from('cached_nutrition').insert({
        food_name: food_name.trim(),
        food_name_normalized: normalized,
        portion: portionNorm || null,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
        portion_description: result.portion,
        usage_count: 1,
      });
      if (insertErr) {
        console.error('Error caching nutrition:', insertErr);
      } else {
        console.log(`Cached nutrition for "${food_name}"`);
      }
    } catch (cacheErr) {
      console.error('Error caching nutrition:', cacheErr);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
