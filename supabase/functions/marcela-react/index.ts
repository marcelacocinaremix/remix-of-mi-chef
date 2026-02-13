import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  display_name?: string;
  gender?: string;
  diet_type?: string;
  cooking_skill?: string;
  preferred_foods?: string[];
  allergies?: string[];
}

interface ReactionRequest {
  action: string;
  context?: {
    ingredients?: string[];
    recipeName?: string;
    mealType?: string;
    filters?: Record<string, any>;
    historyStats?: {
      totalRecipes?: number;
      topIngredients?: string[];
    };
    userProfile?: UserProfile;
  };
}

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

function getGenderSalutation(gender?: string): { article: string; ending: string; greeting: string } {
  switch (gender) {
    case 'masculino':
      return { article: 'querido', ending: 'o', greeting: 'amigo' };
    case 'femenino':
      return { article: 'querida', ending: 'a', greeting: 'amiga' };
    default:
      return { article: 'querid@', ending: '@', greeting: 'amig@' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication (optional for marcela-react - works without auth but personalizes with it)
    const { authenticated, userId } = await checkAuth(req);
    
    if (authenticated && userId) {
      console.log(`Authorized: User ${userId} accessing marcela-react`);
    } else {
      console.log('Anonymous user accessing marcela-react - using defaults');
    }

    const { action, context } = await req.json() as ReactionRequest;
    const userProfile = context?.userProfile;

    // 1. Check cache first for non-personalized actions
    const nonPersonalizedActions = [
      'ingredient_added', 'ingredient_removed', 'filter_changed', 'meal_type_selected',
      'recipe_generated', 'recipe_selected', 'favorite_added', 'pantry_opened',
      'shopping_list_opened', 'history_viewed', 'calendar_opened', 'surprise_clicked',
      'idle', 'time_changed', 'favorites_opened', 'history_deleted',
      'tab_inicio', 'tab_resumen', 'tab_cocinar', 'tab_recetas', 'tab_plan',
      'tab_despensa', 'tab_super', 'tab_favoritos', 'tab_nutrientes',
      'tab_logros', 'tab_historial', 'tab_jugar', 'tab_marcelacocina',
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // For non-personalized actions (no name needed), try cache
    const canUseCache = nonPersonalizedActions.includes(action) && 
      (!userProfile?.display_name || action !== 'app_opened');

    if (canUseCache) {
      const { data: cachedReactions } = await supabaseAdmin
        .from('cached_marcela_reactions')
        .select('*')
        .eq('action', action)
        .order('usage_count', { ascending: true })
        .limit(10);

      if (cachedReactions && cachedReactions.length >= 3) {
        const picked = cachedReactions[Math.floor(Math.random() * cachedReactions.length)];
        console.log(`Marcela reaction cache HIT for "${action}"`);
        
        await supabaseAdmin
          .from('cached_marcela_reactions')
          .update({ usage_count: (picked.usage_count || 1) + 1 })
          .eq('id', picked.id);

        return new Response(JSON.stringify(picked.reaction_data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Marcela reaction cache MISS for "${action}", calling AI`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        reaction: getDefaultReaction(action, userProfile),
        mood: 'happy',
        animation: 'wave'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genderInfo = getGenderSalutation(userProfile?.gender);
    const userName = userProfile?.display_name || '';
    const userDiet = userProfile?.diet_type || '';
    const userSkill = userProfile?.cooking_skill || 'intermedio';
    const userFoods = userProfile?.preferred_foods?.join(', ') || '';
    const userAllergies = userProfile?.allergies?.join(', ') || '';

    // Only include name info if user actually has a name
    const hasName = userName && userName.trim().length > 0;
    
    const systemPrompt = `Sos Marcela, la chef de MarcelaCocina. Sos cálida, cercana, entusiasta.

Tu personalidad:
- Hablás en español rioplatense (usás "vos", "tenés", etc.)
- Sos como una abuela o tía cariñosa que adora cocinar
- GUIÁS al usuario explicándole qué puede hacer en cada sección

INFORMACIÓN DEL USUARIO:
${hasName ? `- Nombre: ${userName}` : '- Nombre: NO DISPONIBLE - NO uses nombre, NO inventes placeholder'}
- Género: ${userProfile?.gender || 'no especificado'} (usá terminaciones "${genderInfo.ending}" para adjetivos)
- Tipo de dieta: ${userDiet || 'no especificada'}
- Nivel de cocina: ${userSkill}
- Alergias: ${userAllergies || 'ninguna'}

REGLAS CRÍTICAS:
1. ${hasName ? `Usá el nombre "${userName}" SOLO en "app_opened" o "recipe_cooked". NUNCA en otros momentos.` : 'NO uses nombre del usuario. NO inventes placeholders como "[Nombre]" o "[Usuario]". Saludá directamente sin nombre.'}
2. NUNCA menciones la hora del día, el momento, si es temprano, tarde, etc.
3. Usá terminaciones de género: "${genderInfo.ending}" (ej: bienvenid${genderInfo.ending}, content${genderInfo.ending}).
4. Sé una GUÍA: explicá qué hacer en cada sección.
5. NUNCA sugieras ingredientes que el usuario tenga como alergia.
6. NUNCA uses placeholders como "[Nombre del usuario]", "[Tu nombre]", etc. Si no tenés nombre, NO lo menciones.

EJEMPLOS CORRECTOS SIN NOMBRE:
- "¡Hola! ¿Qué cocinamos hoy?"
- "¡Qué alegría verte! ¿List@ para cocinar?"
- "¡Bienvenid@! Tocá 'Cocinar' para empezar"

IMPORTANTE: Respondé SOLO con un JSON válido, sin markdown.
{
  "reaction": "texto corto máximo 18 palabras, guiando al usuario",
  "mood": "happy" | "excited" | "thinking" | "proud" | "curious" | "loving",
  "animation": "wave" | "bounce" | "sparkle" | "nod" | "celebrate" | "think",
  "tip": "opcional: consejo breve, máximo 12 palabras"
}`;

    const userPrompt = buildUserPrompt(action, context, userProfile);

    console.log('Marcela reacting to:', action, JSON.stringify(context));

    // Try multiple models for fallback
    const models = ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'];
    let response: Response | null = null;
    
    for (const model of models) {
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
          console.log(`Marcela success with model: ${model}`);
          break;
        }
        
        console.log(`Marcela model ${model} failed: ${response.status}`);
      } catch (e) {
        console.error(`Marcela fetch error with ${model}:`, e);
      }
    }

    if (!response || !response.ok) {
      return new Response(JSON.stringify({ 
        reaction: getDefaultReaction(action, userProfile),
        mood: 'happy',
        animation: 'wave'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(content);
      
      // 3. Cache the AI result for non-personalized actions
      if (canUseCache && parsed.reaction) {
        try {
          await supabaseAdmin.from('cached_marcela_reactions').insert({
            action,
            reaction_data: parsed,
          });
          console.log(`Cached marcela reaction for "${action}"`);
        } catch (cacheErr) {
          console.error('Error caching reaction:', cacheErr);
        }
      }
      
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ 
        reaction: content.slice(0, 100) || getDefaultReaction(action, userProfile),
        mood: 'happy',
        animation: 'wave'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in marcela-react:', error);
    return new Response(JSON.stringify({ 
      reaction: '¡Qué lindo tenerte acá! ¿Empezamos a cocinar?',
      mood: 'happy',
      animation: 'wave'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildUserPrompt(action: string, context?: ReactionRequest['context'], userProfile?: UserProfile): string {
  const genderInfo = getGenderSalutation(userProfile?.gender);
  const name = userProfile?.display_name || '';
  
  switch (action) {
    case 'ingredient_added':
      return `El usuario agregó ingredientes: ${context?.ingredients?.join(', ')}.
GUIALO: decile que puede seguir agregando o tocar "Generar recetas".
HACÉ UN CHISTE CORTO relacionado con los ingredientes si es posible.
NO nombres, NO horarios.`;

    case 'ingredient_removed':
      return `El usuario sacó un ingrediente.
GUIALO: puede agregar otros o generar recetas.
HACÉ UN CHISTE sobre sacar ingredientes (ej: "¡Afuera! Como la cebolla que me hace llorar").
NO nombres, NO horarios.`;

    case 'filter_changed':
      return `El usuario configuró filtros: ${JSON.stringify(context?.filters)}.
GUIALO: ahora puede generar recetas con esos filtros.
HACÉ UN CHISTE sobre filtrar (ej: "Filtro fino, como el café de mi abuela").
NO nombres, NO horarios.`;

    case 'meal_type_selected':
      return `El usuario eligió preparar: ${context?.mealType}.
GUIALO: ahora puede agregar ingredientes.
HACÉ UN CHISTE relacionado con el tipo de comida elegida.
NO nombres, NO horarios.`;

    case 'recipe_generated':
      return `Se generaron recetas con: ${context?.ingredients?.join(', ')}.
GUIALO: puede tocar cualquier receta para ver detalles.
HACÉ UN CHISTE de chef orgullosa presentando sus creaciones.
NO nombres, NO horarios.`;

    case 'recipe_selected':
      return `El usuario eligió: "${context?.recipeName}".
GUIALO: puede ver pasos, guardar en favoritos o marcar como cocinada.
HACÉ UN CHISTE aprobando la elección.
NO nombres, NO horarios.`;

    case 'recipe_cooked':
      return `¡El usuario cocinó "${context?.recipeName}"!
FELICITALO efusivamente usando su nombre "${name}" si lo tiene, y género "${genderInfo.ending}".
HACÉ UN CHISTE celebratorio (ej: "¡Más chef que Gordon Ramsay pero sin los gritos!").`;

    case 'favorite_added':
      return `El usuario guardó "${context?.recipeName}" en favoritos.
GUIALO: la encuentra en la pestaña Favoritos.
HACÉ UN CHISTE sobre guardar tesoros culinarios.
NO nombres, NO horarios.`;

    case 'pantry_opened':
      return `El usuario abrió "Despensa".
CONTEXTO: Acá puede guardar ingredientes que siempre tiene en casa para usarlos rápido al cocinar.
GUIALO: puede agregar ingredientes y después usarlos al generar recetas.
HACÉ UN CHISTE sobre despensas (ej: "Mi despensa secreta... aunque el dulce de leche nunca dura").
INCLUÍ TIP: "Guardá tus básicos para encontrarlos rápido".
NO nombres, NO horarios.`;

    case 'shopping_list_opened':
      return `El usuario abrió "Super" (lista de compras).
CONTEXTO: Acá organiza las compras. Puede agregar items y marcarlos cuando los compre.
GUIALO: puede agregar items manualmente o desde recetas.
HACÉ UN CHISTE sobre ir al super (ej: "¡Lista en mano, billetera temblando!" o "Para no volver sin el perejil").
INCLUÍ TIP: "Marcá los items cuando los compres".
NO nombres, NO horarios.`;

    case 'history_viewed':
      const stats = context?.historyStats;
      return `El usuario ve su historial. Cocinó ${stats?.totalRecipes || 0} recetas.
GUIALO: puede repetir recetas tocándolas.
HACÉ UN CHISTE sobre el historial culinario.
NO nombres, NO horarios.`;

    case 'calendar_opened':
      return `El usuario abrió "Plan Semanal".
CONTEXTO: Acá puede planificar las comidas de toda la semana arrastrando recetas a cada día.
GUIALO: puede arrastrar recetas a los días o usar la IA para generar un plan.
HACÉ UN CHISTE sobre planificar (ej: "¡Planificar es de sabios! O de gente cansada del delivery 😄").
INCLUÍ TIP: "Una semana organizada = menos estrés".
NO nombres, NO horarios.`;

    case 'surprise_clicked':
      return `¡El usuario activó modo sorpresa!
Reaccioná con emoción. GUIALO: le vas a sugerir algo rico.
HACÉ UN CHISTE emocionado sobre sorpresas culinarias.
NO nombres, NO horarios.`;

    case 'app_opened':
      if (name && name.trim()) {
        return `El usuario acaba de abrir la app.
BIENVENIDA: usá su nombre "${name}" y género "${genderInfo.ending}" para saludarlo cálidamente.
GUIALO: puede ir a "Cocinar" para empezar.
HACÉ UN CHISTE de bienvenida cálido.
NO menciones hora/momento del día.`;
      } else {
        return `El usuario acaba de abrir la app.
BIENVENIDA CÁLIDA sin nombre (NO tenés el nombre, NO inventes placeholder).
Saludá directamente: "¡Hola! ¿Qué cocinamos?" o similar. Usá género "${genderInfo.ending}".
GUIALO: puede ir a "Cocinar" para empezar.
HACÉ UN CHISTE de bienvenida.
NO menciones hora/momento del día.`;
      }

    case 'idle':
      return `El usuario está mirando sin hacer nada.
GUIALO suavemente hacia alguna acción.
HACÉ UN CHISTE para motivarlo a cocinar.
NO nombres, NO horarios.`;

    case 'tab_inicio':
      return `El usuario abrió "Inicio".
CONTEXTO: Es el cuartel general donde ve su resumen, recetas recientes, calendario y acceso rápido a todo.
GUIALO: puede explorar las diferentes secciones desde acá.
HACÉ UN CHISTE sobre ser el centro de comando culinario.
INCLUÍ TIP: "Desde acá accedés a todo tu mundo de cocina".
NO nombres, NO horarios.`;

    case 'tab_resumen':
      return `El usuario abrió "Mi Resumen".
GUIALO: acá ve recetas recientes, calendario y favoritos.
HACÉ UN CHISTE sobre resumir la vida culinaria.
NO nombres, NO horarios.`;

    case 'tab_cocinar':
      return `El usuario abrió "Cocinar".
CONTEXTO: Es la sección principal para generar recetas. Puede agregar ingredientes manualmente, por voz, o sacar foto a la heladera.
GUIALO: puede agregar ingredientes o usar la cámara para detectarlos automáticamente.
HACÉ UN CHISTE de chef emocionada (ej: "¡A los fogones! Acá es donde la magia pasa").
INCLUÍ TIP: "Sacá foto a tu heladera para detectar ingredientes".
NO nombres, NO horarios.`;

    case 'tab_recetas':
      return `El usuario abrió "Recetas de YouTube".
CONTEXTO: Acá puede ver todos mis videos de cocina del canal de YouTube, buscar recetas específicas y verlas.
GUIALO: puede buscar recetas y ver los videos directamente.
HACÉ UN CHISTE sobre ser estrella de YouTube (ej: "¡Mis videos! Más entretenidos que una novela turca").
INCLUÍ TIP: "Buscá por nombre o ingrediente".
NO nombres, NO horarios.`;

    case 'tab_plan':
      return `El usuario abrió "Plan Semanal".
CONTEXTO: Herramienta para planificar todas las comidas de la semana. Puede arrastrar recetas a cada día y tipo de comida.
GUIALO: puede planificar arrastrando recetas o usar la IA para generar un plan automático.
HACÉ UN CHISTE sobre ser organizado (ej: "¡Planificar es de pros! Bye bye 'qué como hoy'").
INCLUÍ TIP: "Usá la IA para un plan inteligente que reutiliza ingredientes".
NO nombres, NO horarios.`;

    case 'tab_despensa':
      return `El usuario abrió "Despensa".
CONTEXTO: Almacén virtual de ingredientes que siempre tiene en casa. Sirve para agregarlos rápido al cocinar.
GUIALO: puede agregar ingredientes básicos y después usarlos en recetas.
HACÉ UN CHISTE sobre despensas (ej: "¡La despensa de los secretos! Bueno, sal y aceite al menos 😄").
INCLUÍ TIP: "Guardá tus básicos: sal, aceite, especias...".
NO nombres, NO horarios.`;

    case 'tab_super':
      return `El usuario abrió "Super" (lista de compras).
CONTEXTO: Lista de compras inteligente. Puede agregar items manualmente o automáticamente desde las recetas del plan semanal.
GUIALO: puede agregar items, organizarlos por categoría y marcarlos cuando los compre.
HACÉ UN CHISTE sobre compras (ej: "¡La lista sagrada! Con esto no volvés sin el perejil").
INCLUÍ TIP: "Los items de las recetas del plan se agregan automáticamente".
NO nombres, NO horarios.`;

    case 'tab_favoritos':
      return `El usuario abrió "Favoritos".
CONTEXTO: Colección personal de recetas guardadas. Un tesoro de platos que le gustaron.
GUIALO: puede tocar cualquier receta para volver a hacerla o ver los ingredientes.
HACÉ UN CHISTE sobre favoritos (ej: "¡Tus tesoros culinarios! Como yo con el dulce de leche 🤤").
INCLUÍ TIP: "Tocá una para volver a prepararla".
NO nombres, NO horarios.`;

    case 'tab_nutrientes':
      return `El usuario abrió "Nutrientes" (balance nutricional).
CONTEXTO: Acá ve el balance de macronutrientes (proteínas, carbos, grasas) de las recetas que cocinó en la semana.
GUIALO: puede ver sus macros semanales y tips nutricionales personalizados.
HACÉ UN CHISTE sobre comer sano (ej: "¡Comer rico Y sano! Sí, es posible... aunque cueste creerlo 🥗").
INCLUÍ TIP: "Cocinando variado, comés equilibrado".
NO nombres, NO horarios.`;

    case 'tab_logros':
      return `El usuario abrió "Logros".
CONTEXTO: Sistema de gamificación con medallas y logros desbloqueables por cocinar.
GUIALO: puede ver sus logros desbloqueados y cuáles le faltan.
HACÉ UN CHISTE sobre logros (ej: "¡Tus medallas! Más valiosas que una estrella Michelin ⭐").
INCLUÍ TIP: "Seguí cocinando para desbloquear más".
NO nombres, NO horarios.`;

    case 'tab_historial':
      return `El usuario abrió "Historial Inteligente".
CONTEXTO: Registro de todas las recetas cocinadas con estadísticas y análisis de patrones.
GUIALO: puede ver qué cocinó, cuándo, y repetir recetas fácilmente.
HACÉ UN CHISTE sobre el historial (ej: "¡Tu diario culinario! Mejor que un álbum de fotos 📖").
INCLUÍ TIP: "Tocá una receta para volver a hacerla".
NO nombres, NO horarios.`;

    case 'tab_jugar':
      return `El usuario abrió "Jugar".
CONTEXTO: Minijuego de cocina para divertirse y aprender mientras gana puntos.
GUIALO: puede jugar, ganar puntos y competir consigo mismo.
HACÉ UN CHISTE gamer (ej: "¡Hora de jugar! Nivel: Master Chef virtual 🎮").
INCLUÍ TIP: "Ganá puntos cocinando virtualmente".
NO nombres, NO horarios.`;

    case 'tab_marcelacocina':
      return `El usuario abrió "Marcelacocina".
CONTEXTO: Sección sobre mí, mi historia, mi canal de YouTube y redes sociales.
GUIALO: puede conocer más sobre mí y seguirme en redes para más recetas.
HACÉ UN CHISTE personal (ej: "¡Mi historia! Spoiler: involucra mucho dulce de leche y amor 😄").
INCLUÍ TIP: "Seguime en YouTube para videos nuevos cada semana".
NO nombres, NO horarios.`;

    case 'time_changed':
      return `El usuario ajustó el tiempo para cocinar.
GUIALO: las recetas se filtran según ese tiempo disponible.
HACÉ UN CHISTE sobre el tiempo en la cocina.
NO nombres, NO horarios.`;

    case 'favorites_opened':
      return `El usuario abrió favoritos.
GUIALO: puede tocar cualquier favorito para volver a hacerlo.
HACÉ UN CHISTE sobre recetas favoritas.
NO nombres, NO horarios.`;

    case 'history_deleted':
      return `El usuario borró su historial.
Reaccioná positivo. GUIALO: puede ir a "Cocinar" para crear nuevas memorias.
HACÉ UN CHISTE sobre empezar de nuevo (ej: "¡Borrón y cuenta nueva! Como limpiar la mesada").
NO nombres, NO horarios.`;

    default:
      return `El usuario navega la app. GUIALO hacia alguna acción útil con un chiste simpático. NO nombres, NO horarios.`;
  }
}

function getDefaultReaction(action: string, userProfile?: UserProfile): string {
  const genderInfo = getGenderSalutation(userProfile?.gender);
  const hasName = userProfile?.display_name && userProfile.display_name.trim().length > 0;
  const name = hasName ? `, ${userProfile.display_name}` : '';
  
  const defaults: Record<string, string> = {
    ingredient_added: '¡Genial! Seguí agregando o tocá "Generar recetas" 🍳',
    ingredient_removed: '¡Afuera! Como la cebolla que me hace llorar 😅',
    filter_changed: '¡Filtro ajustado! Como el café de mi abuela ☕',
    meal_type_selected: '¡Buena elección! Ahora sumá ingredientes',
    recipe_generated: '¡Mirá estas delicias! Tocá una para los pasos',
    recipe_selected: '¡Excelente gusto! Guardala o empezá a cocinar',
    recipe_cooked: hasName ? `¡Felicitaciones${name}! Más chef que Gordon Ramsay 👨‍🍳` : `¡Felicitaciones! Más chef que Gordon Ramsay 👨‍🍳`,
    favorite_added: '¡Guardada en tu tesoro culinario! ❤️',
    pantry_opened: '¡Tu despensa secreta! Guardá lo que siempre tenés 📦',
    shopping_list_opened: '¡Lista de compras! Para no volver sin el perejil 🛒',
    history_viewed: '¡Tu diario de chef! Tocá para repetir recetas 📖',
    calendar_opened: '¡Planificá como un pro! Bye bye delivery 📅',
    surprise_clicked: '¡Me encanta sorprender! Como encontrar queso en la heladera 🧀',
    app_opened: hasName ? `¡Hola${name}! ¿Qué cocinamos? 👋` : '¡Hola! ¿Qué cocinamos hoy? 👋',
    idle: '¿Te echo una mano? Andá a "Cocinar" y arrancamos 🤔',
    time_changed: '¡Tiempo ajustado! Recetas a tu medida ⏱️',
    favorites_opened: '¡Tus favoritas! Como yo con el dulce de leche 🤤',
    history_deleted: '¡Borrón y cuenta nueva! Como limpiar la mesada ✨',
    // Tab defaults with jokes
    tab_inicio: `¡Tu cuartel general culinario! Desde acá dominás todo 🏠`,
    tab_resumen: `¡Tu resumen de chef! Más completo que un bife de chorizo 🥩`,
    tab_cocinar: '¡A los fogones! Agregá ingredientes o sacá foto 📸',
    tab_recetas: '¡Mis videos! Más entretenidos que una novela 🎬',
    tab_plan: '¡Planificación nivel pro! Adiós "qué como hoy" 📅',
    tab_despensa: '¡Tu despensa virtual! Más organizada que mi especiero 📦',
    tab_super: '¡Al super! Lista en mano, ahorro asegurado 🛒',
    tab_favoritos: '¡Tus tesoros culinarios! Tocá para repetir ❤️',
    tab_nutrientes: '¡Balance nutricional! Comer rico Y sano se puede 🥗',
    tab_logros: '¡Tus medallas! Más valiosas que Michelin ⭐',
    tab_historial: '¡Tu historia culinaria! Mejor que un álbum 📖',
    tab_jugar: '¡A jugar! Nivel Master Chef virtual 🎮',
    tab_marcelacocina: '¡Mi historia! Spoiler: hay mucho dulce de leche 😄',
  };
  return defaults[action] || 'Tocá "Cocinar" para arrancar a preparar algo rico 🍳';
}
