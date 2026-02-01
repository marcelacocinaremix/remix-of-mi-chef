import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName } = await req.json();

    if (!foodName || typeof foodName !== "string" || foodName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Food name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en conservación de alimentos. Tu tarea es:
1. PRIMERO: Determinar si lo que el usuario ingresó es un ALIMENTO real (comida, bebida, ingrediente de cocina).
2. Si NO es un alimento (por ejemplo: bicicleta, computadora, ropa, etc.), responder con isFood: false.
3. Si ES un alimento, proporcionar información detallada sobre su conservación.

IMPORTANTE: Solo responde sobre ALIMENTOS reales. Si no es comida, responde isFood: false.

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "isFood": true/false,
  "name": "nombre del alimento",
  "storage": "dónde y cómo guardarlo (ej: Heladera en recipiente hermético, Alacena en lugar fresco y seco)",
  "duration": "cuánto dura (ej: 5-7 días en heladera, 2 semanas a temperatura ambiente)",
  "temperature": "temperatura ideal (ej: 4°C en heladera, temperatura ambiente 15-20°C)",
  "commonMistakes": ["error 1", "error 2", "error 3"],
  "tips": ["tip práctico 1", "tip práctico 2", "tip práctico 3"]
}

Si no es un alimento, responde:
{
  "isFood": false,
  "name": "",
  "storage": "",
  "duration": "",
  "temperature": "",
  "commonMistakes": [],
  "tips": []
}

Responde en español argentino, de forma clara y práctica.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Alimento a consultar: ${foodName.trim()}` },
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

    // Parse the JSON from AI response
    let storageInfo;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        storageInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(storageInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in food-storage-guide:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
