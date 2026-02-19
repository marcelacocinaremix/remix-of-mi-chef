import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common Argentine ingredient combinations to seed
const INGREDIENT_COMBOS = [
  // Carnes
  { ingredients: ["pollo", "papa"], time: 45, mealType: "almuerzo" },
  { ingredients: ["pollo", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "verduras"], time: 35, mealType: "cena" },
  { ingredients: ["pollo", "cebolla", "morron"], time: 30, mealType: "almuerzo" },
  { ingredients: ["pollo", "tomate", "cebolla"], time: 35, mealType: "almuerzo" },
  { ingredients: ["pollo", "papa", "zanahoria"], time: 50, mealType: "almuerzo" },
  { ingredients: ["pollo", "fideos"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "batata"], time: 40, mealType: "cena" },
  { ingredients: ["pollo", "choclo"], time: 35, mealType: "almuerzo" },
  { ingredients: ["pollo", "zapallo"], time: 40, mealType: "cena" },
  { ingredients: ["carne", "papa"], time: 50, mealType: "almuerzo" },
  { ingredients: ["carne", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne", "cebolla"], time: 35, mealType: "almuerzo" },
  { ingredients: ["carne", "tomate", "cebolla"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne molida", "papa"], time: 45, mealType: "almuerzo" },
  { ingredients: ["carne molida", "fideos"], time: 30, mealType: "cena" },
  { ingredients: ["carne molida", "arroz"], time: 35, mealType: "almuerzo" },
  { ingredients: ["carne molida", "cebolla", "morron"], time: 30, mealType: "almuerzo" },
  { ingredients: ["carne molida", "zapallo"], time: 45, mealType: "almuerzo" },
  { ingredients: ["bife", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["bife", "ensalada"], time: 20, mealType: "cena" },
  { ingredients: ["milanesa", "papa"], time: 30, mealType: "almuerzo" },
  { ingredients: ["milanesa", "ensalada"], time: 20, mealType: "cena" },
  { ingredients: ["milanesa", "puré"], time: 30, mealType: "almuerzo" },
  { ingredients: ["cerdo", "papa"], time: 50, mealType: "almuerzo" },
  { ingredients: ["cerdo", "batata"], time: 45, mealType: "cena" },
  { ingredients: ["bondiola", "papa"], time: 60, mealType: "almuerzo" },
  { ingredients: ["matambre", "verduras"], time: 60, mealType: "almuerzo" },
  // Pescado y mariscos
  { ingredients: ["pescado", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["pescado", "arroz"], time: 30, mealType: "cena" },
  { ingredients: ["pescado", "verduras"], time: 25, mealType: "cena" },
  { ingredients: ["merluza", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["atun", "tomate", "cebolla"], time: 15, mealType: "almuerzo" },
  { ingredients: ["atun", "fideos"], time: 20, mealType: "cena" },
  { ingredients: ["atun", "arroz"], time: 20, mealType: "almuerzo" },
  { ingredients: ["salmon", "verduras"], time: 25, mealType: "cena" },
  // Pastas
  { ingredients: ["fideos", "tomate"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "crema"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "queso"], time: 15, mealType: "cena" },
  { ingredients: ["fideos", "salsa", "carne"], time: 30, mealType: "almuerzo" },
  { ingredients: ["fideos", "verduras"], time: 20, mealType: "cena" },
  { ingredients: ["ñoquis", "salsa"], time: 30, mealType: "almuerzo" },
  { ingredients: ["ravioles", "salsa"], time: 25, mealType: "almuerzo" },
  { ingredients: ["lasagna", "carne molida"], time: 60, mealType: "almuerzo" },
  // Arroz
  { ingredients: ["arroz", "pollo", "verduras"], time: 35, mealType: "almuerzo" },
  { ingredients: ["arroz", "huevo"], time: 15, mealType: "cena" },
  { ingredients: ["arroz", "verduras"], time: 25, mealType: "cena" },
  { ingredients: ["arroz", "atun"], time: 20, mealType: "almuerzo" },
  // Huevos
  { ingredients: ["huevo", "papa"], time: 20, mealType: "cena" },
  { ingredients: ["huevo", "cebolla"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "queso"], time: 10, mealType: "desayuno" },
  { ingredients: ["huevo", "tomate"], time: 15, mealType: "desayuno" },
  { ingredients: ["huevo", "espinaca"], time: 15, mealType: "almuerzo" },
  { ingredients: ["huevo", "jamon", "queso"], time: 10, mealType: "desayuno" },
  { ingredients: ["huevo", "papa", "cebolla"], time: 25, mealType: "cena" },
  { ingredients: ["huevo", "verduras"], time: 20, mealType: "cena" },
  // Vegetarianas
  { ingredients: ["papa", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["papa", "huevo", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["zapallo", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["calabaza", "queso"], time: 35, mealType: "cena" },
  { ingredients: ["berenjena", "tomate", "queso"], time: 35, mealType: "cena" },
  { ingredients: ["espinaca", "ricota"], time: 25, mealType: "cena" },
  { ingredients: ["brócoli", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["choclo", "queso"], time: 20, mealType: "merienda" },
  { ingredients: ["lentejas"], time: 40, mealType: "almuerzo" },
  { ingredients: ["lentejas", "verduras"], time: 45, mealType: "almuerzo" },
  { ingredients: ["garbanzos"], time: 40, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "verduras"], time: 40, mealType: "almuerzo" },
  // Empanadas y tartas
  { ingredients: ["tapas de empanada", "carne"], time: 40, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "pollo"], time: 40, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "jamon", "queso"], time: 30, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "verdura"], time: 35, mealType: "cena" },
  { ingredients: ["tapa pascualina", "espinaca", "huevo"], time: 40, mealType: "cena" },
  { ingredients: ["tapa pascualina", "zapallo", "queso"], time: 40, mealType: "cena" },
  // Desayunos/Meriendas
  { ingredients: ["avena", "banana", "leche"], time: 10, mealType: "desayuno" },
  { ingredients: ["avena", "manzana"], time: 10, mealType: "desayuno" },
  { ingredients: ["banana", "huevo"], time: 15, mealType: "desayuno" },
  { ingredients: ["pan", "huevo", "queso"], time: 10, mealType: "desayuno" },
  { ingredients: ["harina", "huevo", "leche"], time: 20, mealType: "merienda" },
  { ingredients: ["harina", "banana"], time: 25, mealType: "merienda" },
  { ingredients: ["harina", "chocolate"], time: 30, mealType: "merienda" },
  { ingredients: ["harina", "manzana"], time: 35, mealType: "merienda" },
  { ingredients: ["yogur", "avena", "fruta"], time: 5, mealType: "desayuno" },
  // Sopas y guisos
  { ingredients: ["papa", "zanahoria", "cebolla"], time: 40, mealType: "cena" },
  { ingredients: ["zapallo", "papa", "cebolla"], time: 40, mealType: "cena" },
  { ingredients: ["pollo", "papa", "zanahoria", "cebolla"], time: 50, mealType: "almuerzo" },
  { ingredients: ["carne", "papa", "zanahoria", "choclo"], time: 60, mealType: "almuerzo" },
  { ingredients: ["lentejas", "papa", "zanahoria"], time: 45, mealType: "almuerzo" },
  // Sandwiches y rápidos
  { ingredients: ["pan", "jamon", "queso"], time: 10, mealType: "merienda" },
  { ingredients: ["pan", "tomate", "lechuga"], time: 10, mealType: "almuerzo" },
  { ingredients: ["pan", "atun", "tomate"], time: 10, mealType: "almuerzo" },
  { ingredients: ["tortilla", "pollo", "lechuga"], time: 15, mealType: "almuerzo" },
  // Ensaladas
  { ingredients: ["lechuga", "tomate", "cebolla"], time: 10, mealType: "cena" },
  { ingredients: ["lechuga", "pollo", "tomate"], time: 15, mealType: "cena" },
  { ingredients: ["rúcula", "tomate", "parmesano"], time: 10, mealType: "cena" },
  { ingredients: ["quinoa", "verduras"], time: 25, mealType: "almuerzo" },
  // Pizza
  { ingredients: ["harina", "tomate", "queso"], time: 40, mealType: "cena" },
  { ingredients: ["harina", "mozzarella", "jamon"], time: 40, mealType: "cena" },
  // Dulces
  { ingredients: ["harina", "azucar", "huevo", "manteca"], time: 40, mealType: "merienda" },
  { ingredients: ["chocolate", "huevo", "harina"], time: 35, mealType: "merienda" },
  { ingredients: ["dulce de leche", "harina", "manteca"], time: 30, mealType: "merienda" },
  { ingredients: ["banana", "avena", "miel"], time: 20, mealType: "merienda" },
  { ingredients: ["manzana", "azucar", "harina"], time: 40, mealType: "merienda" },
  // Más combinaciones populares
  { ingredients: ["pollo", "crema", "champignones"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "mostaza", "crema"], time: 30, mealType: "cena" },
  { ingredients: ["carne", "morron", "cebolla"], time: 35, mealType: "almuerzo" },
  { ingredients: ["cerdo", "miel", "mostaza"], time: 40, mealType: "cena" },
  { ingredients: ["salmon", "limon", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "limon", "ajo"], time: 35, mealType: "cena" },
  { ingredients: ["carne molida", "tomate", "cebolla"], time: 30, mealType: "almuerzo" },
  { ingredients: ["papa", "queso", "crema"], time: 30, mealType: "cena" },
  { ingredients: ["calabaza", "papa", "cebolla"], time: 35, mealType: "cena" },
  { ingredients: ["batata", "pollo"], time: 35, mealType: "cena" },
  { ingredients: ["fideos", "pollo", "crema"], time: 25, mealType: "cena" },
  { ingredients: ["arroz", "pollo", "curry"], time: 30, mealType: "cena" },
  { ingredients: ["arroz", "camarones"], time: 25, mealType: "cena" },
  { ingredients: ["pollo", "palta"], time: 20, mealType: "almuerzo" },
  { ingredients: ["carne", "papa", "batata"], time: 50, mealType: "almuerzo" },
  { ingredients: ["zapallito", "carne molida", "queso"], time: 35, mealType: "cena" },
  { ingredients: ["berenjena", "carne molida", "queso"], time: 40, mealType: "cena" },
  { ingredients: ["espinaca", "pollo", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["brócoli", "pollo"], time: 25, mealType: "cena" },
  { ingredients: ["zanahoria", "pollo", "arroz"], time: 35, mealType: "almuerzo" },
  { ingredients: ["tomate", "queso", "albahaca"], time: 15, mealType: "cena" },
  { ingredients: ["palta", "tomate", "cebolla"], time: 10, mealType: "almuerzo" },
  { ingredients: ["pollo", "papa", "queso"], time: 40, mealType: "almuerzo" },
  { ingredients: ["fideos", "tomate", "albahaca"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "huevo", "verduras"], time: 20, mealType: "cena" },
  { ingredients: ["papa", "huevo"], time: 20, mealType: "cena" },
];

const SYSTEM_PROMPT = `Eres un generador de recetas argentinas caseras. Generá recetas prácticas, accesibles y sabrosas.

REGLAS ESTRICTAS:
1. La receta DEBE usar TODOS los ingredientes proporcionados como ingredientes principales.
2. Solo podés agregar ingredientes complementarios básicos: sal, pimienta, aceite, ajo, cebolla, condimentos.
3. NO sustituyas ingredientes principales por otros.
4. La receta debe poder hacerse en el tiempo indicado.
5. Priorizá recetas caseras argentinas, económicas y simples.
6. Incluí información nutricional estimada por porción.
7. NO uses comillas dobles dentro de strings.
8. Generá recetas DISTINTAS y variadas. Evitá repetir nombres genéricos.

FORMATO (JSON estricto, SIN texto extra):
{
  "recipes": [
    {
      "name": "Nombre creativo y descriptivo",
      "time": 30,
      "difficulty": "fácil",
      "servings": 2,
      "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
      "steps": ["Paso 1 detallado", "Paso 2 detallado"],
      "tip": "Consejo práctico",
      "variation": "Variación opcional",
      "nutrition": { "calories": 300, "protein": 20, "carbs": 30, "fat": 12, "fiber": 4 },
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchStart = 0, batchSize = 10 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const combos = INGREDIENT_COMBOS.slice(batchStart, batchStart + batchSize);
    
    if (combos.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No more combos to process',
        totalCombos: INGREDIENT_COMBOS.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let added = 0;
    let skipped = 0;
    let errors = 0;
    const results: string[] = [];

    for (const combo of combos) {
      try {
        // Check if we already have a recipe for this exact combo
        const comboKey = combo.ingredients.sort().join('+');
        
        const prompt = `Ingredientes: ${combo.ingredients.join(', ')}
Tiempo máximo: ${combo.time} minutos
Tipo de comida: ${combo.mealType}

Generá 1 receta casera argentina usando TODOS estos ingredientes como ingredientes principales. Sé creativo con el nombre.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ],
            temperature: 0.9,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${comboKey}: ${aiResponse.status} ${errText}`);
          if (aiResponse.status === 429) {
            // Rate limited - wait and continue
            results.push(`⏳ ${comboKey}: rate limited, stopping batch`);
            break;
          }
          errors++;
          results.push(`❌ ${comboKey}: AI error ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        let recipes: any[] = [];
        try {
          const jsonMatch = content.match(/\{[\s\S]*"recipes"[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            recipes = parsed.recipes || [];
          }
        } catch (parseErr) {
          console.error(`Parse error for ${comboKey}:`, parseErr);
          errors++;
          results.push(`❌ ${comboKey}: parse error`);
          continue;
        }

        for (const recipe of recipes) {
          if (!recipe.name || !recipe.ingredients || !recipe.steps) continue;

          // Check for duplicate name
          const normalizedName = removeAccents(recipe.name.toLowerCase().trim());
          const { data: existing } = await supabase
            .from('cached_recipes')
            .select('id')
            .ilike('recipe_name', `%${recipe.name.slice(0, 20)}%`)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            results.push(`⏭️ ${recipe.name}: duplicate`);
            continue;
          }

          // Determine time range
          let timeRange = 'medium';
          if (combo.time <= 15) timeRange = 'quick';
          else if (combo.time <= 30) timeRange = 'medium';
          else if (combo.time <= 45) timeRange = 'long';
          else timeRange = 'extra-long';

          const { error: insertError } = await supabase
            .from('cached_recipes')
            .insert({
              recipe_name: recipe.name,
              recipe_data: recipe,
              main_ingredients: combo.ingredients,
              time_range: timeRange,
              meal_type: combo.mealType,
              language: 'es',
              difficulty: recipe.difficulty || 'fácil',
              tags: recipe.tags || [],
              usage_count: 0
            });

          if (insertError) {
            console.error(`Insert error for ${recipe.name}:`, insertError);
            errors++;
            results.push(`❌ ${recipe.name}: insert error`);
          } else {
            added++;
            results.push(`✅ ${recipe.name} [${combo.ingredients.join(', ')}]`);
          }
        }

        // Small delay between AI calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (comboErr) {
        console.error(`Error processing combo:`, comboErr);
        errors++;
      }
    }

    return new Response(JSON.stringify({
      message: `Batch done: ${added} added, ${skipped} skipped, ${errors} errors`,
      added,
      skipped,
      errors,
      results,
      nextBatch: batchStart + batchSize,
      totalCombos: INGREDIENT_COMBOS.length,
      remaining: Math.max(0, INGREDIENT_COMBOS.length - (batchStart + batchSize))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Seed error:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
