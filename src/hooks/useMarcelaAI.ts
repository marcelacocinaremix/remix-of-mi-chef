import { useState, useCallback, useRef } from 'react';

export type MarcelaMood = 'happy' | 'excited' | 'thinking' | 'proud' | 'curious' | 'loving';
export type MarcelaAnimation = 'wave' | 'bounce' | 'sparkle' | 'nod' | 'celebrate' | 'think';

export interface MarcelaReaction {
  reaction: string;
  mood: MarcelaMood;
  animation: MarcelaAnimation;
  tip?: string;
}

type Language = 'es' | 'en' | 'pt';

const LANGUAGE_STORAGE_KEY = "marcelacocina_language";

function getCurrentLanguage(): Language {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "es" || stored === "en" || stored === "pt" ? stored : "es";
}

interface ReactionTranslations {
  reaction: { es: string; en: string; pt: string };
  mood: MarcelaMood;
  animation: MarcelaAnimation;
  tip?: { es: string; en: string; pt: string };
}

// All reactions with translations
const predefinedReactions: Record<string, ReactionTranslations[]> = {
  // === INGREDIENT ACTIONS ===
  ingredient_added: [
    { 
      reaction: { 
        es: '¡Eso suena bien! Seguí sumando o tocá "Generar recetas"', 
        en: 'Sounds good! Keep adding or tap "Generate recipes"',
        pt: 'Isso parece bom! Continue adicionando ou toque em "Gerar receitas"'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Con 3+ ingredientes salen mejores combinaciones', 
        en: 'With 3+ ingredients you get better combinations',
        pt: 'Com 3+ ingredientes saem melhores combinações'
      } 
    },
    { 
      reaction: { 
        es: '¡Mmm, me gusta! ¿Qué más tenés por ahí?', 
        en: 'Mmm, I like it! What else do you have?',
        pt: 'Mmm, gosto! O que mais você tem por aí?'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Probá agregar una proteína y una verdura', 
        en: 'Try adding a protein and a vegetable',
        pt: 'Tente adicionar uma proteína e um vegetal'
      } 
    },
    { 
      reaction: { 
        es: '¡Genial elección! Ahora tocá el botón naranja para generar', 
        en: 'Great choice! Now tap the orange button to generate',
        pt: 'Ótima escolha! Agora toque no botão laranja para gerar'
      }, 
      mood: 'excited', 
      animation: 'sparkle' 
    },
  ],
  ingredient_removed: [
    { 
      reaction: { 
        es: '¡Fuera! Hacemos lugar para algo mejor', 
        en: 'Out! Making room for something better',
        pt: 'Fora! Fazendo espaço para algo melhor'
      }, 
      mood: 'happy', 
      animation: 'nod' 
    },
  ],
  
  // === FILTERS & SETTINGS ===
  filter_changed: [
    { 
      reaction: { 
        es: '¡Perfecto! Los filtros afectan las recetas generadas', 
        en: 'Perfect! Filters affect the generated recipes',
        pt: 'Perfeito! Os filtros afetam as receitas geradas'
      }, 
      mood: 'thinking', 
      animation: 'think', 
      tip: { 
        es: 'Probá filtrar por dificultad si sos principiante', 
        en: 'Try filtering by difficulty if you\'re a beginner',
        pt: 'Tente filtrar por dificuldade se você é iniciante'
      } 
    },
    { 
      reaction: { 
        es: '¡Listo! Ahora las recetas van a ser más a tu medida', 
        en: 'Done! Now the recipes will be more tailored to you',
        pt: 'Pronto! Agora as receitas serão mais adequadas para você'
      }, 
      mood: 'happy', 
      animation: 'nod' 
    },
  ],
  meal_type_selected: [
    { 
      reaction: { 
        es: '¡Buena elección! Ahora agregá ingredientes abajo', 
        en: 'Good choice! Now add ingredients below',
        pt: 'Boa escolha! Agora adicione ingredientes abaixo'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Escribí o usá la cámara para detectar ingredientes', 
        en: 'Type or use the camera to detect ingredients',
        pt: 'Digite ou use a câmera para detectar ingredientes'
      } 
    },
  ],
  time_changed: [
    { 
      reaction: { 
        es: '¡Tiempo ajustado! Solo verás recetas que entren en tu agenda', 
        en: 'Time adjusted! You\'ll only see recipes that fit your schedule',
        pt: 'Tempo ajustado! Você só verá receitas que cabem na sua agenda'
      }, 
      mood: 'thinking', 
      animation: 'nod' 
    },
  ],

  // === RECIPE GENERATION ===
  recipe_generated: [
    { 
      reaction: { 
        es: '¡Mirá lo que preparé! Tocá una tarjeta para ver detalles', 
        en: 'Look what I prepared! Tap a card to see details',
        pt: 'Olha o que preparei! Toque em um cartão para ver detalhes'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'Deslizá a la derecha para ver más opciones', 
        en: 'Swipe right to see more options',
        pt: 'Deslize para a direita para ver mais opções'
      } 
    },
    { 
      reaction: { 
        es: '¡Listas las recetas! Cada tarjeta muestra tiempo y dificultad', 
        en: 'Recipes ready! Each card shows time and difficulty',
        pt: 'Receitas prontas! Cada cartão mostra tempo e dificuldade'
      }, 
      mood: 'proud', 
      animation: 'sparkle', 
      tip: { 
        es: 'Tocá ⭐ para guardar en favoritos', 
        en: 'Tap ⭐ to save to favorites',
        pt: 'Toque ⭐ para salvar nos favoritos'
      } 
    },
  ],
  recipe_selected: [
    { 
      reaction: { 
        es: '¡Excelente opción! Arriba ves ingredientes, abajo los pasos', 
        en: 'Excellent choice! Ingredients above, steps below',
        pt: 'Excelente escolha! Ingredientes acima, passos abaixo'
      }, 
      mood: 'proud', 
      animation: 'sparkle', 
      tip: { 
        es: 'Tocá "Empezar a cocinar" para modo guiado', 
        en: 'Tap "Start cooking" for guided mode',
        pt: 'Toque "Começar a cozinhar" para modo guiado'
      } 
    },
    { 
      reaction: { 
        es: '¡Esa me encanta! Podés compartirla o guardarla en favoritos', 
        en: 'I love that one! You can share it or save to favorites',
        pt: 'Adoro essa! Você pode compartilhar ou salvar nos favoritos'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'El corazón ❤️ la guarda en favoritos', 
        en: 'The heart ❤️ saves it to favorites',
        pt: 'O coração ❤️ salva nos favoritos'
      } 
    },
  ],
  recipe_cooked: [
    { 
      reaction: { 
        es: '¡Felicitaciones, sos crack! 👨‍🍳 +1 receta cocinada', 
        en: 'Congratulations, you\'re amazing! 👨‍🍳 +1 recipe cooked',
        pt: 'Parabéns, você é incrível! 👨‍🍳 +1 receita cozinhada'
      }, 
      mood: 'loving', 
      animation: 'celebrate', 
      tip: { 
        es: 'Revisá tus logros, capaz desbloqueaste uno', 
        en: 'Check your achievements, you might have unlocked one',
        pt: 'Verifique suas conquistas, talvez você desbloqueou uma'
      } 
    },
    { 
      reaction: { 
        es: '¡Lo lograste! La receta queda guardada en tu historial', 
        en: 'You did it! The recipe is saved in your history',
        pt: 'Você conseguiu! A receita fica salva no seu histórico'
      }, 
      mood: 'proud', 
      animation: 'celebrate' 
    },
  ],
  favorite_added: [
    { 
      reaction: { 
        es: '¡Guardada! La encontrás en la pestaña Favoritos', 
        en: 'Saved! Find it in the Favorites tab',
        pt: 'Salvo! Encontre na aba Favoritos'
      }, 
      mood: 'loving', 
      animation: 'sparkle' 
    },
  ],
  surprise_clicked: [
    { 
      reaction: { 
        es: '¡Sorpresa! Generando receta con lo que tengas...', 
        en: 'Surprise! Generating a recipe with what you have...',
        pt: 'Surpresa! Gerando receita com o que você tem...'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'Ideal cuando no sabés qué cocinar', 
        en: 'Ideal when you don\'t know what to cook',
        pt: 'Ideal quando você não sabe o que cozinhar'
      } 
    },
  ],

  // === APP STATES ===
  app_opened: [
    { 
      reaction: { 
        es: '¡Hola! Soy Marcela, tu asistente de cocina. Te voy a guiar por toda la app 👩‍🍳', 
        en: 'Hi! I\'m Marcela, your cooking assistant. I\'ll guide you through the app 👩‍🍳',
        pt: 'Oi! Sou Marcela, sua assistente de cozinha. Vou te guiar pelo app 👩‍🍳'
      }, 
      mood: 'happy', 
      animation: 'wave', 
      tip: { 
        es: 'Explorá las pestañas de abajo para descubrir todo', 
        en: 'Explore the tabs below to discover everything',
        pt: 'Explore as abas abaixo para descobrir tudo'
      } 
    },
    { 
      reaction: { 
        es: '¡Bienvenido/a! Estás en INICIO. Desde acá ves tu resumen y accedés rápido a todo', 
        en: 'Welcome! You\'re on HOME. From here you see your summary and quick access to everything',
        pt: 'Bem-vindo/a! Você está no INÍCIO. Daqui você vê seu resumo e acesso rápido a tudo'
      }, 
      mood: 'excited', 
      animation: 'wave', 
      tip: { 
        es: 'Tocá "Cocinar" para generar tu primera receta', 
        en: 'Tap "Cook" to generate your first recipe',
        pt: 'Toque "Cozinhar" para gerar sua primeira receita'
      } 
    },
    { 
      reaction: { 
        es: '¡Hola chef! Te guío: arriba ves tu progreso, abajo las secciones principales', 
        en: 'Hi chef! Let me guide you: progress above, main sections below',
        pt: 'Oi chef! Te guio: progresso acima, seções principais abaixo'
      }, 
      mood: 'happy', 
      animation: 'sparkle', 
      tip: { 
        es: 'Empezá por "Cocinar" para probar la magia ✨', 
        en: 'Start with "Cook" to try the magic ✨',
        pt: 'Comece por "Cozinhar" para experimentar a magia ✨'
      } 
    },
  ],
  idle: [
    { 
      reaction: { 
        es: '¿Te ayudo? Tocá cualquier sección de abajo para explorar', 
        en: 'Need help? Tap any section below to explore',
        pt: 'Precisa de ajuda? Toque qualquer seção abaixo para explorar'
      }, 
      mood: 'curious', 
      animation: 'think', 
      tip: { 
        es: 'Cada pestaña tiene funciones diferentes', 
        en: 'Each tab has different functions',
        pt: 'Cada aba tem funções diferentes'
      } 
    },
  ],
  history_deleted: [
    { 
      reaction: { 
        es: '¡Historial limpio! Empezamos de cero, listos para nuevas recetas', 
        en: 'History cleared! Starting fresh, ready for new recipes',
        pt: 'Histórico limpo! Começando do zero, prontos para novas receitas'
      }, 
      mood: 'happy', 
      animation: 'nod' 
    },
  ],

  // === TAB: INICIO ===
  tab_inicio: [
    { 
      reaction: { 
        es: '¡Tu panel principal! Acá ves tu progreso, rachas y accesos rápidos a todo', 
        en: 'Your main panel! Here you see your progress, streaks and quick access to everything',
        pt: 'Seu painel principal! Aqui você vê seu progresso, sequências e acesso rápido a tudo'
      }, 
      mood: 'happy', 
      animation: 'wave', 
      tip: { 
        es: 'Tocá las tarjetas para ir directo a cada sección', 
        en: 'Tap the cards to go directly to each section',
        pt: 'Toque nos cartões para ir direto a cada seção'
      } 
    },
    { 
      reaction: { 
        es: '¡Bienvenido/a! Este es tu resumen diario: estadísticas, desafíos y más', 
        en: 'Welcome! This is your daily summary: stats, challenges and more',
        pt: 'Bem-vindo/a! Este é seu resumo diário: estatísticas, desafios e mais'
      }, 
      mood: 'excited', 
      animation: 'sparkle', 
      tip: { 
        es: 'Revisá el desafío diario para ganar puntos extra', 
        en: 'Check the daily challenge to earn extra points',
        pt: 'Verifique o desafio diário para ganhar pontos extras'
      } 
    },
  ],

  // === TAB: COCINAR (principal) ===
  tab_cocinar: [
    { 
      reaction: { 
        es: '¡Zona de cocina! 👩‍🍳 Paso 1: elegí el tipo de comida arriba', 
        en: 'Cooking zone! 👩‍🍳 Step 1: choose the meal type above',
        pt: 'Zona de cozinha! 👩‍🍳 Passo 1: escolha o tipo de refeição acima'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Después agregá ingredientes y tocá Generar', 
        en: 'Then add ingredients and tap Generate',
        pt: 'Depois adicione ingredientes e toque Gerar'
      } 
    },
    { 
      reaction: { 
        es: '¡A cocinar! Escribí ingredientes o usá 📸 para detectarlos con la cámara', 
        en: 'Let\'s cook! Type ingredients or use 📸 to detect them with camera',
        pt: 'Vamos cozinhar! Digite ingredientes ou use 📸 para detectar com a câmera'
      }, 
      mood: 'happy', 
      animation: 'sparkle', 
      tip: { 
        es: 'Con 3+ ingredientes salen mejores recetas', 
        en: 'With 3+ ingredients you get better recipes',
        pt: 'Com 3+ ingredientes saem melhores receitas'
      } 
    },
    { 
      reaction: { 
        es: '¡Acá generamos magia! Elegí tipo de comida → agregá ingredientes → ¡Generar!', 
        en: 'Here we make magic! Choose meal type → add ingredients → Generate!',
        pt: 'Aqui fazemos magia! Escolha tipo de refeição → adicione ingredientes → Gerar!'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'Probá el botón "Sorprendeme" si no sabés qué hacer', 
        en: 'Try the "Surprise me" button if you don\'t know what to do',
        pt: 'Tente o botão "Surpreenda-me" se não sabe o que fazer'
      } 
    },
  ],

  // === TAB: MI COCINA ===
  tab_micocina: [
    { 
      reaction: { 
        es: '¡Tu cocina personal! Acá están tus favoritos, historial, logros y productos escaneados', 
        en: 'Your personal kitchen! Here are your favorites, history, achievements and scanned products',
        pt: 'Sua cozinha pessoal! Aqui estão seus favoritos, histórico, conquistas e produtos escaneados'
      }, 
      mood: 'proud', 
      animation: 'sparkle', 
      tip: { 
        es: 'Usá las sub-pestañas para navegar', 
        en: 'Use the sub-tabs to navigate',
        pt: 'Use as sub-abas para navegar'
      } 
    },
    { 
      reaction: { 
        es: '¡Todo lo tuyo! Recetas guardadas ❤️, lo que cocinaste 📋, tus medallas 🏆 y escáner 📷', 
        en: 'All yours! Saved recipes ❤️, what you cooked 📋, your medals 🏆 and scanner 📷',
        pt: 'Tudo seu! Receitas salvas ❤️, o que você cozinhou 📋, suas medalhas 🏆 e scanner 📷'
      }, 
      mood: 'happy', 
      animation: 'bounce', 
      tip: { 
        es: 'Tocá Favoritos para ver tus recetas guardadas', 
        en: 'Tap Favorites to see your saved recipes',
        pt: 'Toque Favoritos para ver suas receitas salvas'
      } 
    },
    { 
      reaction: { 
        es: '¡Tu rincón gastronómico! Favoritos, historial de recetas y tus logros de chef', 
        en: 'Your culinary corner! Favorites, recipe history and your chef achievements',
        pt: 'Seu cantinho gastronômico! Favoritos, histórico de receitas e suas conquistas de chef'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'El escáner te deja leer etiquetas nutricionales', 
        en: 'The scanner lets you read nutritional labels',
        pt: 'O scanner permite ler rótulos nutricionais'
      } 
    },
  ],

  // === TAB: PLANIFICAR ===
  tab_planificar: [
    { 
      reaction: { 
        es: '¡Planificá tu semana! 📅 Calendario, despensa, lista de compras y balance nutricional', 
        en: 'Plan your week! 📅 Calendar, pantry, shopping list and nutritional balance',
        pt: 'Planeje sua semana! 📅 Calendário, despensa, lista de compras e balanço nutricional'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Tocá un día para agregar comidas', 
        en: 'Tap a day to add meals',
        pt: 'Toque em um dia para adicionar refeições'
      } 
    },
    { 
      reaction: { 
        es: '¡Organizador completo! Planificá comidas, gestioná despensa y armá la lista del super', 
        en: 'Complete organizer! Plan meals, manage pantry and create shopping list',
        pt: 'Organizador completo! Planeje refeições, gerencie despensa e crie lista de compras'
      }, 
      mood: 'happy', 
      animation: 'sparkle', 
      tip: { 
        es: 'Tocá "Generar con IA" para autocompletar la semana', 
        en: 'Tap "Generate with AI" to auto-complete the week',
        pt: 'Toque "Gerar com IA" para autocompletar a semana'
      } 
    },
    { 
      reaction: { 
        es: '¡Todo para planificar! Calendario semanal, despensa, compras y nutrición en un solo lugar', 
        en: 'Everything to plan! Weekly calendar, pantry, shopping and nutrition in one place',
        pt: 'Tudo para planejar! Calendário semanal, despensa, compras e nutrição em um só lugar'
      }, 
      mood: 'proud', 
      animation: 'nod', 
      tip: { 
        es: 'La IA reutiliza ingredientes para que ahorres', 
        en: 'AI reuses ingredients to save you money',
        pt: 'A IA reutiliza ingredientes para você economizar'
      } 
    },
  ],

  // === TAB: APRENDER ===
  tab_aprender: [
    { 
      reaction: { 
        es: '¡Escuela de cocina! 🎓 Aprendé técnicas, tips y secretos culinarios', 
        en: 'Cooking school! 🎓 Learn techniques, tips and culinary secrets',
        pt: 'Escola de cozinha! 🎓 Aprenda técnicas, dicas e segredos culinários'
      }, 
      mood: 'excited', 
      animation: 'sparkle', 
      tip: { 
        es: 'Empezá por los cursos de nivel básico', 
        en: 'Start with the basic level courses',
        pt: 'Comece pelos cursos de nível básico'
      } 
    },
    { 
      reaction: { 
        es: '¡Hora de aprender! Cursos organizados por nivel: básico, intermedio y avanzado', 
        en: 'Time to learn! Courses organized by level: basic, intermediate and advanced',
        pt: 'Hora de aprender! Cursos organizados por nível: básico, intermediário e avançado'
      }, 
      mood: 'happy', 
      animation: 'bounce', 
      tip: { 
        es: 'Cada lección completada suma a tu progreso', 
        en: 'Each completed lesson adds to your progress',
        pt: 'Cada lição completada soma ao seu progresso'
      } 
    },
    { 
      reaction: { 
        es: '¡Convertite en chef! Técnicas de cocina, cortes, salsas y mucho más', 
        en: 'Become a chef! Cooking techniques, cuts, sauces and much more',
        pt: 'Torne-se um chef! Técnicas de cozinha, cortes, molhos e muito mais'
      }, 
      mood: 'proud', 
      animation: 'celebrate', 
      tip: { 
        es: 'Mirá los videos y después practicá con recetas', 
        en: 'Watch the videos and then practice with recipes',
        pt: 'Assista aos vídeos e depois pratique com receitas'
      } 
    },
  ],

  // === TAB: JUGAR ===
  tab_jugar: [
    { 
      reaction: { 
        es: '¡Hora de jugar! 🎮 Elegí ingredientes correctos para cada receta contra el tiempo', 
        en: 'Time to play! 🎮 Choose the right ingredients for each recipe against the clock',
        pt: 'Hora de jogar! 🎮 Escolha os ingredientes certos para cada receita contra o tempo'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'Ganá puntos por velocidad y precisión', 
        en: 'Earn points for speed and precision',
        pt: 'Ganhe pontos por velocidade e precisão'
      } 
    },
    { 
      reaction: { 
        es: '¡Minijuego de cocina! Aprendé ingredientes mientras competís por el highscore', 
        en: 'Cooking mini-game! Learn ingredients while competing for the highscore',
        pt: 'Mini-jogo de cozinha! Aprenda ingredientes enquanto compete pelo highscore'
      }, 
      mood: 'happy', 
      animation: 'bounce', 
      tip: { 
        es: 'Mantené rachas para multiplicar puntos', 
        en: 'Keep streaks to multiply points',
        pt: 'Mantenha sequências para multiplicar pontos'
      } 
    },
    { 
      reaction: { 
        es: '¡A divertirse! Arrastrá los ingredientes al plato antes de que se acabe el tiempo', 
        en: 'Have fun! Drag ingredients to the plate before time runs out',
        pt: 'Divirta-se! Arraste os ingredientes para o prato antes que o tempo acabe'
      }, 
      mood: 'proud', 
      animation: 'sparkle', 
      tip: { 
        es: 'Cada receta completada suma tiempo extra', 
        en: 'Each completed recipe adds extra time',
        pt: 'Cada receita completada adiciona tempo extra'
      } 
    },
  ],

  // === TAB: RECETAS (YouTube) ===
  tab_marcela: [
    { 
      reaction: { 
        es: '¡Mis videos! 🎬 Recetas en video con el paso a paso completo', 
        en: 'My videos! 🎬 Video recipes with complete step-by-step',
        pt: 'Meus vídeos! 🎬 Receitas em vídeo com passo a passo completo'
      }, 
      mood: 'excited', 
      animation: 'sparkle', 
      tip: { 
        es: 'Tocá un video para verlo en YouTube', 
        en: 'Tap a video to watch it on YouTube',
        pt: 'Toque um vídeo para assistir no YouTube'
      } 
    },
    { 
      reaction: { 
        es: '¡Canal de YouTube! Mirá las recetas que subo con tips y trucos', 
        en: 'YouTube channel! Watch the recipes I upload with tips and tricks',
        pt: 'Canal do YouTube! Assista às receitas que posto com dicas e truques'
      }, 
      mood: 'happy', 
      animation: 'bounce', 
      tip: { 
        es: 'Suscribite para no perderte nada', 
        en: 'Subscribe so you don\'t miss anything',
        pt: 'Inscreva-se para não perder nada'
      } 
    },
    { 
      reaction: { 
        es: '¡Recetas en video! Desde clásicos argentinos hasta platos internacionales', 
        en: 'Video recipes! From Argentine classics to international dishes',
        pt: 'Receitas em vídeo! Desde clássicos argentinos até pratos internacionais'
      }, 
      mood: 'loving', 
      animation: 'celebrate', 
      tip: { 
        es: 'Los videos más nuevos aparecen primero', 
        en: 'The newest videos appear first',
        pt: 'Os vídeos mais novos aparecem primeiro'
      } 
    },
  ],

  // === TAB: COMUNIDAD ===
  tab_comunidad: [
    { 
      reaction: { 
        es: '¡Comunidad Marcela Cocina! 🌟 Conectá con otros amantes de la cocina', 
        en: 'Marcela Cocina community! 🌟 Connect with other cooking lovers',
        pt: 'Comunidade Marcela Cocina! 🌟 Conecte-se com outros amantes da cozinha'
      }, 
      mood: 'loving', 
      animation: 'celebrate', 
      tip: { 
        es: 'Seguime en YouTube e Instagram', 
        en: 'Follow me on YouTube and Instagram',
        pt: 'Me siga no YouTube e Instagram'
      } 
    },
    { 
      reaction: { 
        es: '¡Unite a la familia! Compartí tus creaciones y aprendé de otros', 
        en: 'Join the family! Share your creations and learn from others',
        pt: 'Junte-se à família! Compartilhe suas criações e aprenda com outros'
      }, 
      mood: 'happy', 
      animation: 'sparkle', 
      tip: { 
        es: 'En Instagram subo stories con tips diarios', 
        en: 'On Instagram I post stories with daily tips',
        pt: 'No Instagram posto stories com dicas diárias'
      } 
    },
    { 
      reaction: { 
        es: '¡Somos comunidad! Miles de personas cocinando juntas. ¿Te sumás?', 
        en: 'We are a community! Thousands cooking together. Will you join?',
        pt: 'Somos comunidade! Milhares cozinhando juntos. Você vem?'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Comentá en los videos tus dudas', 
        en: 'Comment your questions on the videos',
        pt: 'Comente suas dúvidas nos vídeos'
      } 
    },
  ],

  // === SUB-TABS ESPECÍFICOS ===
  
  // Favoritos
  tab_favoritos: [
    { 
      reaction: { 
        es: '¡Tus favoritas! ❤️ Tocá una receta para volver a prepararla', 
        en: 'Your favorites! ❤️ Tap a recipe to make it again',
        pt: 'Suas favoritas! ❤️ Toque uma receita para preparar novamente'
      }, 
      mood: 'loving', 
      animation: 'sparkle', 
      tip: { 
        es: 'Deslizá a la izquierda para eliminar', 
        en: 'Swipe left to delete',
        pt: 'Deslize para a esquerda para excluir'
      } 
    },
    { 
      reaction: { 
        es: '¡Tu colección personal! Las mejores recetas que guardaste', 
        en: 'Your personal collection! The best recipes you saved',
        pt: 'Sua coleção pessoal! As melhores receitas que você salvou'
      }, 
      mood: 'proud', 
      animation: 'celebrate', 
      tip: { 
        es: 'Tocá el corazón en cualquier receta para agregarla acá', 
        en: 'Tap the heart on any recipe to add it here',
        pt: 'Toque o coração em qualquer receita para adicioná-la aqui'
      } 
    },
  ],
  favorites_opened: [
    { 
      reaction: { 
        es: '¡Favoritas! Tocá para ver detalles o empezar a cocinar', 
        en: 'Favorites! Tap to see details or start cooking',
        pt: 'Favoritas! Toque para ver detalhes ou começar a cozinhar'
      }, 
      mood: 'loving', 
      animation: 'sparkle' 
    },
  ],

  // Historial
  tab_historial: [
    { 
      reaction: { 
        es: '¡Tu historial! 📋 Todas las recetas que cocinaste, ordenadas por fecha', 
        en: 'Your history! 📋 All recipes you cooked, sorted by date',
        pt: 'Seu histórico! 📋 Todas as receitas que você cozinhou, ordenadas por data'
      }, 
      mood: 'curious', 
      animation: 'sparkle', 
      tip: { 
        es: 'Tocá una para repetirla fácilmente', 
        en: 'Tap one to repeat it easily',
        pt: 'Toque uma para repeti-la facilmente'
      } 
    },
    { 
      reaction: { 
        es: '¡Memoria culinaria! Revisá qué hiciste cada día', 
        en: 'Culinary memory! Review what you made each day',
        pt: 'Memória culinária! Revise o que você fez cada dia'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Las más recientes aparecen arriba', 
        en: 'The most recent ones appear at the top',
        pt: 'As mais recentes aparecem no topo'
      } 
    },
  ],
  history_viewed: [
    { 
      reaction: { 
        es: '¡Mirá todo lo que cocinaste! Sos todo un chef', 
        en: 'Look at everything you cooked! You\'re quite the chef',
        pt: 'Olha tudo o que você cozinhou! Você é um verdadeiro chef'
      }, 
      mood: 'proud', 
      animation: 'sparkle' 
    },
  ],

  // Logros
  tab_logros: [
    { 
      reaction: { 
        es: '¡Tus logros! 🏆 Cada receta te acerca a nuevas medallas', 
        en: 'Your achievements! 🏆 Each recipe brings you closer to new medals',
        pt: 'Suas conquistas! 🏆 Cada receita te aproxima de novas medalhas'
      }, 
      mood: 'proud', 
      animation: 'celebrate', 
      tip: { 
        es: 'Cociná más para desbloquear todos', 
        en: 'Cook more to unlock them all',
        pt: 'Cozinhe mais para desbloquear todos'
      } 
    },
    { 
      reaction: { 
        es: '¡Medallas de chef! Los grises están bloqueados, ¡a conseguirlos!', 
        en: 'Chef medals! The gray ones are locked, go get them!',
        pt: 'Medalhas de chef! Os cinzas estão bloqueados, vá conquistá-los!'
      }, 
      mood: 'excited', 
      animation: 'sparkle', 
      tip: { 
        es: 'Algunas se desbloquean por rachas diarias', 
        en: 'Some are unlocked by daily streaks',
        pt: 'Alguns são desbloqueados por sequências diárias'
      } 
    },
  ],

  // Escáner
  tab_escaneo: [
    { 
      reaction: { 
        es: '¡Escáner nutricional! 📷 Apuntá a la tabla de un producto', 
        en: 'Nutritional scanner! 📷 Point at a product label',
        pt: 'Scanner nutricional! 📷 Aponte para a tabela de um produto'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Enfocá bien los números para mejor lectura', 
        en: 'Focus well on the numbers for better reading',
        pt: 'Foque bem nos números para melhor leitura'
      } 
    },
    { 
      reaction: { 
        es: '¡Detective de calorías! Escaneá etiquetas para ver macros', 
        en: 'Calorie detective! Scan labels to see macros',
        pt: 'Detetive de calorias! Escaneie rótulos para ver macros'
      }, 
      mood: 'curious', 
      animation: 'sparkle', 
      tip: { 
        es: 'Después podés agregar el producto a tu despensa', 
        en: 'You can then add the product to your pantry',
        pt: 'Depois você pode adicionar o produto à sua despensa'
      } 
    },
  ],
  scanning_started: [
    { 
      reaction: { 
        es: 'Enfocá bien la etiqueta... que se vean los números', 
        en: 'Focus well on the label... make sure the numbers are visible',
        pt: 'Foque bem no rótulo... que os números sejam visíveis'
      }, 
      mood: 'thinking', 
      animation: 'think' 
    },
  ],
  ocr_processing: [
    { 
      reaction: { 
        es: 'Leyendo los valores nutricionales... un segundito', 
        en: 'Reading nutritional values... just a second',
        pt: 'Lendo os valores nutricionais... um segundinho'
      }, 
      mood: 'thinking', 
      animation: 'think' 
    },
  ],
  product_scanned: [
    { 
      reaction: { 
        es: '¡Escaneado! Revisá que los datos estén bien antes de guardar', 
        en: 'Scanned! Check that the data is correct before saving',
        pt: 'Escaneado! Verifique se os dados estão corretos antes de salvar'
      }, 
      mood: 'excited', 
      animation: 'celebrate', 
      tip: { 
        es: 'Podés editar si algo salió mal', 
        en: 'You can edit if something went wrong',
        pt: 'Você pode editar se algo deu errado'
      } 
    },
  ],
  product_saved: [
    { 
      reaction: { 
        es: '¡Guardado! Lo encontrás en la lista de productos', 
        en: 'Saved! Find it in the product list',
        pt: 'Salvo! Encontre na lista de produtos'
      }, 
      mood: 'proud', 
      animation: 'sparkle' 
    },
  ],
  product_deleted: [
    { 
      reaction: { 
        es: '¡Eliminado! Un producto menos en la lista', 
        en: 'Deleted! One less product on the list',
        pt: 'Excluído! Um produto a menos na lista'
      }, 
      mood: 'happy', 
      animation: 'nod' 
    },
  ],
  product_to_pantry: [
    { 
      reaction: { 
        es: '¡A la despensa! Ahora lo tenés disponible para tus recetas', 
        en: 'To the pantry! Now you have it available for your recipes',
        pt: 'Para a despensa! Agora você tem disponível para suas receitas'
      }, 
      mood: 'excited', 
      animation: 'bounce' 
    },
  ],

  // Calendario
  tab_calendario: [
    { 
      reaction: { 
        es: '¡Calendario semanal! 📅 Tocá un slot vacío para agregar comida', 
        en: 'Weekly calendar! 📅 Tap an empty slot to add a meal',
        pt: 'Calendário semanal! 📅 Toque em um slot vazio para adicionar refeição'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'O usá "Generar con IA" para autocompletar', 
        en: 'Or use "Generate with AI" to auto-complete',
        pt: 'Ou use "Gerar com IA" para autocompletar'
      } 
    },
  ],
  calendar_opened: [
    { 
      reaction: { 
        es: '¡Planificador! Arrastrá recetas a los días o usá la IA', 
        en: 'Planner! Drag recipes to days or use AI',
        pt: 'Planejador! Arraste receitas para os dias ou use IA'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'La IA optimiza para reutilizar ingredientes', 
        en: 'AI optimizes to reuse ingredients',
        pt: 'A IA otimiza para reutilizar ingredientes'
      } 
    },
  ],

  // Despensa
  tab_despensa: [
    { 
      reaction: { 
        es: '¡Tu despensa! 🏠 Guardá ingredientes que siempre tenés en casa', 
        en: 'Your pantry! 🏠 Save ingredients you always have at home',
        pt: 'Sua despensa! 🏠 Salve ingredientes que você sempre tem em casa'
      }, 
      mood: 'curious', 
      animation: 'bounce', 
      tip: { 
        es: 'Estos se usan automáticamente al generar recetas', 
        en: 'These are automatically used when generating recipes',
        pt: 'Estes são usados automaticamente ao gerar receitas'
      } 
    },
    { 
      reaction: { 
        es: '¡Ingredientes básicos! Agregá sal, aceite, especias, lo que nunca falta', 
        en: 'Basic ingredients! Add salt, oil, spices, what you always have',
        pt: 'Ingredientes básicos! Adicione sal, óleo, temperos, o que nunca falta'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Tocá + para agregar o usá el escáner', 
        en: 'Tap + to add or use the scanner',
        pt: 'Toque + para adicionar ou use o scanner'
      } 
    },
  ],
  pantry_opened: [
    { 
      reaction: { 
        es: '¡Tu despensa! Estos ingredientes se incluyen automáticamente', 
        en: 'Your pantry! These ingredients are included automatically',
        pt: 'Sua despensa! Estes ingredientes são incluídos automaticamente'
      }, 
      mood: 'curious', 
      animation: 'bounce', 
      tip: { 
        es: 'Mantené actualizada la lista', 
        en: 'Keep the list updated',
        pt: 'Mantenha a lista atualizada'
      } 
    },
  ],

  // Lista de compras
  tab_super: [
    { 
      reaction: { 
        es: '¡Lista de compras! 🛒 Agregá items con el + de arriba', 
        en: 'Shopping list! 🛒 Add items with the + above',
        pt: 'Lista de compras! 🛒 Adicione itens com o + acima'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Tocá un item para marcarlo como comprado', 
        en: 'Tap an item to mark it as purchased',
        pt: 'Toque um item para marcá-lo como comprado'
      } 
    },
    { 
      reaction: { 
        es: '¡Al super! Tu lista organizada por categorías', 
        en: 'To the market! Your list organized by categories',
        pt: 'Ao mercado! Sua lista organizada por categorias'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Los tachados van abajo automáticamente', 
        en: 'Crossed off items go to the bottom automatically',
        pt: 'Os riscados vão para baixo automaticamente'
      } 
    },
  ],
  shopping_list_opened: [
    { 
      reaction: { 
        es: '¡Tu lista! Marcá items cuando los compres ✓', 
        en: 'Your list! Mark items when you buy them ✓',
        pt: 'Sua lista! Marque itens quando comprar ✓'
      }, 
      mood: 'happy', 
      animation: 'nod' 
    },
  ],

  // Nutrición
  tab_nutrientes: [
    { 
      reaction: { 
        es: '¡Balance nutricional! 📊 Mirá proteínas, carbos y grasas de tu semana', 
        en: 'Nutritional balance! 📊 See proteins, carbs and fats of your week',
        pt: 'Balanço nutricional! 📊 Veja proteínas, carbos e gorduras da sua semana'
      }, 
      mood: 'proud', 
      animation: 'sparkle', 
      tip: { 
        es: 'Los datos vienen de las recetas que cocinaste', 
        en: 'Data comes from the recipes you cooked',
        pt: 'Os dados vêm das receitas que você cozinhou'
      } 
    },
    { 
      reaction: { 
        es: '¡Tu semana nutricional! Estadísticas de lo que comiste', 
        en: 'Your nutritional week! Statistics of what you ate',
        pt: 'Sua semana nutricional! Estatísticas do que você comeu'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Intentá mantener un balance colorido y variado', 
        en: 'Try to maintain a colorful and varied balance',
        pt: 'Tente manter um balanço colorido e variado'
      } 
    },
  ],

  // Timer
  tab_reloj: [
    { 
      reaction: { 
        es: '¡Timer de cocina! ⏱️ Configurá alarmas para cada preparación', 
        en: 'Kitchen timer! ⏱️ Set alarms for each preparation',
        pt: 'Timer de cozinha! ⏱️ Configure alarmes para cada preparação'
      }, 
      mood: 'excited', 
      animation: 'bounce', 
      tip: { 
        es: 'Podés tener varios timers activos a la vez', 
        en: 'You can have multiple timers active at once',
        pt: 'Você pode ter vários timers ativos ao mesmo tempo'
      } 
    },
    { 
      reaction: { 
        es: '¡Cronómetro chef! Nunca más pastas pasadas o carnes crudas', 
        en: 'Chef timer! No more overcooked pasta or raw meat',
        pt: 'Cronômetro chef! Nunca mais massas passadas ou carnes cruas'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Tocá + para agregar un timer nuevo', 
        en: 'Tap + to add a new timer',
        pt: 'Toque + para adicionar um novo timer'
      } 
    },
  ],

  // Guía de alimentos
  tab_guia: [
    { 
      reaction: { 
        es: '¡Guía de alimentos! 📖 Consultá valores nutricionales de cualquier ingrediente', 
        en: 'Food guide! 📖 Check nutritional values of any ingredient',
        pt: 'Guia de alimentos! 📖 Consulte valores nutricionais de qualquer ingrediente'
      }, 
      mood: 'curious', 
      animation: 'sparkle', 
      tip: { 
        es: 'Buscá por nombre o navegá por categoría', 
        en: 'Search by name or browse by category',
        pt: 'Busque por nome ou navegue por categoria'
      } 
    },
    { 
      reaction: { 
        es: '¡Enciclopedia nutricional! Info completa de proteínas, carbos, grasas y más', 
        en: 'Nutritional encyclopedia! Complete info on proteins, carbs, fats and more',
        pt: 'Enciclopédia nutricional! Info completa de proteínas, carbos, gorduras e mais'
      }, 
      mood: 'happy', 
      animation: 'nod', 
      tip: { 
        es: 'Tocá un alimento para ver todos los detalles', 
        en: 'Tap a food to see all details',
        pt: 'Toque um alimento para ver todos os detalhes'
      } 
    },
  ],

  // Búsqueda
  tab_buscar: [
    { 
      reaction: { 
        es: '¡Buscador! 🔍 Escribí el nombre de una receta o ingrediente', 
        en: 'Search! 🔍 Type the name of a recipe or ingredient',
        pt: 'Busca! 🔍 Digite o nome de uma receita ou ingrediente'
      }, 
      mood: 'curious', 
      animation: 'think', 
      tip: { 
        es: 'Probá buscar "milanesas" o "pollo al horno"', 
        en: 'Try searching "chicken" or "pasta"',
        pt: 'Tente buscar "frango" ou "macarrão"'
      } 
    },
    { 
      reaction: { 
        es: '¡A buscar! ¿Qué tenés ganas de cocinar hoy?', 
        en: 'Let\'s search! What do you feel like cooking today?',
        pt: 'Vamos buscar! O que você quer cozinhar hoje?'
      }, 
      mood: 'excited', 
      animation: 'sparkle', 
      tip: { 
        es: 'Los resultados muestran tiempo y dificultad', 
        en: 'Results show time and difficulty',
        pt: 'Os resultados mostram tempo e dificuldade'
      } 
    },
  ],
};

// Default reactions with translations
const defaultReactions: Record<Language, MarcelaReaction> = {
  es: { 
    reaction: '¡Qué lindo tenerte acá! ¿En qué te ayudo?', 
    mood: 'happy', 
    animation: 'wave' 
  },
  en: { 
    reaction: 'So nice to have you here! How can I help you?', 
    mood: 'happy', 
    animation: 'wave' 
  },
  pt: { 
    reaction: 'Que bom ter você aqui! Em que posso ajudar?', 
    mood: 'happy', 
    animation: 'wave' 
  }
};

// Get a random reaction for variety, translated
function getRandomReaction(action: string, language: Language): MarcelaReaction {
  const reactions = predefinedReactions[action];
  if (!reactions || reactions.length === 0) {
    return defaultReactions[language];
  }
  const randomIndex = Math.floor(Math.random() * reactions.length);
  const reaction = reactions[randomIndex];
  
  return {
    reaction: reaction.reaction[language],
    mood: reaction.mood,
    animation: reaction.animation,
    tip: reaction.tip ? reaction.tip[language] : undefined
  };
}

export function useMarcelaAI() {
  const [currentReaction, setCurrentReaction] = useState<MarcelaReaction | null>(null);
  const lastActionRef = useRef<string>('');
  const lastActionTimeRef = useRef<number>(0);

  // React function - now uses only predefined reactions (no AI calls)
  const react = useCallback((action: string) => {
    const now = Date.now();

    // Debounce same action
    const minInterval = action === 'ingredient_added' ? 500 : 1500;
    if (action === lastActionRef.current && (now - lastActionTimeRef.current) < minInterval) {
      return;
    }

    lastActionRef.current = action;
    lastActionTimeRef.current = now;

    // Get random predefined reaction (no AI call)
    const language = getCurrentLanguage();
    const reaction = getRandomReaction(action, language);
    setCurrentReaction(reaction);
  }, []);

  const reactInstant = useCallback((action: string) => {
    const language = getCurrentLanguage();
    const reaction = getRandomReaction(action, language);
    setCurrentReaction(reaction);
  }, []);

  const clearReaction = useCallback(() => {
    setCurrentReaction(null);
  }, []);

  return {
    currentReaction,
    isLoading: false, // Never loading since no AI calls
    react,
    reactInstant,
    clearReaction
  };
}