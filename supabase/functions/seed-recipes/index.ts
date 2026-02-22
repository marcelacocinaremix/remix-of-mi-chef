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
  // === NUEVAS COMBINACIONES BATCH 2 ===
  // Pollo variaciones extras
  { ingredients: ["pollo", "cebolla", "ajo"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "tomate", "morron"], time: 35, mealType: "almuerzo" },
  { ingredients: ["pollo", "espinaca"], time: 25, mealType: "cena" },
  { ingredients: ["pollo", "zanahoria"], time: 30, mealType: "almuerzo" },
  { ingredients: ["pollo", "papa", "morron"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "arroz", "morron"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "cebolla", "papa"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "queso", "crema"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "fideos", "crema"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "arroz", "cebolla"], time: 35, mealType: "almuerzo" },
  // Carne variaciones extras
  { ingredients: ["carne", "fideos"], time: 35, mealType: "almuerzo" },
  { ingredients: ["carne", "papa", "cebolla"], time: 45, mealType: "almuerzo" },
  { ingredients: ["carne", "arroz", "cebolla"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne", "zapallo"], time: 45, mealType: "almuerzo" },
  { ingredients: ["carne", "batata"], time: 45, mealType: "almuerzo" },
  { ingredients: ["carne molida", "papa", "cebolla"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne molida", "tomate"], time: 25, mealType: "almuerzo" },
  { ingredients: ["carne molida", "berenjena"], time: 35, mealType: "cena" },
  { ingredients: ["carne molida", "zapallito"], time: 35, mealType: "cena" },
  { ingredients: ["carne molida", "papa", "queso"], time: 45, mealType: "almuerzo" },
  // Cerdo extras
  { ingredients: ["cerdo", "cebolla", "morron"], time: 40, mealType: "almuerzo" },
  { ingredients: ["cerdo", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["cerdo", "verduras"], time: 45, mealType: "cena" },
  { ingredients: ["bondiola", "batata"], time: 50, mealType: "almuerzo" },
  // Pescado extras
  { ingredients: ["merluza", "verduras"], time: 25, mealType: "cena" },
  { ingredients: ["merluza", "arroz"], time: 30, mealType: "cena" },
  { ingredients: ["atun", "papa"], time: 20, mealType: "almuerzo" },
  { ingredients: ["atun", "huevo"], time: 15, mealType: "almuerzo" },
  { ingredients: ["atun", "tomate"], time: 10, mealType: "almuerzo" },
  { ingredients: ["salmon", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["salmon", "arroz"], time: 30, mealType: "cena" },
  // Huevos extras
  { ingredients: ["huevo", "morron"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "zanahoria"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "zapallito"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "arroz"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "fideos"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "pan"], time: 10, mealType: "desayuno" },
  { ingredients: ["huevo", "tomate", "queso"], time: 15, mealType: "desayuno" },
  { ingredients: ["huevo", "papa", "queso"], time: 25, mealType: "cena" },
  // Vegetarianas extras
  { ingredients: ["papa", "zanahoria"], time: 30, mealType: "cena" },
  { ingredients: ["papa", "morron"], time: 25, mealType: "cena" },
  { ingredients: ["papa", "espinaca"], time: 25, mealType: "cena" },
  { ingredients: ["zapallo", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["zapallo", "arroz"], time: 35, mealType: "cena" },
  { ingredients: ["zapallito", "queso"], time: 25, mealType: "cena" },
  { ingredients: ["zapallito", "huevo"], time: 20, mealType: "cena" },
  { ingredients: ["berenjena", "tomate"], time: 30, mealType: "cena" },
  { ingredients: ["berenjena", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["espinaca", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["espinaca", "huevo", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["brócoli", "arroz"], time: 25, mealType: "cena" },
  { ingredients: ["brócoli", "huevo"], time: 20, mealType: "cena" },
  { ingredients: ["choclo", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["zanahoria", "papa", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["tomate", "cebolla", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["lentejas", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["lentejas", "cebolla"], time: 40, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "tomate"], time: 35, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "espinaca"], time: 35, mealType: "almuerzo" },
  // Pastas extras
  { ingredients: ["fideos", "carne molida", "tomate"], time: 30, mealType: "almuerzo" },
  { ingredients: ["fideos", "pollo", "tomate"], time: 30, mealType: "almuerzo" },
  { ingredients: ["fideos", "atun", "tomate"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "huevo", "queso"], time: 15, mealType: "cena" },
  { ingredients: ["fideos", "espinaca", "crema"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "brócoli", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "champignones", "crema"], time: 20, mealType: "cena" },
  // Arroz extras
  { ingredients: ["arroz", "carne", "verduras"], time: 40, mealType: "almuerzo" },
  { ingredients: ["arroz", "huevo", "cebolla"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "pollo", "cebolla"], time: 35, mealType: "almuerzo" },
  { ingredients: ["arroz", "carne molida"], time: 30, mealType: "almuerzo" },
  { ingredients: ["arroz", "zapallo"], time: 30, mealType: "cena" },
  { ingredients: ["arroz", "lentejas"], time: 35, mealType: "almuerzo" },
  // Tartas y empanadas extras
  { ingredients: ["tapas de empanada", "atun"], time: 30, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "choclo"], time: 30, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "carne molida", "cebolla"], time: 40, mealType: "almuerzo" },
  { ingredients: ["tapa pascualina", "choclo", "queso"], time: 40, mealType: "cena" },
  { ingredients: ["tapa pascualina", "pollo", "verdura"], time: 45, mealType: "almuerzo" },
  // Desayunos/Meriendas extras
  { ingredients: ["avena", "banana"], time: 10, mealType: "desayuno" },
  { ingredients: ["avena", "leche"], time: 10, mealType: "desayuno" },
  { ingredients: ["banana", "leche"], time: 5, mealType: "desayuno" },
  { ingredients: ["banana", "avena", "chocolate"], time: 15, mealType: "merienda" },
  { ingredients: ["harina", "dulce de leche"], time: 30, mealType: "merienda" },
  { ingredients: ["harina", "huevo", "azucar"], time: 30, mealType: "merienda" },
  { ingredients: ["yogur", "fruta"], time: 5, mealType: "desayuno" },
  { ingredients: ["pan", "palta"], time: 5, mealType: "desayuno" },
  { ingredients: ["pan", "huevo"], time: 10, mealType: "desayuno" },
  { ingredients: ["pan", "queso"], time: 5, mealType: "merienda" },
  // Sandwiches extras
  { ingredients: ["pan", "pollo", "lechuga"], time: 15, mealType: "almuerzo" },
  { ingredients: ["pan", "milanesa"], time: 10, mealType: "almuerzo" },
  { ingredients: ["pan", "carne"], time: 15, mealType: "almuerzo" },
  { ingredients: ["tortilla", "carne", "cebolla"], time: 15, mealType: "almuerzo" },
  { ingredients: ["tortilla", "huevo", "queso"], time: 10, mealType: "desayuno" },
  // Ensaladas extras
  { ingredients: ["lechuga", "huevo", "tomate"], time: 10, mealType: "cena" },
  { ingredients: ["lechuga", "atun", "tomate"], time: 10, mealType: "almuerzo" },
  { ingredients: ["tomate", "palta"], time: 5, mealType: "cena" },
  { ingredients: ["quinoa", "pollo"], time: 30, mealType: "almuerzo" },
  { ingredients: ["quinoa", "verduras", "huevo"], time: 25, mealType: "almuerzo" },
  // Sopas extras
  { ingredients: ["cebolla", "papa", "zanahoria", "pollo"], time: 45, mealType: "cena" },
  { ingredients: ["zapallo", "zanahoria"], time: 30, mealType: "cena" },
  { ingredients: ["zapallo", "leche"], time: 25, mealType: "cena" },
  { ingredients: ["tomate", "cebolla"], time: 20, mealType: "cena" },
  // Pizza extras
  { ingredients: ["harina", "queso", "jamon"], time: 40, mealType: "cena" },
  { ingredients: ["harina", "queso", "cebolla"], time: 40, mealType: "cena" },
  // Dulces extras
  { ingredients: ["chocolate", "banana"], time: 15, mealType: "merienda" },
  { ingredients: ["dulce de leche", "banana"], time: 10, mealType: "merienda" },
  { ingredients: ["manzana", "avena"], time: 20, mealType: "merienda" },
  { ingredients: ["harina", "leche", "azucar"], time: 25, mealType: "merienda" },
  // Guarniciones
  { ingredients: ["papa", "manteca"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "manteca"], time: 20, mealType: "cena" },
  { ingredients: ["batata", "queso"], time: 25, mealType: "cena" },
  { ingredients: ["choclo", "manteca"], time: 15, mealType: "cena" },
  // Wraps y burritos
  { ingredients: ["tortilla", "carne molida", "queso"], time: 20, mealType: "almuerzo" },
  { ingredients: ["tortilla", "pollo", "palta"], time: 15, mealType: "almuerzo" },
  { ingredients: ["tortilla", "verduras", "queso"], time: 15, mealType: "cena" },
  // === BATCH 3 - MÁS COMBINACIONES ===
  // Pollo con legumbres y granos
  { ingredients: ["pollo", "lentejas"], time: 45, mealType: "almuerzo" },
  { ingredients: ["pollo", "garbanzos"], time: 45, mealType: "almuerzo" },
  { ingredients: ["pollo", "quinoa"], time: 35, mealType: "almuerzo" },
  { ingredients: ["pollo", "cebolla", "tomate"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "morron", "papa"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "zapallito"], time: 30, mealType: "cena" },
  { ingredients: ["pollo", "berenjena"], time: 35, mealType: "cena" },
  { ingredients: ["pollo", "choclo", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["pollo", "tomate", "arroz"], time: 35, mealType: "almuerzo" },
  { ingredients: ["pollo", "papa", "cebolla", "morron"], time: 45, mealType: "almuerzo" },
  // Carne con más variaciones
  { ingredients: ["carne", "choclo"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne", "zanahoria"], time: 40, mealType: "almuerzo" },
  { ingredients: ["carne", "verduras", "papa"], time: 50, mealType: "almuerzo" },
  { ingredients: ["carne", "tomate"], time: 35, mealType: "almuerzo" },
  { ingredients: ["carne", "queso"], time: 30, mealType: "cena" },
  { ingredients: ["carne molida", "morron"], time: 25, mealType: "almuerzo" },
  { ingredients: ["carne molida", "choclo"], time: 30, mealType: "almuerzo" },
  { ingredients: ["carne molida", "espinaca"], time: 30, mealType: "cena" },
  { ingredients: ["carne molida", "huevo"], time: 25, mealType: "almuerzo" },
  { ingredients: ["carne molida", "fideos", "tomate"], time: 30, mealType: "almuerzo" },
  // Cerdo más variaciones
  { ingredients: ["cerdo", "papa", "cebolla"], time: 50, mealType: "almuerzo" },
  { ingredients: ["cerdo", "morron"], time: 35, mealType: "almuerzo" },
  { ingredients: ["cerdo", "tomate"], time: 35, mealType: "cena" },
  { ingredients: ["cerdo", "choclo"], time: 40, mealType: "almuerzo" },
  { ingredients: ["bondiola", "cebolla"], time: 50, mealType: "almuerzo" },
  { ingredients: ["bondiola", "verduras"], time: 55, mealType: "almuerzo" },
  // Pescado más variaciones
  { ingredients: ["merluza", "limon"], time: 25, mealType: "cena" },
  { ingredients: ["merluza", "tomate"], time: 30, mealType: "cena" },
  { ingredients: ["merluza", "papa", "cebolla"], time: 35, mealType: "cena" },
  { ingredients: ["salmon", "limon"], time: 25, mealType: "cena" },
  { ingredients: ["salmon", "espinaca"], time: 30, mealType: "cena" },
  { ingredients: ["salmon", "brócoli"], time: 30, mealType: "cena" },
  { ingredients: ["atun", "lechuga"], time: 10, mealType: "almuerzo" },
  { ingredients: ["atun", "cebolla"], time: 10, mealType: "almuerzo" },
  { ingredients: ["atun", "morron"], time: 15, mealType: "almuerzo" },
  // Más huevos
  { ingredients: ["huevo", "cebolla", "papa"], time: 25, mealType: "cena" },
  { ingredients: ["huevo", "espinaca", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["huevo", "jamon"], time: 10, mealType: "desayuno" },
  { ingredients: ["huevo", "palta"], time: 10, mealType: "desayuno" },
  { ingredients: ["huevo", "champignones"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "choclo"], time: 15, mealType: "cena" },
  { ingredients: ["huevo", "atun"], time: 15, mealType: "almuerzo" },
  // Más legumbres
  { ingredients: ["lentejas", "zanahoria"], time: 40, mealType: "almuerzo" },
  { ingredients: ["lentejas", "papa", "cebolla"], time: 45, mealType: "almuerzo" },
  { ingredients: ["lentejas", "arroz", "cebolla"], time: 45, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "papa"], time: 40, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "cebolla"], time: 35, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "zanahoria"], time: 40, mealType: "almuerzo" },
  { ingredients: ["garbanzos", "arroz"], time: 40, mealType: "almuerzo" },
  { ingredients: ["porotos", "verduras"], time: 50, mealType: "almuerzo" },
  { ingredients: ["porotos", "papa"], time: 45, mealType: "almuerzo" },
  { ingredients: ["porotos", "arroz"], time: 45, mealType: "almuerzo" },
  // Más vegetarianas
  { ingredients: ["calabaza", "arroz"], time: 35, mealType: "cena" },
  { ingredients: ["calabaza", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["calabaza", "zanahoria"], time: 35, mealType: "cena" },
  { ingredients: ["calabaza", "leche"], time: 30, mealType: "cena" },
  { ingredients: ["zapallito", "cebolla"], time: 20, mealType: "cena" },
  { ingredients: ["zapallito", "tomate"], time: 25, mealType: "cena" },
  { ingredients: ["zapallito", "arroz"], time: 30, mealType: "cena" },
  { ingredients: ["berenjena", "morron"], time: 30, mealType: "cena" },
  { ingredients: ["berenjena", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["brócoli", "papa"], time: 25, mealType: "cena" },
  { ingredients: ["brócoli", "zanahoria"], time: 25, mealType: "cena" },
  { ingredients: ["espinaca", "papa"], time: 25, mealType: "cena" },
  { ingredients: ["espinaca", "arroz"], time: 25, mealType: "cena" },
  { ingredients: ["espinaca", "fideos"], time: 20, mealType: "cena" },
  { ingredients: ["choclo", "cebolla"], time: 20, mealType: "cena" },
  { ingredients: ["choclo", "arroz"], time: 25, mealType: "cena" },
  // Más pastas
  { ingredients: ["fideos", "cebolla", "tomate"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "morron", "cebolla"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "zapallito", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["fideos", "pesto"], time: 15, mealType: "cena" },
  { ingredients: ["fideos", "ricota"], time: 15, mealType: "cena" },
  { ingredients: ["fideos", "salchicha"], time: 20, mealType: "cena" },
  { ingredients: ["ñoquis", "queso"], time: 25, mealType: "almuerzo" },
  { ingredients: ["ñoquis", "crema"], time: 25, mealType: "almuerzo" },
  { ingredients: ["ñoquis", "carne molida"], time: 30, mealType: "almuerzo" },
  { ingredients: ["ravioles", "crema"], time: 20, mealType: "almuerzo" },
  { ingredients: ["ravioles", "tomate"], time: 20, mealType: "almuerzo" },
  // Más arroz
  { ingredients: ["arroz", "queso"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "tomate"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "morron"], time: 25, mealType: "cena" },
  { ingredients: ["arroz", "choclo"], time: 25, mealType: "cena" },
  { ingredients: ["arroz", "espinaca"], time: 20, mealType: "cena" },
  { ingredients: ["arroz", "zanahoria"], time: 25, mealType: "cena" },
  { ingredients: ["arroz", "cerdo"], time: 40, mealType: "almuerzo" },
  // Más empanadas/tartas
  { ingredients: ["tapas de empanada", "espinaca", "queso"], time: 35, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "carne molida", "huevo"], time: 40, mealType: "almuerzo" },
  { ingredients: ["tapas de empanada", "zapallito", "queso"], time: 35, mealType: "cena" },
  { ingredients: ["tapas de empanada", "pollo", "morron"], time: 40, mealType: "almuerzo" },
  { ingredients: ["tapa pascualina", "atun", "tomate"], time: 40, mealType: "cena" },
  { ingredients: ["tapa pascualina", "verduras"], time: 40, mealType: "cena" },
  // Más desayunos
  { ingredients: ["avena", "miel"], time: 10, mealType: "desayuno" },
  { ingredients: ["avena", "yogur"], time: 5, mealType: "desayuno" },
  { ingredients: ["avena", "frutos secos"], time: 10, mealType: "desayuno" },
  { ingredients: ["banana", "chocolate"], time: 10, mealType: "merienda" },
  { ingredients: ["banana", "dulce de leche"], time: 10, mealType: "merienda" },
  { ingredients: ["tostadas", "palta"], time: 5, mealType: "desayuno" },
  { ingredients: ["tostadas", "huevo"], time: 10, mealType: "desayuno" },
  { ingredients: ["tostadas", "queso", "jamon"], time: 5, mealType: "desayuno" },
  { ingredients: ["yogur", "banana"], time: 5, mealType: "desayuno" },
  { ingredients: ["yogur", "granola"], time: 5, mealType: "desayuno" },
  // Más dulces
  { ingredients: ["harina", "coco"], time: 30, mealType: "merienda" },
  { ingredients: ["harina", "naranja"], time: 35, mealType: "merienda" },
  { ingredients: ["harina", "limon", "azucar"], time: 30, mealType: "merienda" },
  { ingredients: ["chocolate", "crema"], time: 20, mealType: "merienda" },
  { ingredients: ["chocolate", "huevo", "manteca"], time: 30, mealType: "merienda" },
  { ingredients: ["dulce de leche", "galletas"], time: 15, mealType: "merienda" },
  { ingredients: ["frutilla", "crema"], time: 15, mealType: "merienda" },
  { ingredients: ["manzana", "canela"], time: 20, mealType: "merienda" },
  // Más sopas/cremas
  { ingredients: ["papa", "puerro"], time: 35, mealType: "cena" },
  { ingredients: ["papa", "leche"], time: 25, mealType: "cena" },
  { ingredients: ["zanahoria", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["zanahoria", "papa"], time: 30, mealType: "cena" },
  { ingredients: ["tomate", "albahaca"], time: 25, mealType: "cena" },
  { ingredients: ["cebolla", "queso"], time: 25, mealType: "cena" },
  // Más ensaladas
  { ingredients: ["lechuga", "zanahoria", "tomate"], time: 10, mealType: "cena" },
  { ingredients: ["lechuga", "palta", "tomate"], time: 10, mealType: "cena" },
  { ingredients: ["rúcula", "parmesano"], time: 10, mealType: "cena" },
  { ingredients: ["remolacha", "huevo"], time: 15, mealType: "cena" },
  { ingredients: ["remolacha", "zanahoria"], time: 10, mealType: "cena" },
  { ingredients: ["pepino", "tomate"], time: 5, mealType: "cena" },
  { ingredients: ["repollo", "zanahoria"], time: 10, mealType: "cena" },
  // Guisos completos
  { ingredients: ["carne", "papa", "zanahoria", "cebolla"], time: 60, mealType: "almuerzo" },
  { ingredients: ["pollo", "arroz", "verduras", "morron"], time: 45, mealType: "almuerzo" },
  { ingredients: ["lentejas", "chorizo", "papa"], time: 50, mealType: "almuerzo" },
  { ingredients: ["mondongo", "papa", "zanahoria"], time: 60, mealType: "almuerzo" },
  { ingredients: ["porotos", "chorizo", "papa"], time: 55, mealType: "almuerzo" },
  // Milanesas variaciones
  { ingredients: ["milanesa", "tomate", "queso"], time: 25, mealType: "almuerzo" },
  { ingredients: ["milanesa", "arroz"], time: 25, mealType: "almuerzo" },
  { ingredients: ["milanesa", "fideos"], time: 25, mealType: "almuerzo" },
  { ingredients: ["milanesa", "verduras"], time: 20, mealType: "cena" },
  // Más rápidas
  { ingredients: ["salchicha", "papa"], time: 20, mealType: "cena" },
  { ingredients: ["salchicha", "arroz"], time: 20, mealType: "cena" },
  { ingredients: ["salchicha", "cebolla"], time: 15, mealType: "cena" },
  { ingredients: ["hamburguesa", "pan"], time: 15, mealType: "cena" },
  { ingredients: ["hamburguesa", "papa"], time: 25, mealType: "cena" },
  // Más combos con queso
  { ingredients: ["queso", "papa", "cebolla"], time: 30, mealType: "cena" },
  { ingredients: ["queso", "fideos", "tomate"], time: 20, mealType: "cena" },
  { ingredients: ["queso", "arroz", "verduras"], time: 25, mealType: "cena" },
  { ingredients: ["mozzarella", "tomate", "albahaca"], time: 15, mealType: "cena" },
  // Más wraps/tortillas
  { ingredients: ["tortilla", "jamon", "queso"], time: 10, mealType: "almuerzo" },
  { ingredients: ["tortilla", "atun"], time: 10, mealType: "almuerzo" },
  { ingredients: ["tortilla", "huevo", "jamon"], time: 10, mealType: "desayuno" },
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
