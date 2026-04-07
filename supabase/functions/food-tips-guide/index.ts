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

const categoryPrompts: Record<string, string> = {
  conservacion: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en CONSERVACIÓN PRO:
- Tiempos exactos en heladera y alacena
- Tips de frescura para que dure más
- Señales de que ya no está bueno
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  congelacion: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en FREEZER Y DESCONGELADO:
- Cómo congelar sin perder textura ni sabor
- Cuánto dura congelado y cómo envasar
- Método correcto de descongelado
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  preparacion: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en CORTES Y LIMPIEZA:
- El corte ideal según la preparación
- Técnica de limpieza profesional
- Cómo pelar o preparar antes de cocinar
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  coccion: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en PUNTO Y COCCIÓN:
- Temperaturas exactas por método (horno, sartén, hervido)
- Tiempos según grosor o corte
- Cómo verificar el punto perfecto
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  combinaciones: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en SABOR Y ADOBOS:
- Especias y hierbas que mejor combinan
- Marinados y adobos recomendados
- Potenciadores de sabor profesionales
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  sustitutos: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en SUSTITUTOS Y CAMBIOS:
- Con qué ingredientes se puede reemplazar
- Proporciones de sustitución
- Diferencias de sabor o textura con cada sustituto
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  rescate: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en RESCATE DE ALIMENTOS:
- Cómo arreglar si se pasó de sal, se secó o se quemó
- Técnicas para revivir un plato arruinado
- Trucos de emergencia de chef profesional
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
  ahorro: `Actúa como Marcela Cocina y dame un truco profesional para este alimento enfocado en APROVECHAMIENTO:
- Cómo usar sobras creativamente
- Partes que normalmente se descartan pero son comestibles
- Tips para no desperdiciar nada
Sé breve, usá 3 bullets y terminá con un consejo secreto.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName, category } = await req.json();

    if (!foodName || typeof foodName !== "string" || foodName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Food name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedCategory = category || "conservacion";
    const normalized = normalize(foodName);

    // 1. Check cache first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cached } = await supabase
      .from('cached_food_guides')
      .select('*')
      .eq('food_name_normalized', normalized)
      .eq('category', selectedCategory)
      .maybeSingle();

    if (cached) {
      console.log(`Food guide cache HIT for "${foodName}" + "${selectedCategory}"`);
      await supabase
        .from('cached_food_guides')
        .update({ usage_count: (cached.usage_count || 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', cached.id);

      return new Response(JSON.stringify(cached.response_data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Food guide cache MISS for "${foodName}" + "${selectedCategory}", calling AI`);

    // 2. No cache → call AI
    const categoryPrompt = categoryPrompts[selectedCategory] || categoryPrompts.conservacion;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Sos Marcela Cocina, chef profesional argentina. Tu tarea es:
1. PRIMERO: Determinar si lo que el usuario ingresó es un ALIMENTO real (comida, bebida, ingrediente de cocina).
2. Si NO es un alimento (por ejemplo: bicicleta, computadora, ropa, etc.), responder con isFood: false.
3. Si ES un alimento, dar un truco profesional enfocado en la categoría solicitada.

IMPORTANTE: Solo responde sobre ALIMENTOS reales. Si no es comida, responde isFood: false.

${categoryPrompt}

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "isFood": true/false,
  "name": "nombre del alimento",
  "category": "${selectedCategory}",
  "mainInfo": "resumen del truco en 1-2 oraciones con tono de chef profesional",
  "details": ["bullet 1 con truco concreto", "bullet 2 con truco concreto", "bullet 3 con truco concreto"],
  "tips": ["consejo secreto de chef profesional"],
  "warnings": ["precaución importante si aplica"]
}

Si no es un alimento, responde:
{"isFood": false, "name": "", "category": "", "mainInfo": "", "details": [], "tips": [], "warnings": []}

Responde en español argentino, de forma clara, práctica y concisa. Usá un tono cercano y profesional.`;

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
          { role: "user", content: `Alimento: ${foodName.trim()}\nCategoría de información: ${selectedCategory}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas consultas. Intentá de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let foodInfo;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        foodInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    // 3. Cache the result if it's a valid food
    if (foodInfo.isFood) {
      try {
        await supabase.from('cached_food_guides').insert({
          food_name: foodName.trim(),
          food_name_normalized: normalized,
          category: selectedCategory,
          response_data: foodInfo,
        });
        console.log(`Cached food guide for "${foodName}" + "${selectedCategory}"`);
      } catch (cacheErr) {
        console.error('Error caching food guide:', cacheErr);
      }
    }

    return new Response(JSON.stringify(foodInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in food-tips-guide:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
