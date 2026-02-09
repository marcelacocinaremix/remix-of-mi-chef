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
  const ingredientsLower = ingredients.map(i => i.toLowerCase());
  
  const hasProtein = ingredientsLower.some(i => 
    ['pollo', 'carne', 'cerdo', 'pescado', 'huevo', 'atun', 'jamon', 'bondiola', 'milanesa', 'bife'].some(p => i.includes(p))
  );
  const hasVeggies = ingredientsLower.some(i =>
    ['tomate', 'cebolla', 'papa', 'zanahoria', 'zapallo', 'lechuga', 'morron', 'pimiento'].some(v => i.includes(v))
  );
  const hasPasta = ingredientsLower.some(i => 
    ['fideos', 'pasta', 'arroz', 'spaghetti', 'tallarines', 'ñoquis'].some(p => i.includes(p))
  );
  const hasEggs = ingredientsLower.some(i => i.includes('huevo'));
  const hasCheese = ingredientsLower.some(i => 
    ['queso', 'muzzarella', 'parmesano', 'cremoso'].some(q => i.includes(q))
  );

  const recipes = [];

  // Recipe 1: Based on main ingredient type
  if (hasProtein) {
    recipes.push({
      name: "Salteado express con proteína",
      time: Math.min(time, 25),
      difficulty: "fácil",
      servings: 2,
      ingredients: [
        ...ingredients.slice(0, 4).map(i => `${i} (cantidad a gusto)`),
        "2 cucharadas de aceite de oliva",
        "Sal, pimienta y ajo en polvo",
        "1 cucharada de salsa de soja (opcional)"
      ],
      steps: [
        "Cortá la proteína en cubos o tiras parejas",
        "Calentá el aceite en una sartén grande o wok a fuego alto",
        "Sellá la proteína 2-3 minutos sin mover mucho",
        "Agregá las verduras cortadas y salteá 3-4 minutos más",
        "Condimentá con sal, pimienta y un toque de salsa de soja si tenés",
        "Serví bien caliente, podés acompañar con arroz"
      ],
      tip: "La clave es tener la sartén bien caliente y no sobrecargarla para que todo se dore bien",
      nutrition: { calories: 320, protein: 25, carbs: 15, fat: 18, fiber: 3 },
      tags: ["rápido", "proteico", "versátil"]
    });
  }

  if (hasPasta) {
    recipes.push({
      name: "Pasta rápida con lo que hay",
      time: Math.min(time, 20),
      difficulty: "fácil",
      servings: 2,
      ingredients: [
        "250g de pasta o fideos",
        ...ingredients.filter(i => !['fideos', 'pasta', 'arroz'].some(p => i.toLowerCase().includes(p))).slice(0, 3).map(i => `${i} picado`),
        "3 cucharadas de aceite de oliva",
        "2 dientes de ajo picados",
        "Sal, pimienta y queso rallado"
      ],
      steps: [
        "Poné a hervir agua con sal para la pasta",
        "Mientras, salteá el ajo en aceite a fuego bajo (que no se queme)",
        "Agregá los otros ingredientes picados y salteá 3-4 minutos",
        "Cociná la pasta al dente, reservá 1 taza del agua de cocción",
        "Mezclá la pasta con el salteado, agregá agua de cocción si queda seco",
        "Serví con abundante queso rallado"
      ],
      tip: "El agua de cocción tiene almidón y ayuda a que la salsa se pegue a la pasta",
      nutrition: { calories: 380, protein: 12, carbs: 55, fat: 14, fiber: 4 },
      tags: ["clásico", "reconfortante", "fácil"]
    });
  }

  // Recipe with eggs (universal)
  if (hasEggs || recipes.length < 1) {
    recipes.push({
      name: "Tortilla versátil rellena",
      time: Math.min(time, 20),
      difficulty: "fácil", 
      servings: 2,
      ingredients: [
        "4 huevos",
        ...ingredients.filter(i => !i.toLowerCase().includes('huevo')).slice(0, 3).map(i => `${i} picado fino`),
        "Sal y pimienta a gusto",
        "2 cucharadas de aceite",
        "Queso rallado (opcional)"
      ],
      steps: [
        "Batí los huevos con sal, pimienta y un chorrito de leche si tenés",
        "Salteá los ingredientes picados en la sartén con aceite 3-4 min",
        "Volcá los huevos batidos sobre los ingredientes",
        "Cocinala a fuego bajo tapada 4-5 minutos",
        "Si le ponés queso, agregalo antes de dar vuelta",
        "Dala vuelta con ayuda de un plato y terminá la cocción 2 min más"
      ],
      tip: "A fuego bajo queda más jugosa por dentro. Si querés más esponjosa, separá las claras y batílas a nieve",
      nutrition: { calories: 280, protein: 18, carbs: 8, fat: 20, fiber: 2 },
      tags: ["clásico", "económico", "proteico", "versátil"]
    });
  }

  // Veggie option
  if (hasVeggies && recipes.length < 2) {
    recipes.push({
      name: "Verduras salteadas al wok",
      time: Math.min(time, 15),
      difficulty: "fácil",
      servings: 2,
      ingredients: [
        ...ingredients.slice(0, 5).map(i => `${i} cortado en juliana`),
        "3 cucharadas de aceite",
        "1 cucharada de salsa de soja",
        "1 diente de ajo picado",
        "Jengibre rallado (opcional)",
        "Semillas de sésamo para decorar"
      ],
      steps: [
        "Cortá todas las verduras en tiras o juliana fina",
        "Calentá el aceite en wok o sartén grande a fuego muy alto",
        "Salteá el ajo 30 segundos, que no se queme",
        "Agregá las verduras más duras primero, luego las blandas",
        "Salteá 4-5 minutos moviendo constantemente",
        "Terminá con salsa de soja y semillas de sésamo"
      ],
      tip: "El secreto del wok es el fuego muy alto y mover rápido para que las verduras queden crocantes",
      nutrition: { calories: 180, protein: 5, carbs: 20, fat: 10, fiber: 6 },
      tags: ["saludable", "vegetariano", "rápido", "liviano"]
    });
  }

  // Cheese-based option
  if (hasCheese && recipes.length < 2) {
    recipes.push({
      name: "Tostadas gratinadas express",
      time: Math.min(time, 15),
      difficulty: "muy fácil",
      servings: 2,
      ingredients: [
        "4 rebanadas de pan",
        "150g de queso (el que tengas)",
        ...ingredients.filter(i => !i.toLowerCase().includes('queso')).slice(0, 2).map(i => `${i} en rodajas`),
        "Orégano y aceite de oliva",
        "Sal y pimienta"
      ],
      steps: [
        "Precalentá el horno a 200°C o usá el grill",
        "Disponé las rebanadas de pan en una fuente",
        "Agregá los ingredientes cortados sobre el pan",
        "Cubrí generosamente con queso",
        "Llevá al horno/grill 5-7 minutos hasta que gratine",
        "Condimentá con orégano y un hilo de aceite al servir"
      ],
      tip: "Si querés que quede más crocante, tostá un poco el pan antes de armar",
      nutrition: { calories: 350, protein: 15, carbs: 30, fat: 18, fiber: 2 },
      tags: ["rápido", "comfort food", "fácil"]
    });
  }

  // Universal fallback if nothing else matched
  if (recipes.length < 2) {
    recipes.push({
      name: "Revuelto rápido multiuso",
      time: Math.min(time, 15),
      difficulty: "muy fácil",
      servings: 2,
      ingredients: [
        "3 huevos",
        ...ingredients.slice(0, 3).map(i => `${i} picado`),
        "1 cucharada de manteca o aceite",
        "Sal y pimienta",
        "Queso crema o rallado (opcional)"
      ],
      steps: [
        "Batí los huevos ligeramente con sal y pimienta",
        "Derretí la manteca en sartén a fuego medio-bajo",
        "Si tenés ingredientes que necesitan cocción, salteálos primero",
        "Agregá los huevos y revolvé suavemente con espátula",
        "Cuando estén casi cuajados, retirá del fuego (siguen cocinándose)",
        "Serví inmediatamente, el revuelto no espera"
      ],
      tip: "El secreto del revuelto cremoso es sacarlo del fuego antes de que esté totalmente cocido",
      nutrition: { calories: 250, protein: 16, carbs: 5, fat: 18, fiber: 1 },
      tags: ["desayuno", "rápido", "proteico"]
    });
  }

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
      quickFilters,
      difficulty, 
      diet, 
      excludeIngredients, 
      servings, 
      cookingMethod, 
      budget, 
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
        // Handle combined mealType (moment + category separated by comma)
        const mealTypeParts = mealType.split(',').map((p: string) => p.trim());
        const mealDescriptions = mealTypeParts.map((mt: string) => mealTypes[mt] || mt).filter(Boolean);
        if (mealDescriptions.length > 0) {
          userPrompt += `Tipo de comida: ${mealDescriptions.join(' y ')}\n`;
        }
      }

      // Process quick filters
      if (quickFilters && quickFilters.length > 0) {
        const quickFilterLabels: Record<string, string> = {
          'vegetariano': 'vegetariano (sin carne ni pescado)',
          'bajo-calorias': 'bajo en calorías/light',
          'sin-gluten': 'sin gluten',
          'sin-lactosa': 'sin lácteos',
          'ninos': 'apto para niños (sabores suaves, presentación atractiva)',
          'economico': 'económico/bajo presupuesto',
          'alto-proteina': 'alto en proteínas'
        };
        const filterDescriptions = quickFilters.map((f: string) => quickFilterLabels[f] || f);
        userPrompt += `Filtros adicionales: ${filterDescriptions.join(', ')}\n`;
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

      // Time is already included in the main time parameter

      if (randomize) {
        userPrompt += `IMPORTANTE: Sorprendeme con una receta creativa e inesperada. Sugiere solo UNA receta.\n`;
      }

      if (excludeRecipes && excludeRecipes.length > 0) {
        userPrompt += `IMPORTANTE - NO sugerir estas recetas que ya cociné recientemente: ${excludeRecipes.join(', ')}\n`;
      }
    }

    console.log('User prompt:', userPrompt);

    // Multiple models for fallback - ALL available models for maximum reliability
    // Alternating between providers to maximize chances of getting a response
    const models = [
      'google/gemini-2.5-flash-lite', // Primary: fastest, cheapest
      'openai/gpt-5-nano',            // Alt provider 1
      'google/gemini-2.5-flash',      // Gemini fallback 1
      'openai/gpt-5-mini',            // Alt provider 2
      'google/gemini-3-flash-preview',// Gemini fast preview
      'google/gemini-2.5-pro',        // Gemini powerful
      'openai/gpt-5',                 // OpenAI powerful
      'google/gemini-3-pro-preview',  // Next-gen Gemini
    ];
    
    let response: Response | null = null;
    let successfulModel = '';
    
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      try {
        // Single attempt per model with quick timeout to cycle through faster
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
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
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          successfulModel = model;
          console.log(`Success with model: ${model}`);
          break;
        }
        
        const errorText = await response.text();
        console.error(`Model ${model} error:`, response.status, errorText);
        
        if (response.status === 402) {
          // Payment required - but still try to give recipes from cache/emergency
          console.log('402 error - will try cache/emergency fallback');
          break;
        }
        
        // For 429 or other errors, immediately try next model
        response = null;
      } catch (fetchError) {
        console.error(`Fetch error with ${model}:`, fetchError);
        response = null;
      }
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
    
    // Even on unexpected errors, try to return emergency recipes
    try {
      console.log('Attempting emergency recipe fallback after error');
      const emergencyRecipes = getEmergencyRecipes(['huevo', 'cebolla', 'papa'], 30, 'es');
      
      return new Response(JSON.stringify({
        recipes: emergencyRecipes,
        source: 'emergency',
        isInstant: true,
        fallbackReason: 'unexpected_error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (emergencyError) {
      // Absolute last resort - return a hardcoded simple recipe
      console.error('Emergency fallback also failed:', emergencyError);
      return new Response(JSON.stringify({
        recipes: [{
          name: "Huevos revueltos clásicos",
          time: 10,
          difficulty: "muy fácil",
          servings: 2,
          ingredients: ["3 huevos", "1 cda de manteca", "Sal y pimienta", "Queso rallado (opcional)"],
          steps: [
            "Batí los huevos con sal y pimienta",
            "Derretí la manteca en sartén a fuego medio-bajo",
            "Agregá los huevos y revolvé suavemente",
            "Retirá cuando estén cremosos (siguen cocinándose)",
            "Serví de inmediato con queso si querés"
          ],
          tip: "El secreto es sacarlos antes de que estén totalmente cocidos",
          nutrition: { calories: 220, protein: 14, carbs: 2, fat: 16, fiber: 0 },
          tags: ["rápido", "clásico", "proteico"]
        }],
        source: 'hardcoded',
        isInstant: true,
        fallbackReason: 'total_failure'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});
