import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT = 4;

// Check daily usage limit for users
async function checkUserLimits(req: Request): Promise<{ 
  allowed: boolean; 
  userId: string | null; 
  usesToday: number; 
  remaining: number;
  message?: string;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = req.headers.get('Authorization');
  
  // For non-authenticated users, allow but don't track
  if (!authHeader) {
    return { allowed: true, userId: null, usesToday: 0, remaining: DAILY_LIMIT };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user) {
    return { allowed: true, userId: null, usesToday: 0, remaining: DAILY_LIMIT };
  }

  // Use service role to call the function (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabaseAdmin.rpc('check_and_increment_daily_uses', {
    p_user_id: user.id,
    p_daily_limit: DAILY_LIMIT
  });

  if (error) {
    console.error('Error checking daily limit:', error);
    // On error, allow but log
    return { allowed: true, userId: user.id, usesToday: 0, remaining: DAILY_LIMIT };
  }

  console.log('Daily limit check result:', data);

  return {
    allowed: data.allowed,
    userId: user.id,
    usesToday: data.uses_today,
    remaining: data.remaining,
    message: data.message
  };
}

// Ingredient synonyms for better matching
const ingredientSynonyms: Record<string, string[]> = {
  'pollo': ['pechuga', 'muslo', 'ala', 'pata'],
  'carne': ['bife', 'lomo', 'picada', 'milanesa', 'nalga', 'cuadril', 'asado'],
  'cerdo': ['bondiola', 'matambre', 'costeleta', 'jamon'],
  'papa': ['patata', 'papas'],
  'tomate': ['tomates', 'cherry', 'perita'],
  'cebolla': ['cebollas', 'cebollita', 'verdeo'],
  'ajo': ['ajos', 'diente de ajo'],
  'queso': ['muzzarella', 'parmesano', 'cremoso', 'rallado', 'cheddar', 'roquefort'],
  'huevo': ['huevos'],
  'leche': ['crema', 'nata'],
  'arroz': ['arroz integral', 'arroz blanco'],
  'pasta': ['fideos', 'spaghetti', 'tallarines', 'mostachol', 'tirabuzón', 'penne'],
  'pan': ['pan rallado', 'pan lactal', 'baguette'],
  'zapallo': ['calabaza', 'anco', 'zapallito'],
  'morron': ['pimiento', 'morrón', 'aji'],
};

// Normalize ingredient for matching
function normalizeIngredient(ingredient: string): string[] {
  const normalized = ingredient.toLowerCase().trim()
    .replace(/s$/, '') // Remove trailing 's' (plural)
    .replace(/es$/, '') // Remove 'es' plural
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
  
  const variants = [normalized];
  
  // Add synonyms
  for (const [base, synonyms] of Object.entries(ingredientSynonyms)) {
    if (normalized.includes(base) || synonyms.some(s => normalized.includes(s))) {
      variants.push(base, ...synonyms);
    }
  }
  
  return [...new Set(variants)];
}

// Search for cached recipes with improved matching
async function searchCachedRecipes(
  ingredients: string[],
  time: number,
  mealType: string | null,
  language: string,
  minMatchScore: number = 0.5 // Minimum 50% ingredient match
): Promise<{ recipes: any[]; fromCache: boolean; matchScore: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Determine time range
  let timeRange = 'medium';
  if (time <= 20) timeRange = 'quick';
  else if (time > 45) timeRange = 'long';
  
  // Normalize all user ingredients with synonyms
  const userIngredientVariants = ingredients.flatMap(i => normalizeIngredient(i));
  
  console.log('Searching cached recipes for:', { 
    ingredients, 
    userIngredientVariants: userIngredientVariants.slice(0, 10), // Log first 10
    timeRange, 
    mealType, 
    language 
  });
  
  // Build query - get more recipes to have better matching options
  let query = supabase
    .from('cached_recipes')
    .select('*')
    .eq('language', language)
    .order('usage_count', { ascending: false }); // Prefer popular recipes
  
  // Filter by time range (allow equal or faster recipes)
  if (timeRange === 'quick') {
    query = query.eq('time_range', 'quick');
  } else if (timeRange === 'medium') {
    query = query.in('time_range', ['quick', 'medium']);
  }
  
  // Filter by meal type if specified
  if (mealType) {
    query = query.eq('meal_type', mealType);
  }
  
  const { data: recipes, error } = await query.limit(50); // Get more for better matching
  
  if (error) {
    console.error('Error searching cached recipes:', error);
    return { recipes: [], fromCache: false, matchScore: 0 };
  }
  
  if (!recipes || recipes.length === 0) {
    console.log('No cached recipes found');
    return { recipes: [], fromCache: false, matchScore: 0 };
  }
  
  // Score recipes by ingredient match with improved algorithm
  const scoredRecipes = recipes.map(recipe => {
    const recipeIngredients = recipe.main_ingredients.map((i: string) => i.toLowerCase());
    const recipeIngredientVariants = recipeIngredients.flatMap((i: string) => normalizeIngredient(i));
    
    let matchedUserIngredients = 0;
    let matchedRecipeIngredients = 0;
    
    // Check how many user ingredients match recipe
    for (const userIngredient of ingredients) {
      const userVariants = normalizeIngredient(userIngredient);
      const hasMatch = userVariants.some((uv: string) => 
        recipeIngredientVariants.some((rv: string) => rv.includes(uv) || uv.includes(rv))
      );
      if (hasMatch) matchedUserIngredients++;
    }
    
    // Check how many recipe ingredients user has
    for (const recipeIngredient of recipeIngredients) {
      const recipeVariants = normalizeIngredient(recipeIngredient);
      const hasMatch = recipeVariants.some((rv: string) =>
        userIngredientVariants.some((uv: string) => uv.includes(rv) || rv.includes(uv))
      );
      if (hasMatch) matchedRecipeIngredients++;
    }
    
    // Combined score: prioritize recipes where user has most ingredients
    const userCoverage = matchedUserIngredients / ingredients.length; // How many user ingredients are used
    const recipeCoverage = matchedRecipeIngredients / recipeIngredients.length; // How complete the recipe is
    
    // Weight recipe coverage more (we want recipes user can actually make)
    const combinedScore = (userCoverage * 0.3) + (recipeCoverage * 0.7);
    
    // Bonus for popular recipes
    const popularityBonus = Math.min((recipe.usage_count || 0) / 100, 0.1);
    
    return {
      ...recipe,
      matchScore: combinedScore + popularityBonus,
      recipeCoverage,
      userCoverage
    };
  });
  
  // Filter recipes that meet minimum threshold and sort by score
  const matchedRecipes = scoredRecipes
    .filter(r => r.matchScore >= minMatchScore && r.recipeCoverage >= 0.6) // At least 60% of recipe ingredients available
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 2);
  
  if (matchedRecipes.length > 0) {
    console.log(`Found ${matchedRecipes.length} cached recipes with scores:`, 
      matchedRecipes.map(r => ({ name: r.recipe_name, score: r.matchScore.toFixed(2), coverage: r.recipeCoverage.toFixed(2) }))
    );
    
    // Increment usage count for returned recipes
    for (const recipe of matchedRecipes) {
      await supabase
        .from('cached_recipes')
        .update({ usage_count: (recipe.usage_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', recipe.id);
    }
    
    return { 
      recipes: matchedRecipes.map(r => r.recipe_data),
      fromCache: true,
      matchScore: matchedRecipes[0].matchScore
    };
  }
  
  console.log('No recipes met the matching threshold');
  return { recipes: [], fromCache: false, matchScore: 0 };
}

// Save AI-generated recipes to cache
async function cacheRecipes(
  recipes: any[],
  ingredients: string[],
  time: number,
  mealType: string | null,
  language: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let timeRange = 'medium';
  if (time <= 20) timeRange = 'quick';
  else if (time > 45) timeRange = 'long';
  
  for (const recipe of recipes) {
    // Extract main ingredients from recipe (first 5 ingredients, simplified)
    const mainIngredients = (recipe.ingredients || [])
      .slice(0, 5)
      .map((i: string) => i.split(' ').slice(-2).join(' ').toLowerCase()); // Last 2 words usually are the ingredient
    
    // Check if similar recipe already exists
    const { data: existing } = await supabase
      .from('cached_recipes')
      .select('id')
      .eq('recipe_name', recipe.name)
      .eq('language', language)
      .maybeSingle();
    
    if (existing) {
      console.log(`Recipe "${recipe.name}" already cached, skipping`);
      continue;
    }
    
    const { error } = await supabase
      .from('cached_recipes')
      .insert({
        recipe_name: recipe.name,
        recipe_data: recipe,
        main_ingredients: mainIngredients.length > 0 ? mainIngredients : ingredients.slice(0, 5),
        time_range: timeRange,
        meal_type: mealType,
        language: language || 'es',
        difficulty: recipe.difficulty,
        tags: recipe.tags || [],
        usage_count: 1
      });
    
    if (error) {
      console.error(`Error caching recipe "${recipe.name}":`, error);
    } else {
      console.log(`Cached new recipe: "${recipe.name}"`);
    }
  }
}

// Emergency fallback recipes when AI and cache both fail
function getEmergencyRecipes(ingredients: string[], time: number, language: string): any[] {
  const hasProtein = ingredients.some(i => 
    ['pollo', 'carne', 'cerdo', 'pescado', 'huevo', 'atun', 'jamon'].some(p => i.toLowerCase().includes(p))
  );
  const hasVeggies = ingredients.some(i =>
    ['tomate', 'cebolla', 'papa', 'zanahoria', 'zapallo', 'lechuga'].some(v => i.toLowerCase().includes(v))
  );
  const hasPasta = ingredients.some(i => 
    ['fideos', 'pasta', 'arroz', 'spaguetti', 'tallarines'].some(p => i.toLowerCase().includes(p))
  );

  const recipes = [];

  // Recipe 1: Based on what user has
  if (hasPasta || hasProtein) {
    recipes.push({
      name: hasProtein ? "Salteado rápido con lo que tenés" : "Pasta express",
      time: Math.min(time, 25),
      difficulty: "fácil",
      servings: 2,
      ingredients: [
        ...(ingredients.slice(0, 3).map(i => `${i} (cantidad a gusto)`)),
        "Sal y pimienta a gusto",
        "2 cucharadas de aceite",
        "Condimentos que tengas a mano"
      ],
      steps: [
        "Cortá todos los ingredientes en trozos parejos",
        "Calentá el aceite en una sartén grande a fuego medio-alto",
        "Agregá los ingredientes de mayor a menor tiempo de cocción",
        "Condimentá a gusto y mezclá bien",
        "Serví caliente, podés agregar queso rallado si tenés"
      ],
      tip: "La clave está en no sobrecargar la sartén para que los ingredientes se doren bien",
      nutrition: { calories: 280, protein: 12, carbs: 30, fat: 10, fiber: 3 },
      tags: ["rápido", "fácil", "versátil"]
    });
  }

  // Recipe 2: Universal option
  recipes.push({
    name: "Tortilla versátil",
    time: Math.min(time, 20),
    difficulty: "fácil", 
    servings: 2,
    ingredients: [
      "3 huevos",
      ...(ingredients.slice(0, 2).map(i => `${i} picado`)),
      "Sal y pimienta",
      "1 cucharada de aceite",
      "Queso rallado (opcional)"
    ],
    steps: [
      "Batí los huevos con sal y pimienta",
      "Salteá los ingredientes picados en la sartén con aceite",
      "Volcá los huevos batidos sobre los ingredientes",
      "Cocinala a fuego bajo tapada 3-4 minutos",
      "Dala vuelta con ayuda de un plato y terminá la cocción"
    ],
    tip: "Si le agregás queso rallado antes de dar vuelta, queda más cremosa",
    nutrition: { calories: 220, protein: 15, carbs: 8, fat: 14, fiber: 2 },
    tags: ["clásico", "económico", "proteico"]
  });

  return recipes.slice(0, 2);
}

const getSystemPrompt = (language: string = 'es') => {
  const langInstructions: Record<string, string> = {
    es: 'Respondé en español rioplatense (argentino). Usá "vos" en lugar de "tú".',
    en: 'Respond in English. Use American English spelling and expressions.',
    pt: 'Responda em português brasileiro. Use expressões brasileiras.',
  };
  
  return `Eres MarcelaCocina, creadora de contenido gastronómico especializada en comida casera, práctica y accesible.
${langInstructions[language] || langInstructions.es}
Tu objetivo es ayudar a personas reales a cocinar bien, sin estrés y con lo que tienen en casa.

INSTRUCCIONES:
1. PRIMERO: Verificá que los ingredientes sean alimentos reales. Si el usuario ingresa cosas que NO son comestibles, respondé con:
   {"recipes": [], "error": "no_food_ingredients"}
2. Sugerí EXACTAMENTE 2 recetas diferentes (solo si hay ingredientes válidos).
3. Cada receta debe poder realizarse dentro del tiempo indicado.
4. Utilizá principalmente los ingredientes indicados. Se permiten ingredientes básicos: sal, aceite, pimienta, condimentos comunes.
5. Priorizá recetas caseras, económicas, simples y realistas.
6. Evitá recetas gourmet o complejas.
7. Incluí información nutricional estimada por porción para cada receta.
8. MUY IMPORTANTE: En los textos NO uses comillas dobles. Si necesitas enfatizar algo, usa comillas simples.

FORMATO DE RESPUESTA (JSON válido estricto):
{
  "recipes": [
    {
      "name": "Nombre de la receta",
      "time": 30,
      "difficulty": "fácil",
      "servings": 4,
      "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
      "steps": ["Paso 1", "Paso 2"],
      "tip": "Consejo práctico sin comillas dobles internas",
      "variation": "Alternativa opcional",
      "nutrition": {
        "calories": 200,
        "protein": 10,
        "carbs": 25,
        "fat": 8,
        "fiber": 3
      },
      "tags": ["tag1", "tag2"]
    }
  ]
}

IMPORTANTE: Respondé ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown, sin comillas dobles dentro de los strings.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      ingredients, 
      time, 
      mealType, 
      difficulty, 
      diet, 
      excludeIngredients, 
      servings, 
      cookingMethod, 
      budget, 
      maxTime, 
      randomize, 
      excludeRecipes, 
      surpriseMode, 
      language,
      useCacheOnly,
      hybridMode
    } = await req.json();
    
    console.log('Request received:', { 
      ingredients, 
      time, 
      mealType, 
      language, 
      surpriseMode, 
      useCacheOnly, 
      hybridMode 
    });

    // Check daily limit BEFORE processing (except for cache-only requests)
    if (!useCacheOnly) {
      const limitCheck = await checkUserLimits(req);
      
      if (!limitCheck.allowed) {
        console.log('User reached daily limit:', limitCheck);
        return new Response(JSON.stringify({
          error: limitCheck.message || '¡Llegaste al límite de recetas por hoy! Volvé mañana 🍳',
          dailyLimitReached: true,
          usesToday: limitCheck.usesToday,
          remaining: limitCheck.remaining
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log(`User ${limitCheck.userId} usage: ${limitCheck.usesToday}/${DAILY_LIMIT}`);
    }
    
    // HYBRID MODE: First try to return cached recipes instantly
    if (hybridMode && ingredients && ingredients.length > 0 && !surpriseMode) {
      const cacheResult = await searchCachedRecipes(
        ingredients, 
        time || 30, 
        mealType, 
        language || 'es'
      );
      
      if (cacheResult.recipes.length > 0) {
        console.log(`Returning ${cacheResult.recipes.length} cached recipes in hybrid mode (score: ${cacheResult.matchScore.toFixed(2)})`);
        return new Response(JSON.stringify({ 
          recipes: cacheResult.recipes,
          source: 'cache',
          isInstant: true,
          matchScore: cacheResult.matchScore
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // CACHE ONLY MODE: Only return cached recipes, don't call AI
    if (useCacheOnly && ingredients && ingredients.length > 0) {
      const cacheResult = await searchCachedRecipes(
        ingredients, 
        time || 30, 
        mealType, 
        language || 'es'
      );
      
      return new Response(JSON.stringify({ 
        recipes: cacheResult.recipes,
        source: 'cache',
        isInstant: true,
        matchScore: cacheResult.matchScore
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const systemPrompt = getSystemPrompt(language || 'es');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build user prompt
    let userPrompt = '';
    
    // Surprise mode - generate recipe without user input
    if (surpriseMode) {
      const categories = ['pasta', 'ensalada', 'guiso', 'tortilla', 'tarta', 'arroz', 'carne', 'pollo', 'pescado', 'vegetariano', 'sopa', 'sandwich especial', 'wrap', 'pizza casera', 'empanadas', 'milanesas', 'revuelto', 'panqueques', 'budín', 'licuado nutritivo'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      userPrompt = `MODO SORPRESA: El usuario no sabe qué cocinar y quiere que le sorprendas.
Generá UNA SOLA receta sorpresa con estas características:
- Tipo de comida: ${mealType || 'almuerzo/cena'}
- Categoría sugerida (podés variar): ${randomCategory}
- Debe ser una receta casera, simple y realista
- Usá ingredientes comunes que suelen estar en una cocina argentina
- Priorizá recetas reconfortantes y deliciosas
- Tiempo máximo: ${time || 60} minutos
`;
      if (excludeRecipes && excludeRecipes.length > 0) {
        userPrompt += `\nIMPORTANTE - NO sugerir estas recetas que ya se cocinaron recientemente: ${excludeRecipes.join(', ')}`;
      }
      userPrompt += `\n\nSorprendé con algo creativo pero realizable!`;
    } else {
      userPrompt = `Ingredientes disponibles: ${ingredients?.join(', ') || 'ninguno especificado'}\n`;
      userPrompt += `Tiempo máximo para cocinar: ${time} minutos\n`;

      if (mealType) {
        const mealTypes: Record<string, string> = {
          desayuno: 'desayuno',
          almuerzo: 'almuerzo',
          merienda: 'merienda',
          cena: 'cena',
          snack: 'snack',
          postre: 'postre',
          rapida: 'comida rápida',
          economica: 'comida económica',
          liviana: 'comida liviana/light',
          'para-chicos': 'comida para niños',
          'para-freezar': 'comida para freezar/congelar'
        };
        userPrompt += `Tipo de comida: ${mealTypes[mealType] || mealType}\n`;
      }

      if (servings) {
        userPrompt += `Cantidad de porciones: ${servings} personas\n`;
      }

      if (cookingMethod) {
        const cookingMethods: Record<string, string> = {
          'horno': 'al horno',
          'sarten': 'en sartén',
          'olla': 'en olla',
          'airfryer': 'en airfryer',
          'sin-coccion': 'sin cocción',
          'microondas': 'en microondas'
        };
        userPrompt += `Método de cocción preferido: ${cookingMethods[cookingMethod] || cookingMethod}\n`;
      }

      if (difficulty) {
        userPrompt += `Nivel de dificultad preferido: ${difficulty}\n`;
      }

      if (diet && diet.length > 0) {
        const dietLabels: Record<string, string> = {
          'vegetariano': 'vegetariano (sin carne ni pescado)',
          'vegano': 'vegano (sin productos animales)',
          'sin-gluten': 'sin gluten',
          'sin-lactosa': 'sin lactosa',
          'bajo-calorias': 'bajo en calorías',
          'saludable': 'saludable y nutritivo'
        };
        const dietDescriptions = diet.map((d: string) => dietLabels[d] || d);
        userPrompt += `Preferencias dietéticas: ${dietDescriptions.join(', ')}\n`;
      }

      if (excludeIngredients && excludeIngredients.length > 0) {
        userPrompt += `IMPORTANTE - NO usar estos ingredientes: ${excludeIngredients.join(', ')}\n`;
      }

      if (budget) {
        const budgetLabels: Record<string, string> = {
          'bajo': 'económico/bajo presupuesto',
          'medio': 'presupuesto moderado',
          'alto': 'sin restricción de presupuesto'
        };
        userPrompt += `Presupuesto: ${budgetLabels[budget] || budget}\n`;
      }

      if (maxTime) {
        userPrompt += `Tiempo máximo estricto: ${maxTime} minutos\n`;
      }

      if (randomize) {
        userPrompt += `IMPORTANTE: Sorprendeme con una receta creativa e inesperada. Sugiere solo UNA receta.\n`;
      }

      if (excludeRecipes && excludeRecipes.length > 0) {
        userPrompt += `IMPORTANTE - NO sugerir estas recetas que ya cociné recientemente: ${excludeRecipes.join(', ')}\n`;
      }
    }

    console.log('User prompt:', userPrompt);

    // Multiple models for fallback - ALL available models for maximum reliability
    const models = [
      'google/gemini-2.5-flash-lite', // Primary: fastest, cheapest
      'google/gemini-2.5-flash',      // Fallback 1: fast and capable
      'openai/gpt-5-nano',            // Fallback 2: OpenAI fast/cheap
      'openai/gpt-5-mini',            // Fallback 3: OpenAI balanced
      'google/gemini-2.5-pro',        // Fallback 4: Gemini powerful
      'google/gemini-3-pro-preview',  // Fallback 5: Next-gen Gemini
      'openai/gpt-5',                 // Fallback 6: OpenAI powerful
    ];
    
    let response: Response | null = null;
    let successfulModel = '';
    
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      // Try each model with 2 retries
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced wait time
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
            console.log(`Success with model: ${model}`);
            break;
          }
          
          const errorText = await response.text();
          console.error(`Model ${model} error (attempt ${attempt + 1}):`, response.status, errorText);
          
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: 'Créditos agotados. Contactá al administrador.' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (response.status === 429) {
            // Rate limited, try next model immediately
            break;
          }
        } catch (fetchError) {
          console.error(`Fetch error with ${model}:`, fetchError);
        }
      }
      
      if (response?.ok) break;
    }

    if (!response || !response.ok) {
      console.error('All models failed');

      // FINAL FALLBACK: return cached recipes if possible (avoid forcing the user to wait)
      if (!surpriseMode && ingredients && ingredients.length > 0) {
        const cacheResult = await searchCachedRecipes(
          ingredients,
          time || 30,
          mealType,
          language || 'es',
          0.2 // Very low threshold for emergency fallback
        );

        if (cacheResult.recipes.length > 0) {
          console.log(`Falling back to ${cacheResult.recipes.length} cached recipes after AI failure`);
          return new Response(JSON.stringify({
            recipes: cacheResult.recipes,
            source: 'cache',
            isInstant: true,
            fallbackReason: 'ai_unavailable',
            matchScore: cacheResult.matchScore
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // EMERGENCY FALLBACK: Return generic recipes when everything fails
      console.log('Using emergency fallback recipes');
      const emergencyRecipes = getEmergencyRecipes(ingredients, time || 30, language || 'es');
      
      return new Response(JSON.stringify({
        recipes: emergencyRecipes,
        source: 'emergency',
        isInstant: true,
        fallbackReason: 'ai_unavailable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI response received from:', successfulModel);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    // Parse the JSON response
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
      console.error('Failed to parse recipe JSON:', content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse recipe response');
    }

    console.log('Parsed recipes count:', result.recipes?.length);

    // Cache the AI-generated recipes for future use (async, don't block response)
    if (result.recipes && result.recipes.length > 0 && !surpriseMode) {
      cacheRecipes(result.recipes, ingredients, time || 30, mealType, language || 'es')
        .catch(err => console.error('Error caching recipes:', err));
    }

    return new Response(JSON.stringify({ 
      ...result,
      source: 'ai',
      model: successfulModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar las recetas';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
