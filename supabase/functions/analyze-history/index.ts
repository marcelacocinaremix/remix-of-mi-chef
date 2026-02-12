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
      console.log('Rejected: No authenticated user for analyze-history');
      return new Response(JSON.stringify({ 
        error: 'Necesitás iniciar sesión para ver tu historial',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authorized: User ${userId} accessing analyze-history`);

    const { topIngredients, preferredStyles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    console.log("Analyzing history:", { topIngredients, preferredStyles });

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          suggestions: [
            { name: "Milanesas caseras", reason: "Un clásico argentino que siempre funciona", estimatedTime: "40 min" },
            { name: "Ensalada completa", reason: "Para equilibrar tus comidas", estimatedTime: "15 min" }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Sos Marcela, una cocinera argentina experta en cocina casera.
Tu tarea es sugerir 3 recetas personalizadas basándote en el historial del usuario.

REGLAS ESTRICTAS:
- Usá español rioplatense
- Las recetas deben ser caseras, económicas y realistas
- Cada sugerencia tiene: name (nombre de la receta), reason (por qué le va a gustar, máximo 15 palabras), estimatedTime (tiempo estimado)
- Sé específica con los tiempos (ej: "25 min", "1 hora")
- Las razones deben ser personales y cálidas

RESPUESTA EN JSON:
{
  "suggestions": [
    { "name": "...", "reason": "...", "estimatedTime": "..." },
    { "name": "...", "reason": "...", "estimatedTime": "..." },
    { "name": "...", "reason": "...", "estimatedTime": "..." }
  ]
}`;

    let userPrompt = "Generame 3 sugerencias de recetas personalizadas.";
    
    if (topIngredients) {
      userPrompt += `\n\nIngredientes que más usa: ${topIngredients}`;
    }
    
    if (preferredStyles) {
      userPrompt += `\nEstilos de recetas preferidos: ${preferredStyles}`;
    }

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
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          console.log(`analyze-history success with model: ${model}`);
          break;
        }
        
        console.log(`analyze-history model ${model} failed: ${response.status}`);
      } catch (e) {
        console.error(`analyze-history fetch error with ${model}:`, e);
      }
    }

    if (!response || !response.ok) {
      console.error("All AI models failed for analyze-history");
      
      return new Response(
        JSON.stringify({ 
          suggestions: [
            { name: "Tarta de verduras", reason: "Aprovechá lo que tenés en la heladera", estimatedTime: "45 min" },
            { name: "Fideos con salsa", reason: "Rápido y siempre delicioso", estimatedTime: "20 min" }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("AI response:", content);

    // Parse JSON from response
    let suggestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions;
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
    }

    // Fallback if parsing failed
    if (!suggestions || !Array.isArray(suggestions)) {
      suggestions = [
        { name: "Guiso casero", reason: "Perfecto para los ingredientes que usás seguido", estimatedTime: "50 min" },
        { name: "Tortilla de papas", reason: "Simple, económico y siempre rico", estimatedTime: "30 min" },
        { name: "Pollo al horno", reason: "Un clásico que nunca falla", estimatedTime: "1 hora" }
      ];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-history:", error);
    return new Response(
      JSON.stringify({ 
        suggestions: [
          { name: "Empanadas caseras", reason: "Un clásico argentino para cualquier día", estimatedTime: "1 hora" },
          { name: "Arroz con pollo", reason: "Completo y nutritivo", estimatedTime: "40 min" }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
