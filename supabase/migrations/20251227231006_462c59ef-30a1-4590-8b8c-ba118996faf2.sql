-- Create cached recipes table for instant fallback
CREATE TABLE public.cached_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_name TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  main_ingredients TEXT[] NOT NULL,
  meal_type TEXT,
  time_range TEXT, -- 'quick' (<=20), 'medium' (21-45), 'long' (>45)
  difficulty TEXT,
  tags TEXT[],
  language TEXT DEFAULT 'es',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast ingredient matching
CREATE INDEX idx_cached_recipes_ingredients ON public.cached_recipes USING GIN(main_ingredients);
CREATE INDEX idx_cached_recipes_meal_type ON public.cached_recipes(meal_type);
CREATE INDEX idx_cached_recipes_time_range ON public.cached_recipes(time_range);
CREATE INDEX idx_cached_recipes_language ON public.cached_recipes(language);

-- Enable RLS (public read for cached recipes)
ALTER TABLE public.cached_recipes ENABLE ROW LEVEL SECURITY;

-- Everyone can read cached recipes
CREATE POLICY "Anyone can read cached recipes"
ON public.cached_recipes
FOR SELECT
USING (true);

-- Insert some initial cached recipes for instant fallback
INSERT INTO public.cached_recipes (recipe_name, recipe_data, main_ingredients, meal_type, time_range, difficulty, tags, language)
VALUES 
(
  'Milanesas de Pollo',
  '{"name": "Milanesas de Pollo", "time": 30, "difficulty": "fácil", "servings": 4, "ingredients": ["4 pechugas de pollo", "2 huevos", "Pan rallado cantidad necesaria", "Sal y pimienta a gusto", "Aceite para freír"], "steps": ["Aplastá las pechugas con un mazo para que queden finitas.", "Batí los huevos con sal y pimienta.", "Pasá cada pechuga por el huevo y luego por el pan rallado.", "Freí en aceite caliente hasta dorar de ambos lados.", "Escurrí sobre papel absorbente."], "tip": "Para que queden más crocantes, dejá el pan rallado reposar 5 minutos antes de freír.", "nutrition": {"calories": 320, "protein": 35, "carbs": 15, "fat": 14, "fiber": 1}, "tags": ["almuerzo", "cena", "clásico"]}',
  ARRAY['pollo', 'huevo', 'pan rallado'],
  'almuerzo',
  'medium',
  'fácil',
  ARRAY['clásico', 'argentino', 'frito'],
  'es'
),
(
  'Tortilla de Papas',
  '{"name": "Tortilla de Papas", "time": 35, "difficulty": "fácil", "servings": 4, "ingredients": ["4 papas medianas", "6 huevos", "1 cebolla", "Sal a gusto", "Aceite de oliva"], "steps": ["Pelá y cortá las papas en rodajas finas.", "Fritá las papas con la cebolla en aceite hasta que estén tiernas.", "Batí los huevos con sal.", "Mezclá las papas con el huevo batido.", "Cociná en sartén dando vuelta para dorar ambos lados."], "tip": "El secreto está en cocinar a fuego bajo para que quede jugosa por dentro.", "nutrition": {"calories": 280, "protein": 12, "carbs": 25, "fat": 16, "fiber": 3}, "tags": ["almuerzo", "cena", "vegetariano"]}',
  ARRAY['papa', 'huevo', 'cebolla'],
  'almuerzo',
  'medium',
  'fácil',
  ARRAY['español', 'vegetariano', 'clásico'],
  'es'
),
(
  'Arroz con Pollo',
  '{"name": "Arroz con Pollo", "time": 45, "difficulty": "fácil", "servings": 4, "ingredients": ["2 tazas de arroz", "500g de pollo trozado", "1 cebolla", "1 morrón", "2 tomates", "Caldo de pollo", "Sal, pimienta, pimentón"], "steps": ["Dorá el pollo en una olla grande.", "Agregá la cebolla y el morrón picados.", "Incorporá los tomates y el arroz.", "Añadí el caldo caliente y condimentos.", "Cociná tapado 20 minutos a fuego bajo."], "tip": "No revuelvas el arroz una vez que agregaste el caldo.", "nutrition": {"calories": 380, "protein": 28, "carbs": 45, "fat": 10, "fiber": 2}, "tags": ["almuerzo", "cena", "completo"]}',
  ARRAY['arroz', 'pollo', 'cebolla', 'morrón'],
  'almuerzo',
  'medium',
  'fácil',
  ARRAY['completo', 'económico', 'familiar'],
  'es'
),
(
  'Tostadas con Huevo Revuelto',
  '{"name": "Tostadas con Huevo Revuelto", "time": 10, "difficulty": "fácil", "servings": 2, "ingredients": ["4 huevos", "4 rebanadas de pan", "Manteca", "Sal y pimienta", "Queso rallado opcional"], "steps": ["Tostar el pan.", "Batí los huevos con sal y pimienta.", "Derretí manteca en sartén a fuego bajo.", "Agregá los huevos y revolvé suavemente hasta que cuajen.", "Serví sobre las tostadas."], "tip": "Retiralos del fuego cuando aún estén un poco cremosos, terminan de cocinarse solos.", "nutrition": {"calories": 280, "protein": 16, "carbs": 22, "fat": 14, "fiber": 1}, "tags": ["desayuno", "rápido"]}',
  ARRAY['huevo', 'pan'],
  'desayuno',
  'quick',
  'fácil',
  ARRAY['rápido', 'simple', 'desayuno'],
  'es'
),
(
  'Fideos con Manteca y Queso',
  '{"name": "Fideos con Manteca y Queso", "time": 15, "difficulty": "fácil", "servings": 2, "ingredients": ["250g de fideos", "50g de manteca", "100g de queso rallado", "Sal y pimienta", "Perejil picado"], "steps": ["Cociná los fideos según el paquete.", "Escurrí reservando un poco del agua de cocción.", "Mezclá con la manteca derretida.", "Agregá el queso rallado y mezclá bien.", "Si queda seco, agregá un poco del agua reservada."], "tip": "El agua de cocción ayuda a que el queso se integre mejor.", "nutrition": {"calories": 420, "protein": 15, "carbs": 48, "fat": 20, "fiber": 2}, "tags": ["almuerzo", "cena", "rápido"]}',
  ARRAY['fideos', 'queso', 'manteca'],
  'almuerzo',
  'quick',
  'fácil',
  ARRAY['pasta', 'simple', 'rápido'],
  'es'
),
(
  'Ensalada César',
  '{"name": "Ensalada César", "time": 15, "difficulty": "fácil", "servings": 2, "ingredients": ["1 lechuga romana", "100g de pollo grillado", "Crutones", "Queso parmesano", "Aderezo césar"], "steps": ["Lavá y cortá la lechuga.", "Cortá el pollo en tiras.", "Armá la ensalada con lechuga, pollo y crutones.", "Agregá el queso rallado.", "Condimentá con el aderezo."], "tip": "Para crutones caseros, cortá pan en cubos y tostalos con ajo y aceite.", "nutrition": {"calories": 320, "protein": 25, "carbs": 18, "fat": 18, "fiber": 4}, "tags": ["almuerzo", "liviano", "ensalada"]}',
  ARRAY['lechuga', 'pollo', 'queso'],
  'almuerzo',
  'quick',
  'fácil',
  ARRAY['ensalada', 'liviano', 'saludable'],
  'es'
),
(
  'Omelette de Jamón y Queso',
  '{"name": "Omelette de Jamón y Queso", "time": 10, "difficulty": "fácil", "servings": 1, "ingredients": ["3 huevos", "2 fetas de jamón", "50g de queso", "Manteca", "Sal y pimienta"], "steps": ["Batí los huevos con sal y pimienta.", "Derretí manteca en sartén.", "Vertí los huevos y dejá que cuajen.", "Agregá jamón y queso de un lado.", "Doblá y serví."], "tip": "No lo cocines de más, tiene que quedar jugoso por dentro.", "nutrition": {"calories": 350, "protein": 26, "carbs": 2, "fat": 26, "fiber": 0}, "tags": ["desayuno", "rápido", "proteico"]}',
  ARRAY['huevo', 'jamón', 'queso'],
  'desayuno',
  'quick',
  'fácil',
  ARRAY['rápido', 'proteico', 'simple'],
  'es'
),
(
  'Sándwich de Milanesa',
  '{"name": "Sándwich de Milanesa", "time": 25, "difficulty": "fácil", "servings": 2, "ingredients": ["2 milanesas de carne", "2 panes", "Lechuga", "Tomate", "Mayonesa"], "steps": ["Freí o horneá las milanesas.", "Cortá los panes por la mitad.", "Untá con mayonesa.", "Armá con lechuga, tomate y milanesa.", "Serví caliente."], "tip": "Agregá un huevo frito arriba de la milanesa para hacerlo más completo.", "nutrition": {"calories": 580, "protein": 35, "carbs": 42, "fat": 28, "fiber": 3}, "tags": ["almuerzo", "cena", "argentino"]}',
  ARRAY['carne', 'pan', 'lechuga', 'tomate'],
  'almuerzo',
  'medium',
  'fácil',
  ARRAY['argentino', 'sándwich', 'clásico'],
  'es'
),
(
  'Puré de Papas',
  '{"name": "Puré de Papas", "time": 25, "difficulty": "fácil", "servings": 4, "ingredients": ["1kg de papas", "100ml de leche", "50g de manteca", "Sal y nuez moscada"], "steps": ["Pelá y cortá las papas.", "Herví hasta que estén tiernas.", "Escurrí y pisá bien.", "Agregá leche caliente y manteca.", "Condimentá con sal y nuez moscada."], "tip": "La leche tiene que estar caliente para que el puré quede cremoso.", "nutrition": {"calories": 180, "protein": 4, "carbs": 28, "fat": 7, "fiber": 3}, "tags": ["guarnición", "clásico"]}',
  ARRAY['papa', 'leche', 'manteca'],
  'almuerzo',
  'medium',
  'fácil',
  ARRAY['guarnición', 'clásico', 'simple'],
  'es'
),
(
  'Licuado de Banana',
  '{"name": "Licuado de Banana", "time": 5, "difficulty": "fácil", "servings": 1, "ingredients": ["2 bananas", "200ml de leche", "1 cucharada de miel", "Hielo opcional"], "steps": ["Pelá las bananas.", "Poné todo en la licuadora.", "Licuá hasta que quede homogéneo.", "Servilo frío."], "tip": "Congelá las bananas antes para un licuado más cremoso.", "nutrition": {"calories": 220, "protein": 6, "carbs": 45, "fat": 3, "fiber": 4}, "tags": ["desayuno", "merienda", "rápido"]}',
  ARRAY['banana', 'leche'],
  'desayuno',
  'quick',
  'fácil',
  ARRAY['bebida', 'saludable', 'rápido'],
  'es'
);