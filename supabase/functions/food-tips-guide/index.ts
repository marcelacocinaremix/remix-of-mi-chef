import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categoryPrompts: Record<string, string> = {
  conservacion: `Proporciona información sobre CONSERVACIÓN del alimento:
- Dónde guardarlo (heladera, freezer, alacena, etc.)
- Cuánto dura en cada lugar
- Temperatura ideal de almacenamiento
- Señales de que está en mal estado`,

  temperaturas: `Proporciona información sobre TEMPERATURAS DE COCCIÓN del alimento:
- Temperatura interna segura
- Temperatura del horno/sartén recomendada
- Puntos de cocción (jugoso, a punto, bien cocido)
- Cómo verificar si está cocido`,

  tiempos: `Proporciona información sobre TIEMPOS DE COCCIÓN del alimento:
- Tiempo según método (hervido, horno, sartén, etc.)
- Tiempo según tamaño o corte
- Tiempo de reposo si aplica
- Tiempos para diferentes puntos de cocción`,

  preparacion: `Proporciona información sobre PREPARACIÓN Y CORTES del alimento:
- Cómo limpiarlo correctamente
- Tipos de cortes recomendados
- Cómo pelar o limpiar según el uso
- Preparación previa a la cocción`,

  coccion: `Proporciona información sobre MÉTODOS DE COCCIÓN del alimento:
- Mejores métodos de cocción
- Cómo lograr mejores resultados
- Errores comunes al cocinar
- Técnicas profesionales`,

  ahorro: `Proporciona información sobre AHORRO Y APROVECHAMIENTO del alimento:
- Cómo aprovechar al máximo (partes que normalmente se descartan)
- Tips para evitar desperdicio
- Cómo usar restos o sobras
- Alternativas económicas`,

  seguridad: `Proporciona información sobre SEGURIDAD ALIMENTARIA del alimento:
- Manipulación segura
- Contaminación cruzada a evitar
- Cómo descongelar de forma segura
- Tiempos máximos fuera de refrigeración`,
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
    const categoryPrompt = categoryPrompts[selectedCategory] || categoryPrompts.conservacion;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en cocina y seguridad alimentaria. Tu tarea es:
1. PRIMERO: Determinar si lo que el usuario ingresó es un ALIMENTO real (comida, bebida, ingrediente de cocina).
2. Si NO es un alimento (por ejemplo: bicicleta, computadora, ropa, etc.), responder con isFood: false.
3. Si ES un alimento, proporcionar información específica según la categoría solicitada.

IMPORTANTE: Solo responde sobre ALIMENTOS reales. Si no es comida, responde isFood: false.

${categoryPrompt}

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "isFood": true/false,
  "name": "nombre del alimento",
  "category": "${selectedCategory}",
  "mainInfo": "información principal resumida en 1-2 oraciones",
  "details": ["detalle específico 1", "detalle específico 2", "detalle específico 3", "detalle específico 4"],
  "tips": ["tip práctico 1", "tip práctico 2", "tip práctico 3"],
  "warnings": ["precaución 1", "precaución 2"] // solo si hay advertencias importantes
}

Si no es un alimento, responde:
{
  "isFood": false,
  "name": "",
  "category": "",
  "mainInfo": "",
  "details": [],
  "tips": [],
  "warnings": []
}

Responde en español argentino, de forma clara, práctica y concisa.`;

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

    // Parse the JSON from AI response
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
