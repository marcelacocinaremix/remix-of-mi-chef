import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT = 8;

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

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabaseAdmin.rpc('check_and_increment_daily_uses', {
    p_user_id: user.id,
    p_daily_limit: DAILY_LIMIT
  });

  if (error) {
    console.error('Error checking daily limit:', error);
    return { allowed: true, userId: user.id, usesToday: 0, remaining: DAILY_LIMIT };
  }

  return {
    allowed: data.allowed,
    userId: user.id,
    usesToday: data.uses_today,
    remaining: data.remaining,
    message: data.message
  };
}

// ============================================================
// INGREDIENT NORMALIZATION SYSTEM
// ============================================================

// Stopwords to remove from ingredient names
const stopwords = new Set([
  'de', 'del', 'la', 'el', 'las', 'los', 'un', 'una', 'unos', 'unas',
  'con', 'sin', 'para', 'por', 'en', 'al', 'a', 'y', 'o', 'e',
  'muy', 'poco', 'mucho', 'bastante', 'algo',
  'fresco', 'fresca', 'frescos', 'frescas',
  'grande', 'grandes', 'chico', 'chica', 'chicos', 'chicas',
  'medio', 'media', 'mediano', 'mediana',
  'cantidad', 'necesaria', 'gusto', 'pizca', 'chorrito',
  'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas',
  'taza', 'tazas', 'vaso', 'vasos',
  'gramo', 'gramos', 'kilo', 'kilos', 'litro', 'litros', 'ml',
  'picado', 'picada', 'picados', 'picadas',
  'cortado', 'cortada', 'cortados', 'cortadas',
  'rallado', 'rallada', 'rallados', 'ralladas',
  'trozo', 'trozos', 'rodaja', 'rodajas', 'rebanada', 'rebanadas',
  'diente', 'dientes', 'ramita', 'ramitas', 'hoja', 'hojas',
]);

// Expanded synonym map: canonical → variants
const ingredientSynonyms: Record<string, string[]> = {
  'pollo':    ['pechuga', 'muslo', 'ala', 'pata', 'pata muslo', 'suprema', 'pollo entero', 'trutro'],
  'carne':    ['bife', 'lomo', 'picada', 'milanesa', 'nalga', 'cuadril', 'asado', 'vacuno', 'ternera', 'vacio', 'entraña', 'tapa', 'paleta', 'osobuco', 'roast beef', 'carne molida'],
  'cerdo':    ['bondiola', 'matambre', 'costeleta', 'jamon', 'panceta', 'chorizo', 'lomo de cerdo', 'costilla', 'solomillo'],
  'pescado':  ['merluza', 'salmon', 'atun', 'trucha', 'lenguado', 'surubi', 'corvina', 'caballa', 'sardina', 'filet de pescado'],
  'papa':     ['patata', 'papas', 'papines'],
  'tomate':   ['tomates', 'cherry', 'perita', 'salsa de tomate', 'pure de tomate', 'tomate triturado'],
  'cebolla':  ['cebollas', 'cebollita', 'verdeo', 'cebolla morada', 'cebolla blanca', 'echalote', 'chalota'],
  'ajo':      ['ajos', 'diente de ajo', 'ajo en polvo'],
  'queso':    ['muzzarella', 'mozzarella', 'parmesano', 'cremoso', 'cheddar', 'roquefort', 'provolone', 'reggianito', 'gruyere', 'fontina', 'brie', 'camembert', 'dambo', 'port salut', 'queso crema', 'ricota'],
  'huevo':    ['huevos', 'clara', 'claras', 'yema', 'yemas'],
  'leche':    ['crema', 'nata', 'crema de leche', 'leche entera', 'leche descremada'],
  'arroz':    ['arroz integral', 'arroz blanco', 'arroz largo', 'arroz yamaní', 'arroz arborio'],
  'pasta':    ['fideos', 'spaghetti', 'tallarines', 'mostachol', 'tirabuzon', 'penne', 'fusilli', 'rigatoni', 'lasagna', 'ravioles', 'ñoquis', 'canelones', 'fetuccini', 'noquis'],
  'pan':      ['pan rallado', 'pan lactal', 'baguette', 'pan de molde', 'pan integral', 'tostada', 'miñon'],
  'zapallo':  ['calabaza', 'anco', 'zapallito', 'zapallito largo', 'zucchini', 'calabacin'],
  'morron':   ['pimiento', 'aji', 'aji rojo', 'aji verde', 'pimiento rojo', 'pimiento verde', 'pimiento amarillo'],
  'batata':   ['boniato', 'camote', 'papa dulce'],
  'banana':   ['banano', 'platano'],
  'choclo':   ['maiz', 'elote', 'mazorca'],
  'poroto':   ['frijol', 'alubia', 'poroto negro', 'poroto colorado', 'poroto blanco', 'garbanzo', 'lenteja'],
  'manteca':  ['mantequilla', 'margarina'],
  'aceite':   ['aceite de oliva', 'aceite de girasol', 'aceite de maiz', 'aceite vegetal'],
  'harina':   ['harina leudante', 'harina 000', 'harina 0000', 'harina integral', 'fecula', 'maicena', 'almidon'],
  'azucar':   ['azucar impalpable', 'azucar mascabo', 'azucar rubia', 'edulcorante', 'stevia', 'miel'],
  'espinaca': ['acelga', 'kale', 'berro', 'rucula'],
  'lechuga':  ['radicheta', 'radicchio', 'escarola'],
};

// Remove accents from text
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Full normalization: lowercase, no accents, no stopwords, no quantities
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  normalized = removeAccents(normalized);
  // Remove quantities and numbers (e.g., "200g", "2 cucharadas")
  normalized = normalized.replace(/\d+[gkml]?\s*/g, '');
  // Split, remove stopwords, rejoin
  const words = normalized.split(/\s+/).filter(w => w.length > 1 && !stopwords.has(w));
  return words.join(' ').trim();
}

// Get the canonical key for an ingredient
function getCanonicalIngredient(ingredient: string): string {
  const normalized = normalizeText(ingredient);
  
  // Check direct match with canonical keys
  for (const [canonical, variants] of Object.entries(ingredientSynonyms)) {
    if (normalized === canonical || normalized.includes(canonical)) return canonical;
    for (const variant of variants) {
      const normVariant = removeAccents(variant.toLowerCase());
      if (normalized.includes(normVariant) || normVariant.includes(normalized)) {
        return canonical;
      }
    }
  }
  
  // No synonym found, return the cleaned text as-is
  return normalized;
}

// Generate all keyword variants for an ingredient (for fuzzy matching)
function getIngredientVariants(ingredient: string): string[] {
  const canonical = getCanonicalIngredient(ingredient);
  const variants = new Set<string>([canonical, normalizeText(ingredient)]);
  
  // Add all synonyms for this canonical
  if (ingredientSynonyms[canonical]) {
    for (const syn of ingredientSynonyms[canonical]) {
      variants.add(removeAccents(syn.toLowerCase()));
    }
  }
  
  return [...variants];
}

// ============================================================
// SMART CACHE SEARCH WITH ≥70% MATCHING
// ============================================================

async function searchCachedRecipes(
  ingredients: string[],
  time: number,
  mealType: string | null,
  language: string,
  minMatchScore: number = 0.7 // 70% threshold
): Promise<{ recipes: any[]; fromCache: boolean; matchScore: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Determine time range
  let timeRange = 'medium';
  if (time <= 20) timeRange = 'quick';
  else if (time > 45) timeRange = 'long';
  
  // Normalize all user ingredients to canonical forms
  const userCanonicals = ingredients.map(i => getCanonicalIngredient(i));
  const userVariantsFlat = ingredients.flatMap(i => getIngredientVariants(i));
  
  console.log('Smart search:', { 
    raw: ingredients, 
    canonicals: userCanonicals,
    timeRange, 
    mealType,
    threshold: minMatchScore 
  });
  
  // Build query
  let query = supabase
    .from('cached_recipes')
    .select('*')
    .eq('language', language)
    .order('usage_count', { ascending: false });
  
  if (timeRange === 'quick') {
    query = query.eq('time_range', 'quick');
  } else if (timeRange === 'medium') {
    query = query.in('time_range', ['quick', 'medium']);
  }
  
  if (mealType) {
    query = query.eq('meal_type', mealType);
  }
  
  const { data: recipes, error } = await query.limit(80);
  
  if (error || !recipes || recipes.length === 0) {
    if (error) console.error('Cache search error:', error);
    return { recipes: [], fromCache: false, matchScore: 0 };
  }
  
  // Score each cached recipe by ingredient similarity
  const scoredRecipes = recipes.map(recipe => {
    const recipeKeys: string[] = (recipe.main_ingredients || []).map((i: string) => 
      getCanonicalIngredient(i)
    );
    const recipeVariants = (recipe.main_ingredients || []).flatMap((i: string) => 
      getIngredientVariants(i)
    );
    
    // How many of the USER's ingredients does this recipe use?
    let matchedUserCount = 0;
    for (const userCanonical of userCanonicals) {
      const userVars = getIngredientVariants(userCanonical);
      const hit = userVars.some(uv => 
        recipeVariants.some(rv => rv.includes(uv) || uv.includes(rv))
      );
      if (hit) matchedUserCount++;
    }
    
    // How many of the RECIPE's key ingredients does the user have?
    let matchedRecipeCount = 0;
    for (const rk of recipeKeys) {
      const rkVars = getIngredientVariants(rk);
      const hit = rkVars.some(rv =>
        userVariantsFlat.some(uv => uv.includes(rv) || rv.includes(uv))
      );
      if (hit) matchedRecipeCount++;
    }
    
    const userCoverage = userCanonicals.length > 0 ? matchedUserCount / userCanonicals.length : 0;
    const recipeCoverage = recipeKeys.length > 0 ? matchedRecipeCount / recipeKeys.length : 0;
    
    // Combined: weight recipe coverage more (can the user actually make it?)
    const combinedScore = (userCoverage * 0.35) + (recipeCoverage * 0.65);
    
    // Small popularity bonus
    const popularityBonus = Math.min((recipe.usage_count || 0) / 200, 0.05);
    
    return {
      ...recipe,
      matchScore: combinedScore + popularityBonus,
      recipeCoverage,
      userCoverage
    };
  });
  
  // Filter and sort
  const matched = scoredRecipes
    .filter(r => r.matchScore >= minMatchScore && r.recipeCoverage >= 0.5)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 2);
  
  if (matched.length > 0) {
    console.log(`Cache HIT: ${matched.length} recipes`, 
      matched.map(r => ({ name: r.recipe_name, score: r.matchScore.toFixed(2) }))
    );
    
    // Increment usage count
    for (const recipe of matched) {
      await supabase
        .from('cached_recipes')
        .update({ usage_count: (recipe.usage_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', recipe.id);
    }
    
    return { 
      recipes: matched.map(r => r.recipe_data),
      fromCache: true,
      matchScore: matched[0].matchScore
    };
  }
  
  console.log('Cache MISS: no recipes above threshold');
  return { recipes: [], fromCache: false, matchScore: 0 };
}

// ============================================================
// SMART RECIPE CACHING (with normalized keys + dedup)
// ============================================================

// Extract the key ingredient names from a recipe's ingredient list
function extractKeyIngredients(ingredientLines: string[]): string[] {
  // Common pantry items that are NOT key ingredients
  const pantryBasics = new Set([
    'sal', 'pimienta', 'aceite', 'agua', 'vinagre', 'azucar',
    'oregano', 'perejil', 'cilantro', 'laurel', 'comino', 'pimenton',
    'aji molido', 'provenzal', 'nuez moscada',
  ]);
  
  const keys: string[] = [];
  
  for (const line of ingredientLines) {
    const canonical = getCanonicalIngredient(line);
    if (canonical.length > 1 && !pantryBasics.has(canonical) && !keys.includes(canonical)) {
      keys.push(canonical);
    }
  }
  
  return keys.slice(0, 8); // Max 8 key ingredients
}

// Check if a new recipe is too similar to an existing one
function areSimilarRecipes(existingKeys: string[], newKeys: string[]): boolean {
  if (existingKeys.length === 0 || newKeys.length === 0) return false;
  
  let overlap = 0;
  for (const ek of existingKeys) {
    const ekVars = getIngredientVariants(ek);
    for (const nk of newKeys) {
      const nkVars = getIngredientVariants(nk);
      if (ekVars.some(ev => nkVars.some(nv => ev.includes(nv) || nv.includes(ev)))) {
        overlap++;
        break;
      }
    }
  }
  
  const similarity = overlap / Math.max(existingKeys.length, newKeys.length);
  return similarity >= 0.8; // 80% ingredient overlap = duplicate
}

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
    // Extract normalized key ingredients from the recipe
    const keyIngredients = extractKeyIngredients(recipe.ingredients || []);
    
    if (keyIngredients.length === 0) {
      console.log(`Skipping cache for "${recipe.name}": no key ingredients extracted`);
      continue;
    }
    
    // Check for duplicates: exact name OR similar ingredients
    const { data: existing } = await supabase
      .from('cached_recipes')
      .select('id, recipe_name, main_ingredients')
      .eq('language', language);
    
    let isDuplicate = false;
    if (existing) {
      const normalizedName = removeAccents(recipe.name.toLowerCase().trim());
      for (const ex of existing) {
        // Check name similarity
        const exName = removeAccents(ex.recipe_name.toLowerCase().trim());
        if (exName === normalizedName) {
          isDuplicate = true;
          console.log(`Duplicate by name: "${recipe.name}"`);
          break;
        }
        // Check ingredient similarity
        if (areSimilarRecipes(ex.main_ingredients || [], keyIngredients)) {
          isDuplicate = true;
          console.log(`Duplicate by ingredients: "${recipe.name}" ≈ "${ex.recipe_name}"`);
          break;
        }
      }
    }
    
    if (isDuplicate) continue;
    
    const { error } = await supabase
      .from('cached_recipes')
      .insert({
        recipe_name: recipe.name,
        recipe_data: recipe,
        main_ingredients: keyIngredients,
        time_range: timeRange,
        meal_type: mealType,
        language: language || 'es',
        difficulty: recipe.difficulty,
        tags: recipe.tags || [],
        usage_count: 1
      });
    
    if (error) {
      console.error(`Error caching "${recipe.name}":`, error);
    } else {
      console.log(`Cached: "${recipe.name}" keys=[${keyIngredients.join(', ')}]`);
    }
  }
}

// ============================================================
// EMERGENCY FALLBACK RECIPES
// ============================================================

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

// ============================================================
// SYSTEM PROMPT & MAIN HANDLER
// ============================================================

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
    
    console.log('Request:', { ingredients, time, mealType, language, surpriseMode, useCacheOnly, hybridMode });

    // Check daily limit BEFORE processing (except for cache-only requests)
    if (!useCacheOnly) {
      const limitCheck = await checkUserLimits(req);
      
      if (!limitCheck.allowed) {
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
    
    // STEP 1: Always try cache first (≥70% match) for non-surprise requests
    if (ingredients && ingredients.length > 0 && !surpriseMode) {
      const cacheResult = await searchCachedRecipes(
        ingredients, 
        time || 30, 
        mealType, 
        language || 'es',
        0.7 // 70% threshold
      );
      
      if (cacheResult.recipes.length > 0) {
        console.log(`✅ Serving ${cacheResult.recipes.length} cached recipes (score: ${cacheResult.matchScore.toFixed(2)})`);
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
    
    // CACHE ONLY MODE: Don't call AI
    if (useCacheOnly) {
      return new Response(JSON.stringify({ 
        recipes: [],
        source: 'cache',
        isInstant: true,
        matchScore: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // STEP 2: No cache hit → call AI
    console.log('🤖 Cache miss, calling AI...');
    
    const systemPrompt = getSystemPrompt(language || 'es');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build user prompt
    let userPrompt = '';
    
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
          desayuno: 'desayuno', almuerzo: 'almuerzo', merienda: 'merienda',
          cena: 'cena', snack: 'snack', postre: 'postre', rapida: 'comida rápida',
          economica: 'comida económica', liviana: 'comida liviana/light',
          'para-chicos': 'comida para niños', 'para-freezar': 'comida para freezar/congelar'
        };
        const mealTypeParts = mealType.split(',').map((p: string) => p.trim());
        const mealDescriptions = mealTypeParts.map((mt: string) => mealTypes[mt] || mt).filter(Boolean);
        if (mealDescriptions.length > 0) {
          userPrompt += `Tipo de comida: ${mealDescriptions.join(' y ')}\n`;
        }
      }

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

      if (servings) userPrompt += `Cantidad de porciones: ${servings} personas\n`;

      if (cookingMethod) {
        const cookingMethods: Record<string, string> = {
          'horno': 'al horno', 'sarten': 'en sartén', 'olla': 'en olla',
          'airfryer': 'en airfryer', 'sin-coccion': 'sin cocción', 'microondas': 'en microondas'
        };
        userPrompt += `Método de cocción preferido: ${cookingMethods[cookingMethod] || cookingMethod}\n`;
      }

      if (difficulty) userPrompt += `Nivel de dificultad preferido: ${difficulty}\n`;

      if (diet && diet.length > 0) {
        const dietLabels: Record<string, string> = {
          'vegetariano': 'vegetariano (sin carne ni pescado)', 'vegano': 'vegano (sin productos animales)',
          'sin-gluten': 'sin gluten', 'sin-lactosa': 'sin lactosa',
          'bajo-calorias': 'bajo en calorías', 'saludable': 'saludable y nutritivo'
        };
        const dietDescriptions = diet.map((d: string) => dietLabels[d] || d);
        userPrompt += `Preferencias dietéticas: ${dietDescriptions.join(', ')}\n`;
      }

      if (excludeIngredients && excludeIngredients.length > 0) {
        userPrompt += `IMPORTANTE - NO usar estos ingredientes: ${excludeIngredients.join(', ')}\n`;
      }

      if (budget) {
        const budgetLabels: Record<string, string> = {
          'bajo': 'económico/bajo presupuesto', 'medio': 'presupuesto moderado', 'alto': 'sin restricción de presupuesto'
        };
        userPrompt += `Presupuesto: ${budgetLabels[budget] || budget}\n`;
      }

      if (randomize) userPrompt += `IMPORTANTE: Sorprendeme con una receta creativa e inesperada. Sugiere solo UNA receta.\n`;

      if (excludeRecipes && excludeRecipes.length > 0) {
        userPrompt += `IMPORTANTE - NO sugerir estas recetas que ya cociné recientemente: ${excludeRecipes.join(', ')}\n`;
      }
    }

    console.log('AI prompt:', userPrompt.substring(0, 200) + '...');

    // Multiple models for fallback
    const models = [
      'google/gemini-2.5-flash-lite',
      'openai/gpt-5-nano',
      'google/gemini-2.5-flash',
      'openai/gpt-5-mini',
      'google/gemini-3-flash-preview',
      'google/gemini-2.5-pro',
      'openai/gpt-5',
      'google/gemini-3-pro-preview',
    ];
    
    let response: Response | null = null;
    let successfulModel = '';
    
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
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
          break;
        }
        
        const errorText = await response.text();
        console.error(`Model ${model} error:`, response.status, errorText);
        
        if (response.status === 402) break;
        response = null;
      } catch (fetchError) {
        console.error(`Fetch error with ${model}:`, fetchError);
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error('All models failed');

      // Fallback to cache with very low threshold
      if (!surpriseMode && ingredients && ingredients.length > 0) {
        const cacheResult = await searchCachedRecipes(ingredients, time || 30, mealType, language || 'es', 0.2);
        if (cacheResult.recipes.length > 0) {
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
    console.log('AI response from:', successfulModel);

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response content from AI');

    let result;
    try {
      let cleanContent = content.replace(/```json\n?|\\n?```/g, '').trim();
      try {
        result = JSON.parse(cleanContent);
      } catch {
        const jsonStart = cleanContent.indexOf('{');
        const jsonEnd = cleanContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
        result = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', content);
      throw new Error('Failed to parse recipe response');
    }

    console.log('Parsed recipes:', result.recipes?.length);

    // STEP 3: Cache AI results with normalized ingredients (async)
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
    console.error('Error in generate-recipe:', error);
    
    try {
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
      return new Response(JSON.stringify({
        recipes: [{
          name: "Huevos revueltos clásicos",
          time: 10, difficulty: "muy fácil", servings: 2,
          ingredients: ["3 huevos", "1 cda de manteca", "Sal y pimienta", "Queso rallado (opcional)"],
          steps: ["Batí los huevos con sal y pimienta", "Derretí la manteca en sartén a fuego medio-bajo", "Agregá los huevos y revolvé suavemente", "Retirá cuando estén cremosos", "Serví de inmediato"],
          tip: "El secreto es sacarlos antes de que estén totalmente cocidos",
          nutrition: { calories: 220, protein: 14, carbs: 2, fat: 16, fiber: 0 },
          tags: ["rápido", "clásico", "proteico"]
        }],
        source: 'emergency', isInstant: true, fallbackReason: 'critical_error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});
