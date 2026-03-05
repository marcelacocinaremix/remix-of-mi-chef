import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PREMIUM = 10;

// Check daily usage limit for users (READ ONLY - does NOT increment)
async function checkUserLimits(req: Request): Promise<{ 
  allowed: boolean; 
  userId: string | null; 
  usesToday: number; 
  remaining: number;
  isPremium: boolean;
  message?: string;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return { allowed: true, userId: null, usesToday: 0, remaining: DAILY_LIMIT_FREE, isPremium: false };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user) {
    return { allowed: true, userId: null, usesToday: 0, remaining: DAILY_LIMIT_FREE, isPremium: false };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Check if user is premium to set proper limit
  const { data: subData } = await supabaseAdmin
    .from('user_subscriptions')
    .select('is_premium, daily_uses, last_use_date')
    .eq('user_id', user.id)
    .maybeSingle();

  const isPremium = subData?.is_premium || false;
  const userLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
  
  // Calculate current uses (reset if new day)
  const today = new Date().toISOString().split('T')[0];
  const lastUseDate = subData?.last_use_date;
  const currentUses = (!lastUseDate || lastUseDate < today) ? 0 : (subData?.daily_uses || 0);
  
  if (currentUses >= userLimit) {
    return {
      allowed: false,
      userId: user.id,
      usesToday: currentUses,
      remaining: 0,
      isPremium,
      message: '¡Se acabaron tus recetas de hoy! Volvé mañana para seguir cocinando 🍳'
    };
  }

  return {
    allowed: true,
    userId: user.id,
    usesToday: currentUses,
    remaining: userLimit - currentUses,
    isPremium
  };
}

// Consume one daily credit AFTER a successful recipe generation
async function consumeDailyCredit(userId: string, isPremium: boolean): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  const userLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;
  
  const { data, error } = await supabaseAdmin.rpc('check_and_increment_daily_uses', {
    p_user_id: userId,
    p_daily_limit: userLimit
  });
  
  if (error) {
    console.error('Error consuming daily credit:', error);
  } else {
    console.log(`💰 Credit consumed. Uses today: ${data?.uses_today}, remaining: ${data?.remaining}`);
  }
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
  'cantidad', 'necesaria', 'necesario', 'gusto', 'pizca', 'chorrito', 'aproximadamente', 'aprox',
  'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas', 'cda', 'cdta',
  'taza', 'tazas', 'vaso', 'vasos',
  'gramo', 'gramos', 'kilo', 'kilos', 'litro', 'litros', 'ml', 'cc',
  'picado', 'picada', 'picados', 'picadas', 'fino', 'fina', 'finos', 'finas',
  'cortado', 'cortada', 'cortados', 'cortadas',
  'rallado', 'rallada', 'rallados', 'ralladas',
  'trozo', 'trozos', 'rodaja', 'rodajas', 'rebanada', 'rebanadas',
  'diente', 'dientes', 'ramita', 'ramitas', 'hoja', 'hojas',
  'unidad', 'unidades', 'puñado', 'puñados',
  'opcional', 'necesario', 'suficiente',
  'cubos', 'tiritas', 'tiras', 'julianas', 'juliana', 'aros', 'fetas', 'feta',
  'rodajas', 'rebanadas', 'láminas', 'laminas',
]);

// Expanded synonym map: canonical → variants
// Includes normalized IDs from the frontend (e.g., carne_picada, muslo_pollo)
const ingredientSynonyms: Record<string, string[]> = {
  // ── CARNES ───────────────────────────────────────────────────────────────
  'pollo':    ['pechuga', 'muslo', 'pata muslo', 'suprema', 'pollo entero', 'trutro', 'ala de pollo', 'muslo_pollo', 'alitas', 'pechuga de pollo'],
  'carne':    ['bife', 'lomo', 'picada', 'milanesa', 'nalga', 'cuadril', 'asado', 'vacuno', 'ternera', 'vacio', 'entraña', 'tapa', 'paleta', 'osobuco', 'roast beef', 'carne molida', 'carne picada', 'carne_picada', 'costilla', 'entrana'],
  'matambre': ['matambre arrollado', 'matambre a la pizza', 'matambre relleno', 'matambre de cerdo', 'matambre de ternera'],
  'mondongo': ['mondongo guisado', 'tripas', 'callos', 'buseca'],
  'cerdo':    ['costeleta', 'lomo de cerdo', 'costilla de cerdo', 'costillas_cerdo', 'solomillo', 'carre', 'carré', 'carre de cerdo', 'tocino', 'bacon', 'salchicha', 'frankfurt'],
  'bondiola': ['bondiola de cerdo', 'bondiola al horno', 'bondiola estofada', 'bondiola a la pizza'],
  'panceta':  ['panceta ahumada', 'panceta en tiritas', 'panceta feteada', 'bacon'],
  'chorizo':  ['chorizo criollo', 'chorizo parrilla', 'chorizo colorado', 'salsichon', 'salchicha parrillera'],
  'jamon':    ['jamón cocido', 'jamón crudo', 'jamon_cocido', 'jamon_crudo', 'prosciutto', 'serrano'],
  'cordero':  ['chivo', 'cabrito', 'borrego', 'pierna de cordero', 'costilla de cordero'],
  'conejo':   ['conejo al horno', 'conejo estofado'],
  'pavo':     ['pechuga de pavo', 'muslo de pavo'],
  'morcilla': ['morcilla criolla', 'morcilla dulce'],

  // ── PESCADOS (cada uno por separado para NO confundirlos) ─────────────────
  'atun':     ['atún', 'lomo de atun', 'atun_lata', 'atún en lata', 'atun en lata', 'atún en aceite'],
  'salmon':   ['salmón', 'lomo de salmon', 'filet de salmon', 'lomo de salmón', 'filet de salmón', 'salmon ahumado', 'salmón ahumado'],
  'merluza':  ['filet de merluza', 'filete de merluza', 'merluza negra', 'brotola', 'brótola', 'abadejo'],
  'trucha':   ['trucha arcoiris', 'filet de trucha', 'trucha ahumada'],
  'sardina':  ['sardinas', 'sardinas en lata', 'sardinitas'],
  'caballa':  ['caballa en lata', 'caballa al natural'],
  'camaron':  ['camarones', 'gambas', 'langostino', 'langostinos', 'camarón'],
  'pulpo':    ['pulpo a la gallega', 'pulpo al olivo'],
  'calamar':  ['calamares', 'calamar en su tinta', 'calamaretti'],
  'pescado':  ['lenguado', 'surubi', 'corvina', 'tilapia', 'mero', 'pejerrey', 'dorado', 'pez espada', 'pez_espada', 'filet de pescado', 'filete de pescado'],

  // ── PASTAS (cada tipo por separado para NO confundirlos) ──────────────────
  'fideos':   ['pasta', 'spaghetti', 'tallarines', 'mostachol', 'tirabuzon', 'penne', 'fusilli', 'rigatoni', 'fetuccini', 'fideos secos', 'fideos de arroz', 'fideos moño', 'coditos', 'linguine', 'bucatini'],
  'noquis':   ['ñoquis', 'gnocchi', 'noquis de papa', 'ñoquis de papa', 'ñoquis de ricota'],
  'ravioles': ['raviolones', 'sorrentinos', 'capelettis', 'tortellini', 'agnolottis', 'ravioli'],
  'lasagna':  ['lasaña', 'lasañas', 'lasagna boloñesa'],
  'canelones': ['canelón', 'canelon'],

  // ── CEREALES / HARINAS ────────────────────────────────────────────────────
  'arroz':    ['arroz integral', 'arroz blanco', 'arroz largo', 'arroz yamaní', 'arroz arborio', 'arroz_integral'],
  'quinoa':   ['quinua', 'quinoa blanca', 'quinoa roja'],
  'avena':    ['avena arrollada', 'copos de avena', 'harina de avena'],
  'harina':   ['harina leudante', 'harina 000', 'harina 0000', 'harina integral', 'fecula', 'maicena', 'almidon', 'almidón de mandioca'],
  'pan':      ['pan rallado', 'pan_rallado', 'pan lactal', 'baguette', 'pan de molde', 'pan integral', 'tostada', 'pan pita', 'pan árabe'],
  'polenta':  ['grits', 'harina de maiz gruesa', 'polenta precocida'],
  'lenteja':  ['lentejas', 'lentejas rojas', 'lentejas verdes', 'lenteja coral'],

  // ── LEGUMBRES (separadas para no confundirlas entre sí) ────────────────────
  'poroto':   ['porotos', 'frijol', 'alubia', 'poroto negro', 'poroto colorado', 'poroto blanco'],
  'chaucha':  ['chauchas', 'porotos verdes', 'porotos_verdes', 'judias verdes', 'ejotes', 'vainitas'],
  'garbanzo': ['garbanzos', 'chickpeas', 'garbanzo cocido'],

  // ── LÁCTEOS ────────────────────────────────────────────────────────────────
  'leche':    ['leche entera', 'leche descremada', 'leche_descremada'],
  'crema':    ['crema de leche', 'nata', 'crema_leche', 'crema para cocinar', 'crema de cocina', 'media crema'],
  'yogur':    ['yogurt', 'yogur natural', 'yogur griego', 'yogur descremado'],
  'queso':    ['muzzarella', 'mozzarella', 'parmesano', 'cremoso', 'cheddar', 'roquefort', 'provolone', 'reggianito', 'gruyere', 'fontina', 'brie', 'camembert', 'dambo', 'port salut', 'queso crema', 'queso_crema', 'queso rallado', 'queso_rallado', 'queso_azul', 'mozzarella rallado', 'cheddar rallado'],
  'ricota':   ['ricotta', 'queso ricota', 'ricota entera', 'ricota descremada'],
  'manteca':  ['mantequilla', 'margarina', 'manteca sin sal'],
  'dulce_de_leche': ['dulce de leche', 'dulce_de_leche'],

  // ── HUEVOS ─────────────────────────────────────────────────────────────────
  'huevo':    ['huevos', 'clara', 'claras', 'yema', 'yemas', '2 huevos', '4 huevos', 'huevo de codorniz'],

  // ── VERDURAS ───────────────────────────────────────────────────────────────
  'papa':     ['patata', 'papas', 'papines', 'papas medianas', 'papa_andina'],
  'batata':   ['boniato', 'camote', 'papa dulce', 'batatas medianas', 'batata anaranjada'],
  'tomate':   ['tomates', 'cherry', 'perita', 'salsa de tomate', 'pure de tomate', 'tomate triturado', 'tomate_triturado', 'tomate_perita', 'salsa_tomate', 'jitomate'],
  'cebolla':  ['cebollas', 'cebollita', 'cebolla morada', 'cebolla blanca', 'cebolla mediana', 'echalote', 'chalota'],
  'verdeo':   ['cebolla de verdeo', 'cebollín', 'cebollino', 'green onion'],
  'ajo':      ['ajos', 'diente de ajo', 'ajo en polvo', 'ajo picado', 'ajo_polvo'],
  'zanahoria':['zanahorias', 'zanahoria rallada', 'zanahoria baby'],
  'zapallo':  ['calabaza', 'anco', 'zapallo_anco', 'zapallo cabutia'],
  'zapallito':['zapallito largo', 'zucchini', 'calabacin', 'calabacín'],
  'morron':   ['pimiento', 'aji morrón', 'aji rojo', 'aji verde', 'pimiento rojo', 'pimiento verde', 'pimiento amarillo', 'morrón (pimiento)'],
  'aji':      ['chile', 'jalapeño', 'ají picante', 'ají amarillo', 'ají verde', 'pepperoncino'],
  'choclo':   ['maiz', 'maíz', 'elote', 'mazorca', 'choclo desgranado', 'choclo_lata', 'maiz en lata'],
  'espinaca': ['espinacas', 'baby espinaca', 'espinaca congelada'],
  'acelga':   ['acelgas', 'acelga blanca'],
  'kale':     ['col rizada', 'repollo kale'],
  'repollo':  ['col', 'repollo blanco', 'repollo morado', 'lombarda', 'col lombarda'],
  'lechuga':  ['radicheta', 'radicchio', 'escarola', 'lechuga romana', 'lechuga capuchina', 'lechuga mantecosa'],
  'rucula':   ['rúcula', 'arugula'],
  'apio':     ['apio en ramas', 'apio nabo'],
  'puerro':   ['poro', 'puerros'],
  'hongos':   ['champiñones', 'champignones', 'champinones laminados', 'setas', 'portobellos', 'hongos secos', 'hongos_secos', 'shiitake'],
  'palta':    ['aguacate', 'avocado', 'palta madura'],
  'berenjena':['berenjenas', 'berenjena asada'],

  // ── FRUTAS ─────────────────────────────────────────────────────────────────
  'banana':   ['banano', 'platano', 'plátano'],
  'manzana':  ['manzanas', 'manzana verde', 'manzana roja', 'manzana gala'],
  'pera':     ['peras', 'pera williams'],
  'naranja':  ['naranjas', 'jugo de naranja', 'ralladura de naranja'],
  'limon':    ['limón', 'lima', 'ralladura de limon', 'jugo de limon'],
  'frutilla': ['fresa', 'fresas', 'strawberry', 'frutillas'],
  'durazno':  ['melocotón', 'duraznos', 'durazno en lata'],
  'ciruela':  ['ciruelas', 'ciruela pasa'],
  'uva':      ['uvas', 'uva negra', 'uva verde', 'pasas de uva'],

  // ── CONDIMENTOS / ACEITES ──────────────────────────────────────────────────
  'aceite':   ['aceite de girasol', 'aceite de maiz', 'aceite vegetal', 'aceite_girasol'],
  'aceite_oliva': ['aceite de oliva', 'oliva extra virgen', 'aove'],
  'azucar':   ['azucar impalpable', 'azucar mascabo', 'azucar rubia', 'edulcorante', 'stevia', 'azúcar', 'azucar blanca'],
  'miel':     ['miel de abeja', 'miel pura', 'jarabe de miel'],

  // ── FRUTOS SECOS / SEMILLAS ────────────────────────────────────────────────
  'nuez':     ['nueces', 'nuez de castilla', 'nuez pecán', 'pecan'],
  'almendra': ['almendras', 'harina de almendras', 'almendra tostada'],
  'mani':     ['maní', 'cacahuate', 'mantequilla de mani', 'crema de mani'],
  'chia':     ['chía', 'semillas de chia'],
  'lino':     ['linaza', 'semillas de lino'],
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

// Get specific variants for a raw ingredient — NOT the whole canonical group
// e.g., "fideos" → fideos, spaghetti, tallarines, penne — but NOT ñoquis, ravioles
function getSpecificVariants(rawIngredient: string, canonical: string): string[] {
  const variants = new Set<string>([rawIngredient]);
  
  // If the raw ingredient IS a canonical key, use its direct variants
  if (ingredientSynonyms[rawIngredient]) {
    for (const v of ingredientSynonyms[rawIngredient]) {
      variants.add(removeAccents(v.toLowerCase()));
    }
  }
  
  // If the canonical is different from raw, check if the raw is listed under canonical
  if (canonical !== rawIngredient && ingredientSynonyms[canonical]) {
    variants.add(canonical);
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
  minMatchScore: number = 0.95,
  quickFilters: string[] = [],
  diet: string[] = [],
  excludeIngredients: string[] = [],
  excludeRecipeNames: string[] = []
): Promise<{ recipes: any[]; fromCache: boolean; matchScore: number; matchInfo?: any }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Normalize all user ingredients to canonical forms
  const userCanonicals = ingredients.map(i => getCanonicalIngredient(i));
  const userVariantsFlat = ingredients.flatMap(i => getIngredientVariants(i));
  
  console.log('Smart search:', { 
    raw: ingredients, 
    canonicals: userCanonicals,
    time, 
    mealType,
    threshold: minMatchScore 
  });
  
  // Build query - pre-filter by overlapping ingredients for better performance
  // Use ALL variants (canonical + synonyms) to catch variant names stored in DB
  const overlapTerms = new Set<string>();
  for (const canonical of userCanonicals) {
    overlapTerms.add(canonical);
    if (ingredientSynonyms[canonical]) {
      for (const syn of ingredientSynonyms[canonical]) {
        overlapTerms.add(removeAccents(syn.toLowerCase()));
      }
    }
  }
  // Also add the raw ingredient names as-is
  for (const ing of ingredients) {
    overlapTerms.add(removeAccents(ing.toLowerCase().trim()));
  }
  const overlapArray = [...overlapTerms];
  
  console.log('Overlap filter terms:', overlapArray.slice(0, 20), '...(total:', overlapArray.length, ')');
  
  let query = supabase
    .from('cached_recipes')
    .select('*')
    .eq('language', language)
    .overlaps('main_ingredients', overlapArray)
    .order('usage_count', { ascending: false });
  
  const { data: recipes, error } = await query.limit(500);
  
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
    
    // ONLY check actual recipe ingredients list — NOT steps/tips/variations
    // This prevents false matches like "you can serve with arroz" in steps
    const actualIngredients: string[] = (recipe.recipe_data as any)?.ingredients || [];
    const recipeIngText = removeAccents(actualIngredients.join(' ').toLowerCase());
    
    // How many of the USER's SPECIFIC ingredients does this recipe use?
    let matchedUserCount = 0;
    for (let idx = 0; idx < ingredients.length; idx++) {
      const rawIng = removeAccents(ingredients[idx].toLowerCase().replace(/_/g, ' ').trim());
      const userCanonical = userCanonicals[idx];
      
      // Check ONLY in the ingredients list, not full recipe JSON
      // Direct raw match
      if (recipeIngText.includes(rawIng)) {
        matchedUserCount++;
        continue;
      }
      
      // Check specific variants — ONLY in ingredients list, not steps/tips
      const specificVars = getSpecificVariants(rawIng, userCanonical);
      const hit = specificVars.some(v => recipeIngText.includes(removeAccents(v)));
      if (hit) matchedUserCount++;
    }
    
    // How many of the RECIPE's key ingredients does the user have?
    let matchedRecipeCount = 0;
    for (const rk of recipeKeys) {
      const rkVars = getIngredientVariants(rk);
      const hit = rkVars.some(rv => {
        if (rv.length <= 3) {
          return userVariantsFlat.some(uv => uv === rv);
        }
        return userVariantsFlat.some(uv => uv.includes(rv) || rv.includes(uv));
      });
      if (hit) matchedRecipeCount++;
    }
    
    const userCoverage = userCanonicals.length > 0 ? matchedUserCount / userCanonicals.length : 0;
    const recipeCoverage = recipeKeys.length > 0 ? matchedRecipeCount / recipeKeys.length : 0;
    
    // 100% user coverage required — ALL user ingredients must be present
    if (userCoverage < 1.0) {
      return { ...recipe, matchScore: 0, recipeCoverage: 0, userCoverage: 0, matchedCount: 0, totalCount: userCanonicals.length };
    }
    
    // Score based on coverage
    const combinedScore = (userCoverage * 0.80) + (recipeCoverage * 0.20);
    
    // Meal type bonus
    let mealBonus = 0;
    if (mealType && recipe.meal_type) {
      const recipeMealType = recipe.meal_type.toLowerCase();
      if (recipeMealType === mealType.toLowerCase()) {
        mealBonus = 0.05;
      }
    }
    
    // TIME CHECK: reject recipes that take too long
    const recipeTime = (recipe.recipe_data as any)?.time || 30;
    if (recipeTime > time * 2) {
      return { ...recipe, matchScore: 0, recipeCoverage: 0, userCoverage: 0, matchedCount: 0, totalCount: userCanonicals.length };
    }
    const timePenalty = recipeTime > time ? Math.min((recipeTime - time) / time * 0.05, 0.1) : 0;
    
    // QUICK FILTERS / DIET validation
    let filterPenalty = 0;
    const recipeFullText = removeAccents(JSON.stringify(recipe.recipe_data).toLowerCase());
    const recipeTags = (recipe.tags || []).map((t: string) => t.toLowerCase());
    
    for (const qf of (quickFilters || [])) {
      const qfLower = qf.toLowerCase();
      switch (qfLower) {
        case 'vegetariano':
        case 'vegano':
          if (!recipeTags.includes(qfLower)) {
            const meatTerms = ['pollo', 'carne', 'cerdo', 'pescado', 'jamon', 'panceta', 'chorizo', 'bondiola'];
            if (meatTerms.some(m => recipeIngText.includes(m))) filterPenalty = 1;
          }
          break;
        case 'sin-gluten':
          if (['harina', 'pan ', 'pan,', 'fideos', 'pasta', 'spaghetti'].some(g => recipeIngText.includes(g))) filterPenalty = 1;
          break;
        case 'sin-lactosa':
          if (['leche', 'queso', 'crema', 'manteca', 'yogur', 'mozzarella'].some(l => recipeIngText.includes(l))) filterPenalty = 1;
          break;
      }
    }
    
    for (const d of (diet || [])) {
      const dLower = d.toLowerCase();
      switch (dLower) {
        case 'vegetariano':
        case 'vegano': {
          const meatTerms = ['pollo', 'carne', 'cerdo', 'pescado', 'jamon', 'panceta', 'chorizo'];
          if (meatTerms.some(m => recipeIngText.includes(m))) filterPenalty = 1;
          break;
        }
        case 'sin-gluten':
          if (['harina', 'pan ', 'pan,', 'fideos', 'pasta'].some(g => recipeIngText.includes(g))) filterPenalty = 1;
          break;
        case 'sin-lactosa':
          if (['leche', 'queso', 'crema', 'manteca', 'yogur'].some(l => recipeIngText.includes(l))) filterPenalty = 1;
          break;
      }
    }
    
    if (filterPenalty >= 1) {
      return { ...recipe, matchScore: 0, recipeCoverage: 0, userCoverage: 0, matchedCount: 0, totalCount: userCanonicals.length };
    }
    
    // EXCLUDE INGREDIENTS: Disqualify if recipe contains excluded ingredients
    if (excludeIngredients && excludeIngredients.length > 0) {
      for (const excluded of excludeIngredients) {
        const excCanonical = getCanonicalIngredient(excluded);
        const excVariants = getIngredientVariants(excCanonical);
        if (excVariants.some(v => recipeIngText.includes(removeAccents(v)))) {
          return { ...recipe, matchScore: 0, recipeCoverage: 0, userCoverage: 0, matchedCount: 0, totalCount: userCanonicals.length };
        }
      }
    }
    
    // Small popularity bonus
    const popularityBonus = Math.min((recipe.usage_count || 0) / 200, 0.03);
    
    return {
      ...recipe,
      matchScore: combinedScore + mealBonus + popularityBonus - timePenalty,
      recipeCoverage,
      userCoverage,
      matchedCount: matchedUserCount,
      totalCount: userCanonicals.length,
    };
  });
  
  // ── Progressive matching with rotation ──
  const validRecipes = scoredRecipes.filter(r => r.matchScore > 0);
  
  // Shuffle helper for rotation
  function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Sort by userCoverage desc first, then matchScore desc
  validRecipes.sort((a, b) => {
    if (b.userCoverage !== a.userCoverage) return b.userCoverage - a.userCoverage;
    return b.matchScore - a.matchScore;
  });
  
  // Normalize exclude recipe names for comparison
  const excludeNamesNorm = (excludeRecipeNames || []).map((n: string) => removeAccents(n.toLowerCase().trim()));
  
  // STRICT: always require 100% user ingredient coverage — no progressive fallback
  const totalIngredients = ingredients.length;
  let matched: typeof validRecipes = [];
  
  const thresholds: number[] = [1.0]; // Only 100% — user's ingredients MUST all be present
  
  for (const threshold of thresholds) {
    const atThreshold = validRecipes.filter(r => r.userCoverage >= threshold);
    
    if (atThreshold.length > 0) {
      // Separate: not recently shown vs recently shown
      const notExcluded = atThreshold.filter(r => {
        const nameNorm = removeAccents((r.recipe_name || '').toLowerCase().trim());
        return !excludeNamesNorm.some((ex: string) => nameNorm.includes(ex) || ex.includes(nameNorm));
      });
      
      // If ALL were excluded (full cycle), reset and use all
      const pool = notExcluded.length > 0 ? notExcluded : atThreshold;
      const cycleReset = notExcluded.length === 0 && atThreshold.length > 0;
      
      // Group by score bands (5%) and shuffle within each band
      const scoreBands: Map<number, typeof validRecipes> = new Map();
      for (const r of pool) {
        const band = Math.round(r.matchScore * 20);
        if (!scoreBands.has(band)) scoreBands.set(band, []);
        scoreBands.get(band)!.push(r);
      }
      
      const shuffledPool: typeof validRecipes = [];
      const sortedBands = [...scoreBands.keys()].sort((a, b) => b - a);
      for (const band of sortedBands) {
        shuffledPool.push(...shuffleArray(scoreBands.get(band)!));
      }
      
      matched = shuffledPool.slice(0, 1); // Return only 1 recipe
      
      console.log(`Cache HIT at ${(threshold * 100).toFixed(0)}% threshold: picked "${matched[0]?.recipe_name}" from ${pool.length} options (excluded: ${excludeNamesNorm.length}${cycleReset ? ', CYCLE RESET' : ''})`,
        matched.map(r => ({ name: r.recipe_name, coverage: `${r.matchedCount}/${r.totalCount}`, score: r.matchScore.toFixed(2) }))
      );
      break;
    }
  }
  
  if (matched.length > 0) {
    // Increment usage count only for the selected recipe
    await supabase
      .from('cached_recipes')
      .update({ usage_count: (matched[0].usage_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', matched[0].id);
    
    return { 
      recipes: matched.map(r => {
        const data = r.recipe_data as any;
        data.name = sanitizeRecipeTitle(data.name || r.recipe_name);
        return {
          ...data,
          _matchInfo: {
            matched: r.matchedCount,
            total: r.totalCount,
            percentage: Math.round(r.userCoverage * 100),
          }
        };
      }),
      fromCache: true,
      matchScore: matched[0].matchScore,
      matchInfo: {
        matched: matched[0].matchedCount,
        total: matched[0].totalCount,
        percentage: Math.round(matched[0].userCoverage * 100),
      }
    };
  }
  
  console.log('Cache MISS: no recipes above 80% threshold');
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
    'aji molido', 'provenzal', 'nuez moscada', 'soja',
  ]);
  
  // Junk results to skip entirely
  const junkPatterns = ['gusto', 'necesaria', 'necesario', 'opcional', 'suficiente', 'c/n'];
  
  const keys: string[] = [];
  
  for (const line of ingredientLines) {
    const canonical = getCanonicalIngredient(line);
    
    // Skip if it's too short, is a pantry basic, or is junk
    if (canonical.length <= 1) continue;
    if (pantryBasics.has(canonical)) continue;
    if (junkPatterns.some(j => canonical.includes(j))) continue;
    if (keys.includes(canonical)) continue;
    
    // Only add if it maps to a known ingredient OR is a meaningful word
    const isKnown = Object.keys(ingredientSynonyms).includes(canonical) || 
                    Object.values(ingredientSynonyms).some(variants => variants.some(v => removeAccents(v.toLowerCase()) === canonical));
    
    // If not a known synonym, check it's at least 3 chars and not just stopword leftovers
    if (!isKnown && canonical.length < 3) continue;
    
    keys.push(canonical);
  }
  
  return keys.slice(0, 6); // Max 6 key ingredients (fewer = better matching)
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

// Sanitize recipe title: remove decorative words, diminutives, parenthetical notes
function sanitizeRecipeTitle(name: string): string {
  let clean = name;
  // Remove parenthetical notes and subtitles
  clean = clean.replace(/\s*\([^)]+\)\s*/g, '');
  clean = clean.replace(/:\s+.*$/, '');
  clean = clean.replace(/\s+en\s+\d+\s+minutos?\s*$/gi, '');
  // Replace diminutives with proper names
  const diminutives: Record<string, string> = {
    'pollito': 'pollo', 'pechuguitas': 'pechugas', 'salmoncito': 'salmón',
    'verduritas': 'verduras', 'costillitas': 'costillas', 'pechito': 'pechuga',
    'papitas': 'papas', 'cebollitas': 'cebollas', 'tomatitos': 'tomates',
  };
  for (const [dim, proper] of Object.entries(diminutives)) {
    clean = clean.replace(new RegExp(`\\b${dim}\\b`, 'gi'), proper);
  }
  // Remove decorative adjectives
  const decorativeWords = /\b(Express|Rápido|Rápida|Caseras?|Mañanero|Revitalizante|Rústicas?|Cremoso|Cremosa|Glaseadas?|Sorpresa|Explosivo|Mágico|Mágica|Irresistible|Supremo|Suprema|Celestial|Divino|Divina|Espectacular|Exquisito|Exquisita|Sensacional|Tentador|Tentadora|Increíble|Fantástico|Fantástica|Delicioso|Deliciosa|Especial|Gourmet|Premium|Súper|Ultra|Desestructurad[oa]|Patagónic[oa]|Reversionad[oa]|Fortificador|Ahumados?|Crocantes?)\b/gi;
  clean = clean.replace(decorativeWords, '');
  // Remove orphaned trailing prepositions
  clean = clean.replace(/\s+(al|con|de|del|en|y|a la|el|la|los|las)\s*$/gi, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
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
  
  // Use consistent time_range values
  let timeRange = 'medium';
  if (time <= 15) timeRange = 'quick';
  else if (time <= 30) timeRange = 'medium';
  else if (time <= 45) timeRange = 'long';
  else timeRange = 'extra-long';
  
  // Use the USER's canonical ingredients as main_ingredients (much more reliable than extracting from recipe text)
  const userCanonicals = [...new Set(ingredients.map(i => getCanonicalIngredient(i)))];
  
  for (const recipe of recipes) {
    // Sanitize title before caching
    recipe.name = sanitizeRecipeTitle(recipe.name);
    
    // Also extract from recipe for extra coverage, merge with user's
    const extractedKeys = extractKeyIngredients(recipe.ingredients || []);
    const mergedKeys = [...new Set([...userCanonicals, ...extractedKeys])].slice(0, 8);
    
    if (mergedKeys.length === 0) {
      console.log(`Skipping cache for "${recipe.name}": no key ingredients`);
      continue;
    }
    
    // Check for duplicates: search by similar name
    const { data: existing } = await supabase
      .from('cached_recipes')
      .select('id')
      .eq('language', language)
      .ilike('recipe_name', `%${recipe.name.slice(0, 25)}%`)
      .limit(1);
    
    if (existing && existing.length > 0) {
      console.log(`Duplicate by name: "${recipe.name}"`);
      continue;
    }
    
    const { error } = await supabase
      .from('cached_recipes')
      .insert({
        recipe_name: recipe.name,
        recipe_data: recipe,
        main_ingredients: mergedKeys,
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
      console.log(`Cached: "${recipe.name}" keys=[${mergedKeys.join(', ')}]`);
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

  return recipes.slice(0, 1);
}

// ============================================================
// POST-VALIDATION: Verify recipes use user's ingredients
// ============================================================

function validateRecipeIngredients(recipe: any, userIngredients: string[], filters: string[] = [], excludeIngredients: string[] = []): boolean {
  if (!recipe || !recipe.ingredients || !userIngredients || userIngredients.length === 0) return true;
  
  const userCanonicals = userIngredients.map(i => getCanonicalIngredient(i));
  const recipeText = (recipe.ingredients || []).join(' ').toLowerCase();
  const recipeNameLower = (recipe.name || '').toLowerCase();
  const fullText = removeAccents(recipeText + ' ' + recipeNameLower);
  const recipeNutrition = recipe.nutrition || {};
  
  // FILTER VALIDATION: Reject recipes that violate dietary filters
  for (const filter of filters) {
    const f = filter.toLowerCase();
    if (f === 'vegetariano' && (fullText.includes('pollo') || fullText.includes('carne') || fullText.includes('pescado') || fullText.includes('cerdo') || fullText.includes('bife') || fullText.includes('milanesa') || fullText.includes('jamon') || fullText.includes('panceta') || fullText.includes('bondiola') || fullText.includes('chorizo') || fullText.includes('rabas') || fullText.includes('mariscos'))) {
      console.log(`Validation "${recipe.name}": REJECTED - contains meat/fish but filter is vegetariano`);
      return false;
    }
    if (f === 'sin-gluten' && (fullText.includes('harina') || fullText.includes('pan ') || fullText.includes('pan,') || fullText.includes('fideos') || fullText.includes('pasta') || fullText.includes('spaghetti') || fullText.includes('tallarines') || fullText.includes('galletitas'))) {
      console.log(`Validation "${recipe.name}": REJECTED - contains gluten but filter is sin-gluten`);
      return false;
    }
    if (f === 'sin-lactosa' && (fullText.includes('leche') || fullText.includes('queso') || fullText.includes('crema') || fullText.includes('manteca') || fullText.includes('muzzarella') || fullText.includes('mozzarella') || fullText.includes('yogur') || fullText.includes('ricota'))) {
      console.log(`Validation "${recipe.name}": REJECTED - contains dairy but filter is sin-lactosa`);
      return false;
    }
    if (f === 'alto-proteina' && recipeNutrition.protein && recipeNutrition.protein < 20) {
      console.log(`Validation "${recipe.name}": REJECTED - low protein (${recipeNutrition.protein}g) but filter is alto-proteina`);
      return false;
    }
    if (f === 'bajo-calorias' && recipeNutrition.calories && recipeNutrition.calories > 400) {
      console.log(`Validation "${recipe.name}": REJECTED - high calories (${recipeNutrition.calories}) but filter is bajo-calorias`);
      return false;
    }
  }
  
  // EXCLUDE INGREDIENTS: Reject if recipe contains excluded ingredients
  if (excludeIngredients && excludeIngredients.length > 0) {
    for (const excluded of excludeIngredients) {
      const excCanonical = getCanonicalIngredient(excluded);
      const excVariants = getIngredientVariants(excCanonical);
      if (excVariants.some(v => fullText.includes(removeAccents(v)))) {
        console.log(`Validation "${recipe.name}": REJECTED - contains excluded ingredient "${excluded}"`);
        return false;
      }
    }
  }
  
  // ── CONFLICT EXCLUSION: groups of mutually exclusive ingredients ────────────
  // If user requested ingredient A from a group, recipe MUST NOT contain any other member of that group
  const conflictGroups: string[][] = [
    // Pescados — cada uno es distinto
    ['atun', 'salmon', 'merluza', 'trucha', 'sardina', 'caballa', 'camaron', 'pulpo', 'calamar', 'pescado'],
    // Pastas — cada tipo es distinto
    ['fideos', 'noquis', 'ravioles', 'lasagna', 'canelones'],
    // Legumbres
    ['poroto', 'garbanzo', 'lenteja'],
  ];

  for (const group of conflictGroups) {
    // Find which members of this group the user requested
    const requestedInGroup = userIngredients
      .map(i => getCanonicalIngredient(i))
      .filter(c => group.includes(c));
    
    if (requestedInGroup.length === 0) continue; // user didn't use this group
    
    // Build list of forbidden canonicals = group members the user did NOT request
    const forbidden = group.filter(member => !requestedInGroup.includes(member));
    
    // Check if recipe text contains any forbidden member
    for (const forbiddenCanonical of forbidden) {
      const forbiddenVariants = [forbiddenCanonical, ...(ingredientSynonyms[forbiddenCanonical] || [])].map(v => removeAccents(v.toLowerCase()));
      const hasForbidden = forbiddenVariants.some(v => fullText.includes(v));
      if (hasForbidden) {
        console.log(`CONFLICT REJECT "${recipe.name}": user wants [${requestedInGroup}] but recipe has forbidden [${forbiddenCanonical}]`);
        return false;
      }
    }
  }

  // Check that the user's SPECIFIC ingredients (not just canonicals) appear in the recipe
  // CRITICAL: Only check the INGREDIENTS LIST — NOT steps, tips, variations, or name
  // This prevents false matches like "you can serve with arroz" in a step
  const ingredientsOnlyText = removeAccents((recipe.ingredients || []).join(' ').toLowerCase());

  let matchCount = 0;
  for (let i = 0; i < userIngredients.length; i++) {
    const rawIngredient = removeAccents(userIngredients[i].toLowerCase().replace(/_/g, ' ').trim());
    const canonical = userCanonicals[i];
    
    // First try: exact raw ingredient name in ingredients list only
    if (ingredientsOnlyText.includes(rawIngredient)) {
      matchCount++;
      continue;
    }
    
    // Second try: specific variants in ingredients list only
    const specificVariants = getSpecificVariants(rawIngredient, canonical);
    const found = specificVariants.some(v => ingredientsOnlyText.includes(removeAccents(v)));
    if (found) matchCount++;
  }
  
  // ALL user ingredients must be present in the recipe (100% match)
  const matchRatio = matchCount / userCanonicals.length;
  console.log(`Validation "${recipe.name}": ${matchCount}/${userCanonicals.length} ingredients match (${(matchRatio * 100).toFixed(0)}%)`);
  
  return matchRatio >= 1.0;
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
  
  return `Eres MarcelaCocina, chef y creadora de contenido gastronómico especializada en comida casera, práctica y deliciosa.
${langInstructions[language] || langInstructions.es}
Tu misión: generar recetas reales, sabrosas y realizables con los ingredientes exactos del usuario.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS ABSOLUTAS (NUNCA violar ninguna):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. VALIDACIÓN DE INGREDIENTES:
   Si el usuario ingresa cosas que NO son alimentos comestibles, respondé con:
   {"recipes": [], "error": "no_food_ingredients"}

2. UNA SOLA RECETA: Generá exactamente 1 receta. Ni más ni menos.

3. TIEMPO: La receta DEBE realizarse dentro del tiempo máximo indicado.

4. ══════════════════════════════════════
   REGLA #1 — INGREDIENTES OBLIGATORIOS:
   ══════════════════════════════════════
   Si el usuario provee N ingredientes, los N DEBEN aparecer en la lista de ingredientes de la receta.
   NO es opcional. NO es negociable. Es la regla más importante.
   
   ✅ Si dijo "pollo, arroz, papa" → la receta TIENE pollo + arroz + papa en sus ingredientes.
   ✅ Si dijo "matambre, papas, queso" → la receta TIENE matambre + papas + queso.
   ✅ Si dijo "atún, pasta, tomate" → la receta TIENE atún + pasta + tomate.
   ❌ JAMÁS sustituyas un ingrediente por otro.
   ❌ JAMÁS omitas un ingrediente del usuario aunque "no combine bien".
   ❌ Solo podés agregar condimentos/básicos: sal, pimienta, aceite, ajo, cebolla, agua, especias.

5. ══════════════════════════════════════
   REGLA #2 — NO INTERCAMBIAR TIPOS:
   ══════════════════════════════════════
   - "matambre" → SOLO matambre. NUNCA bife, carne picada ni milanesa.
   - "bondiola" → SOLO bondiola. NUNCA cerdo genérico ni panceta.
   - "pollo" → pechuga/muslo de pollo. NUNCA carne vacuna ni cerdo.
   - "carne" → carne vacuna (bife, picada, lomo). NUNCA pollo ni cerdo.
   - "fideos" → fideos/spaghetti/tallarines/penne. NUNCA ñoquis, ravioles, lasagna.
   - "noquis/ñoquis" → ñoquis. NUNCA fideos ni ravioles.
   - "atun/atún" → atún. NUNCA merluza, salmón ni otro pescado.
   - "salmon/salmón" → salmón. NUNCA merluza ni atún.
   - "merluza" → merluza/brótola/abadejo. NUNCA atún ni salmón.
   - "zapallo" → zapallo/calabaza. NUNCA zapallito ni zucchini.
   - "espinaca" → espinaca. NUNCA acelga ni rúcula.
   - "poroto" → porotos/frijoles. NUNCA garbanzos ni lentejas.

6. FILTROS DIETÉTICOS: Si el usuario indica vegetariano/vegano/sin-gluten/sin-lactosa, la receta DEBE cumplirlos sin excepción.

7. RECETAS CASERAS: Priorizá recetas caseras, económicas, simples y con pasos claros.

8. NUTRICIÓN: Incluí información nutricional estimada por porción (calorías, proteínas, carbos, grasas, fibra).

9. SIN COMILLAS DOBLES en strings. Usá comillas simples si necesitás enfatizar.

10. ══════════════════════════════════════
    REGLA #3 — TÍTULOS ATRACTIVOS Y PRECISOS:
    ══════════════════════════════════════
    El título DEBE ser claro, descriptivo y reflejar exactamente la receta. Máximo 5 palabras.
    
    BUENAS opciones (descriptivos + atractivos):
    - "Matambre relleno con papas" ✅
    - "Pollo al horno con arroz" ✅
    - "Milanesas de pollo caseras" ✅
    - "Tarta de espinaca y queso" ✅
    - "Guiso de lentejas" ✅
    - "Fideos con atún y tomate" ✅
    
    PROHIBIDO:
    - Adjetivos vacíos: "explosivo", "mágico", "irresistible", "celestial", "divino", "supremo"
    - Frases sin sentido: "Sabores del campo", "Delicias caseras"
    - Títulos que NO reflejen los ingredientes del usuario

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO JSON (sin texto adicional, sin markdown):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "recipes": [
    {
      "name": "Nombre claro de la receta",
      "time": 30,
      "difficulty": "fácil",
      "servings": 4,
      "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad"],
      "steps": ["Paso 1 detallado", "Paso 2 detallado"],
      "tip": "Consejo práctico y útil",
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

RECORDATORIO FINAL: Verificá que CADA ingrediente del usuario aparezca en el campo "ingredients" antes de responder.`
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

    // STEP 1: Check daily limit (READ ONLY - no credit consumed yet)
    const limitCheck = await checkUserLimits(req);
    
    if (!useCacheOnly && !limitCheck.allowed) {
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
    
    console.log(`User ${limitCheck.userId} usage: ${limitCheck.usesToday}/${limitCheck.remaining + limitCheck.usesToday}`);

    // Both free and premium use 98% threshold for maximum relevance; AI fills the gap
    const isFreeUser = !limitCheck.isPremium;
    const cacheThreshold = 0.99; // 99% min for both plans — best user experience
    
    console.log(`User mode: ${isFreeUser ? 'FREE' : 'PREMIUM'}, cache threshold: ${cacheThreshold}, AI fallback enabled for both`);

    // STEP 2: Try cache first
    if (ingredients && ingredients.length > 0 && !surpriseMode) {
      const cacheResult = await searchCachedRecipes(
        ingredients, 
        time || 30, 
        mealType, 
        language || 'es',
        cacheThreshold,
        quickFilters || [],
        diet || [],
        excludeIngredients || [],
        excludeRecipes || []
      );
      
      if (cacheResult.recipes.length > 0) {
        const validCached = cacheResult.recipes.filter((r: any) => validateRecipeIngredients(r, ingredients, [...(quickFilters || []), ...(diet || [])], excludeIngredients || []));
        if (validCached.length > 0) {
          // Always consume credit on cache hit
          if (limitCheck.userId) {
            await consumeDailyCredit(limitCheck.userId, limitCheck.isPremium);
          }
          console.log(`✅ Serving ${validCached.length} validated cached recipes (score: ${cacheResult.matchScore.toFixed(2)})`);
          return new Response(JSON.stringify({ 
            recipes: validCached.slice(0, 1),
            source: 'cache',
            isInstant: true,
            matchScore: cacheResult.matchScore,
            matchInfo: cacheResult.matchInfo || null
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('⚠️ Cached recipes failed ingredient validation');
      }
    }
    
    // Cache-only mode (explicit flag only, NOT based on free/premium)
    if (useCacheOnly) {
      console.log(`🚫 Cache-only mode: no cache hit, returning empty`);
      return new Response(JSON.stringify({ 
        recipes: [],
        source: 'cache',
        isInstant: true,
        matchScore: 0,
        noResults: true,
        message: 'No encontramos recetas con esos ingredientes. Probá quitando alguno.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // STEP 3: No cache hit → call AI
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
      const ingCount = ingredients?.length || 0;
      userPrompt = `═══════════════════════════════════════
INGREDIENTES OBLIGATORIOS (${ingCount} en total):
${(ingredients || []).map((ing: string, i: number) => `  ${i+1}. ${ing}`).join('\n')}
═══════════════════════════════════════

⚠️ VERIFICACIÓN OBLIGATORIA ANTES DE RESPONDER:
Revisá que CADA uno de los ${ingCount} ingredientes listados arriba aparezca en el campo "ingredients" de tu receta.
Si alguno no está → la respuesta será rechazada automáticamente.

PROHIBICIONES ABSOLUTAS:
- NO sustituyas "matambre" por "carne", "bife" ni ninguna otra cosa.
- NO sustituyas "bondiola" por "cerdo" ni "panceta".
- NO sustituyas "pollo" por "carne vacuna" ni por "cerdo".
- NO sustituyas "fideos" por "ñoquis" ni "ravioles" (ni viceversa).
- NO sustituyas "atún" por "merluza" ni ningún otro pescado (ni viceversa).
- NO sustituyas "salmón" por "atún", "merluza" ni ningún otro pescado (ni viceversa).
- NO sustituyas "espinaca" por "acelga" ni por cualquier otra verdura de hoja.
- NO sustituyas "zapallo" por "zapallito" ni "zucchini" (ni viceversa).
- Solo podés agregar: sal, pimienta, aceite, ajo, cebolla, agua, especias básicas.

Generá EXACTAMENTE 1 SOLA receta que use TODOS los ingredientes listados.
Tiempo máximo de cocción: ${time} minutos.\n`;

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

    // Models ordered by capability — use smarter models first for better ingredient compliance
    const models = [
      'google/gemini-2.5-flash',
      'openai/gpt-5-mini',
      'google/gemini-3-flash-preview',
      'google/gemini-2.5-flash-lite',
      'openai/gpt-5-nano',
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

      // Fallback to cache — still requires 100% ingredient match
      if (!surpriseMode && ingredients && ingredients.length > 0) {
        const cacheResult = await searchCachedRecipes(ingredients, time || 30, mealType, language || 'es', 0.99, quickFilters || [], diet || [], excludeIngredients || []);
        if (cacheResult.recipes.length > 0) {
          const allUserFilters = [...(quickFilters || []), ...(diet || [])];
          const validFallback = cacheResult.recipes.filter((r: any) => 
            validateRecipeIngredients(r, ingredients, allUserFilters, excludeIngredients || [])
          );
          if (validFallback.length > 0) {
            if (limitCheck.userId) {
              await consumeDailyCredit(limitCheck.userId, limitCheck.isPremium);
            }
            return new Response(JSON.stringify({
              recipes: validFallback.slice(0, 1),
              source: 'cache',
              isInstant: true,
              fallbackReason: 'ai_unavailable',
              matchScore: cacheResult.matchScore
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      // Return error instead of emergency recipes
      return new Response(JSON.stringify({
        recipes: [],
        error: 'ai_unavailable',
        message: 'La IA no está disponible en este momento. Intentá de nuevo en unos segundos.'
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

    // STEP 3: POST-VALIDATION - verify recipes actually use user's ingredients
    if (result.recipes && result.recipes.length > 0 && ingredients && ingredients.length > 0 && !surpriseMode) {
      const allUserFilters = [...(quickFilters || []), ...(diet || [])];
      const validatedRecipes = result.recipes.filter((recipe: any) => 
        validateRecipeIngredients(recipe, ingredients, allUserFilters, excludeIngredients || [])
      );
      
      console.log(`Post-validation: ${validatedRecipes.length}/${result.recipes.length} recipes passed`);
      
      if (validatedRecipes.length === 0) {
        // RETRY: Try once more with a stronger prompt before giving up
        console.log('⚠️ AI recipes rejected, retrying with stronger prompt...');
        
        const retryPrompt = `⚠️ REINTENTO — Tu respuesta fue RECHAZADA porque no usó todos los ingredientes del usuario.

INGREDIENTES QUE DEBEN ESTAR SÍ O SÍ EN LA RECETA:
${ingredients.map((ing: string, i: number) => `  ${i+1}. ${ing}`).join('\n')}

REGLAS:
- NO sustituyas ningún ingrediente por otro.
- Todos los ingredientes listados DEBEN aparecer en el campo "ingredients".
- Tiempo máximo: ${time || 30} minutos.
${mealType ? `- Tipo de comida: ${mealType}` : ''}
- Respondé SOLO con JSON válido. UNA SOLA receta.`;
        
        let retryResult = null;
        for (const retryModel of models.slice(0, 3)) {
          try {
            console.log(`Retry with model: ${retryModel}`);
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), 20000);
            
            const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: retryModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: retryPrompt }
                ],
              }),
              signal: retryController.signal,
            });
            
            clearTimeout(retryTimeoutId);
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const retryContent = retryData.choices?.[0]?.message?.content;
              if (retryContent) {
                let cleanRetry = retryContent.replace(/```json\n?|\\n?```/g, '').trim();
                const jsonStart = cleanRetry.indexOf('{');
                const jsonEnd = cleanRetry.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                  cleanRetry = cleanRetry.substring(jsonStart, jsonEnd + 1);
                }
                const retryParsed = JSON.parse(cleanRetry);
                if (retryParsed.recipes && retryParsed.recipes.length > 0) {
                  const retryValidated = retryParsed.recipes.filter((recipe: any) => 
                    validateRecipeIngredients(recipe, ingredients, allUserFilters, excludeIngredients || [])
                  );
                  if (retryValidated.length > 0) {
                    console.log('✅ Retry succeeded!');
                    retryResult = retryValidated;
                    break;
                  }
                }
              }
            }
          } catch (retryErr) {
            console.error('Retry error:', retryErr);
          }
        }
        
        if (retryResult && retryResult.length > 0) {
          result.recipes = retryResult;
        } else {
          // All retries failed - return error, NOT emergency recipes
          console.log('❌ All retries failed, returning error to user');
          return new Response(JSON.stringify({
            recipes: [],
            error: 'no_matching_recipe',
            message: 'No pude generar una receta con esos ingredientes. Intentá de nuevo.'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        result.recipes = validatedRecipes;
      }
    }

    // STEP 4: Cache validated AI results with normalized ingredients (async)
    if (result.recipes && result.recipes.length > 0 && !surpriseMode) {
      cacheRecipes(result.recipes, ingredients, time || 30, mealType, language || 'es')
        .catch(err => console.error('Error caching recipes:', err));
    }

    // STEP 5: Consume credit ONLY on successful recipe generation
    if (result.recipes && result.recipes.length > 0 && limitCheck.userId) {
      await consumeDailyCredit(limitCheck.userId, limitCheck.isPremium);
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
    
    return new Response(JSON.stringify({
      recipes: [],
      error: 'unexpected_error',
      message: 'Ocurrió un error inesperado. Intentá de nuevo.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
