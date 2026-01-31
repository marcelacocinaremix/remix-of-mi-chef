import { z } from 'zod';
import { Recipe } from '@/components/RecipeList';

// Schema for validating recipe data structure
export const NutritionSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(1000),
});

export const RecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(200, "Name too long"),
  time: z.number().min(1, "Time must be at least 1 minute").max(1440, "Time cannot exceed 24 hours"),
  difficulty: z.string().min(1).max(50),
  servings: z.number().min(1, "At least 1 serving").max(100, "Too many servings"),
  ingredients: z.array(z.string().max(500, "Ingredient text too long")).min(1, "At least one ingredient required").max(100, "Too many ingredients"),
  steps: z.array(z.string().max(2000, "Step text too long")).min(1, "At least one step required").max(100, "Too many steps"),
  tip: z.string().max(1000, "Tip too long"),
  variation: z.string().max(1000, "Variation too long").optional(),
  nutrition: NutritionSchema,
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export type ValidatedRecipe = z.infer<typeof RecipeSchema>;

// Safe parse that returns null on failure, casts to Recipe type
export function validateRecipe(data: unknown): Recipe | null {
  try {
    const result = RecipeSchema.parse(data);
    return result as Recipe;
  } catch (error) {
    console.error('Recipe validation failed:', error);
    return null;
  }
}

// Validate with detailed error for debugging - returns Recipe type on success
export function validateRecipeWithErrors(data: unknown): { success: true; data: Recipe } | { success: false; error: z.ZodError } {
  const result = RecipeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as Recipe };
  }
  return { success: false, error: result.error };
}
