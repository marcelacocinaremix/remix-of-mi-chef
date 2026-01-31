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

const systemPrompt = `Eres MarcelaCocina, creadora de contenido gastronómico especializada en comida casera, práctica y accesible.
Tu objetivo es ayudar a planificar comidas para la semana, priorizando REUTILIZAR ingredientes entre recetas para minimizar desperdicio y compras.

INSTRUCCIONES:
1. Generá recetas para los slots vacíos de almuerzo y cena (0=Lunes a 6=Domingo).
2. Las recetas deben ser VARIADAS pero REUTILIZAR ingredientes estratégicamente.
3. Priorizá recetas caseras, económicas, simples y realistas.
4. Cada receta debe poder realizarse con los ingredientes indicados más ingredientes básicos.
5. MUY IMPORTANTE: En los textos NO uses comillas dobles. Si necesitas enfatizar algo, usa comillas simples.
6. RESPETA ESTRICTAMENTE los filtros indicados por el usuario.

ESTRATEGIAS DE REUTILIZACIÓN:
- Si hay pollo un día, usá el caldo o sobras al día siguiente
- Si hay verduras frescas, distribuílas en varias recetas
- Sugerí bases comunes (arroz, pasta) que sirvan para múltiples platos
- Pensá en ingredientes versátiles que aparezcan 2-3 veces en la semana

FORMATO DE RESPUESTA (JSON válido estricto):
{
  "weeklyPlan": [
    {
      "dayOfWeek": 0,
      "mealType": "almuerzo",
      "recipe": {
        "name": "Nombre de la receta",
        "time": 30,
        "difficulty": "fácil",
        "servings": 4,
        "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
        "steps": ["Paso 1", "Paso 2"],
        "tip": "Consejo práctico",
        "variation": "Alternativa opcional",
        "nutrition": {
          "calories": 200,
          "protein": 10,
          "carbs": 25,
          "fat": 8,
          "fiber": 3
        },
        "tags": ["tag1", "tag2"]
      },
      "reuseNote": "Este pollo se puede usar mañana en ensalada"
    }
  ],
  "smartTips": [
    "Consejo 1 para optimizar compras",
    "Consejo 2 para reutilizar ingredientes"
  ]
}

IMPORTANTE: 
- Respondé ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown.
- Solo generá recetas para los slots que NO tienen receta asignada.
- Incluí notas de reutilización cuando aplique.`;

interface Filters {
  difficulty?: string | null;
  diet?: string[];
  excludeIngredients?: string[];
  servings?: number | null;
  cookingMethod?: string | null;
  budget?: string | null;
  maxTime?: number | null;
}

function buildFiltersPrompt(filters: Filters): string {
  const lines: string[] = [];

  if (filters.difficulty) {
    lines.push(`- Dificultad: ${filters.difficulty}`);
  }
  if (filters.diet && filters.diet.length > 0) {
    lines.push(`- Preferencias dietéticas: ${filters.diet.join(', ')}`);
  }
  if (filters.excludeIngredients && filters.excludeIngredients.length > 0) {
    lines.push(`- NO USAR estos ingredientes: ${filters.excludeIngredients.join(', ')}`);
  }
  if (filters.servings) {
    lines.push(`- Porciones por receta: ${filters.servings} personas`);
  }
  if (filters.cookingMethod) {
    const methods: Record<string, string> = {
      'horno': 'horno',
      'sarten': 'sartén',
      'olla': 'olla',
      'airfryer': 'airfryer',
      'sin-coccion': 'sin cocción',
      'microondas': 'microondas'
    };
    lines.push(`- Método de cocción preferido: ${methods[filters.cookingMethod] || filters.cookingMethod}`);
  }
  if (filters.budget) {
    const budgets: Record<string, string> = {
      'bajo': 'económico (ingredientes baratos)',
      'medio': 'moderado',
      'alto': 'premium (sin límite de precio)'
    };
    lines.push(`- Presupuesto: ${budgets[filters.budget] || filters.budget}`);
  }
  if (filters.maxTime) {
    lines.push(`- Tiempo máximo por receta: ${filters.maxTime} minutos`);
  }

  return lines.length > 0 ? `\nFILTROS OBLIGATORIOS (respetá todos):\n${lines.join('\n')}\n` : '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication
    const { authenticated, userId } = await checkAuth(req);
    
    if (!authenticated || !userId) {
      console.log('Rejected: No authenticated user for generate-weekly-calendar');
      return new Response(JSON.stringify({ 
        error: 'Necesitás iniciar sesión para generar tu calendario semanal',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authorized: User ${userId} accessing generate-weekly-calendar`);

    const { ingredients, existingPlans, filters } = await req.json();
    
    console.log('Generating weekly calendar with:', { 
      ingredientsCount: ingredients?.length || 0,
      existingPlansCount: existingPlans?.length || 0,
      hasFilters: !!filters
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the list of empty slots
    const allSlots: { day: number; meal: string }[] = [];
    for (let day = 0; day < 7; day++) {
      allSlots.push({ day, meal: 'almuerzo' });
      allSlots.push({ day, meal: 'cena' });
    }

    const occupiedSlots = new Set(
      (existingPlans || []).map((p: { day: number; meal: string }) => `${p.day}-${p.meal}`)
    );

    const emptySlots = allSlots.filter(s => !occupiedSlots.has(`${s.day}-${s.meal}`));

    if (emptySlots.length === 0) {
      return new Response(JSON.stringify({ 
        weeklyPlan: [],
        message: 'Tu semana ya está completa!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    let userPrompt = `Ingredientes disponibles: ${ingredients?.length > 0 ? ingredients.join(', ') : 'ingredientes básicos de cocina'}\n\n`;
    
    userPrompt += `Slots a llenar:\n`;
    emptySlots.forEach(slot => {
      userPrompt += `- ${dayNames[slot.day]} ${slot.meal}\n`;
    });

    if (existingPlans && existingPlans.length > 0) {
      userPrompt += `\nRecetas ya planificadas (consideralas para reutilizar ingredientes):\n`;
      existingPlans.forEach((p: { day: number; meal: string; recipeName: string }) => {
        userPrompt += `- ${dayNames[p.day]} ${p.meal}: ${p.recipeName}\n`;
      });
    }

    // Add filters to prompt
    const filtersPrompt = buildFiltersPrompt(filters || {});
    userPrompt += filtersPrompt;

    userPrompt += `\nGenerá recetas variadas que aprovechen ingredientes en común. Máximo ${Math.min(emptySlots.length, 10)} recetas.`;

    // Multiple models for fallback
    const models = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
      'openai/gpt-5-nano',
      'openai/gpt-5-mini',
      'google/gemini-2.5-pro',
      'google/gemini-3-pro-preview',
      'openai/gpt-5'
    ];
    
    let response: Response | null = null;
    let successfulModel = '';
    
    for (const model of models) {
      console.log(`Trying model for weekly calendar: ${model}`);
      
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
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
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
            }),
          });

          if (response.ok) {
            successfulModel = model;
            console.log(`Weekly calendar success with model: ${model}`);
            break;
          }
          
          const errorText = await response.text();
          console.error(`Model ${model} error (attempt ${attempt + 1}):`, response.status, errorText);
          
          if (response.status === 429) break;
        } catch (fetchError) {
          console.error(`Fetch error with ${model}:`, fetchError);
        }
      }
      
      if (response?.ok) break;
    }
    
    if (!response || !response.ok) {
      return new Response(JSON.stringify({ 
        error: 'Todos los servicios están ocupados. Por favor, esperá 30 segundos e intentá de nuevo.',
        retryable: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Por favor, esperá un momento.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos agotados. Contactá al administrador.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    let result;
    try {
      let cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        result = JSON.parse(cleanContent);
      } catch (firstError) {
        const jsonStart = cleanContent.indexOf('{');
        const jsonEnd = cleanContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
        result = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      console.error('Failed to parse weekly calendar JSON:', content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse weekly calendar response');
    }

    console.log('Parsed weekly plan items:', result.weeklyPlan?.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-weekly-calendar function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar el plan semanal';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
