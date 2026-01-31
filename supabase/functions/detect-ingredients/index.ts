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
      console.log('Rejected: No authenticated user for detect-ingredients');
      return new Response(JSON.stringify({ 
        error: 'Necesitás iniciar sesión para usar la detección de ingredientes',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authorized: User ${userId} accessing detect-ingredients`);

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No se proporcionó imagen');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing image for ingredients...');

    // Multiple models for fallback - vision capable models
    const models = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'google/gemini-3-pro-preview',
      'openai/gpt-5',
      'openai/gpt-5-mini'
    ];
    
    let response: Response | null = null;
    let successfulModel = '';
    
    const systemContent = `Sos un experto en identificar ingredientes de cocina en imágenes. 
Tu tarea es analizar la imagen y detectar todos los ingredientes visibles.
Devolvé SOLO un JSON con el siguiente formato, sin texto adicional:
{
  "ingredients": ["ingrediente1", "ingrediente2", ...],
  "confidence": "alta" | "media" | "baja"
}

Reglas:
- Identificá ingredientes comunes y específicos (ej: "tomate", "cebolla", "pollo")
- Si ves productos envasados, tratá de identificar qué son
- Usá nombres en español
- No incluyas utensilios, platos o elementos que no sean comestibles
- Si no podés identificar ingredientes claramente, devolvé array vacío`;

    for (const model of models) {
      console.log(`Trying model for image: ${model}`);
      
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        try {
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content: systemContent
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "¿Qué ingredientes podés identificar en esta imagen?"
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageBase64
                      }
                    }
                  ]
                }
              ],
            }),
          });

          if (response.ok) {
            successfulModel = model;
            console.log(`Image analysis success with model: ${model}`);
            break;
          }
          
          const errorText = await response.text();
          console.error(`Model ${model} error (attempt ${attempt + 1}):`, response.status, errorText);
          
          if (response.status === 429) break; // Rate limited, try next model
        } catch (fetchError) {
          console.error(`Fetch error with ${model}:`, fetchError);
        }
      }
      
      if (response?.ok) break;
    }

    if (!response || !response.ok) {
      console.error('All AI models failed for detect-ingredients');
      return new Response(JSON.stringify({ 
        ingredients: [], 
        confidence: "baja",
        error: "No se pudo analizar la imagen. Intentá de nuevo." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      result = { ingredients: [], confidence: "baja" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in detect-ingredients:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error al analizar la imagen" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
