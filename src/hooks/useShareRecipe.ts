import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";

export function useShareRecipe() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);

  // Format recipe as plain text
  const formatRecipeAsText = (recipe: Recipe): string => {
    const lines: string[] = [];
    
    lines.push(`🍽️ ${recipe.name}`);
    lines.push(`⏱️ ${recipe.time} min | 👥 ${recipe.servings} porciones | 📊 ${recipe.difficulty}`);
    lines.push('');
    
    // Nutrition
    lines.push('📊 INFORMACIÓN NUTRICIONAL (por porción):');
    lines.push(`Calorías: ${recipe.nutrition.calories} kcal`);
    lines.push(`Proteínas: ${recipe.nutrition.protein}g`);
    lines.push(`Carbohidratos: ${recipe.nutrition.carbs}g`);
    lines.push(`Grasas: ${recipe.nutrition.fat}g`);
    lines.push(`Fibra: ${recipe.nutrition.fiber}g`);
    lines.push('');
    
    // Ingredients
    lines.push('🛒 INGREDIENTES:');
    recipe.ingredients.forEach(ing => lines.push(`• ${ing}`));
    lines.push('');
    
    // Steps
    lines.push('👨‍🍳 PREPARACIÓN:');
    recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push('');
    
    // Tip
    if (recipe.tip) {
      lines.push(`💡 TIP: ${recipe.tip}`);
      lines.push('');
    }
    
    // Variation
    if (recipe.variation) {
      lines.push(`🔄 VARIACIÓN: ${recipe.variation}`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('Generado con MiChef by MARCELACOCINA');
    
    return lines.join('\n');
  };

  // Robust clipboard copy fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Method 1: Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to next method
      }
    }

    // Method 2: execCommand fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) return true;
    } catch {
      // Fall through
    }

    return false;
  };

  const shareRecipe = async (recipe: Recipe) => {
    if (isSharing) return null;
    
    setIsSharing(true);
    
    try {
      const recipeText = formatRecipeAsText(recipe);
      const shareTitle = `Receta: ${recipe.name}`;
      
      // Try native share first (mobile/PWA)
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: recipeText,
          });
          
          toast({
            title: t("shareSuccess"),
            description: t("shareSuccessDesc"),
          });
          return recipeText;
        } catch (shareError: any) {
          // User cancelled - not an error
          if (shareError?.name === 'AbortError') {
            return recipeText;
          }
          // Fall through to clipboard for other errors
          console.log('Native share failed, falling back to clipboard');
        }
      }
      
      // Fallback to clipboard
      const copied = await copyToClipboard(recipeText);
      
      if (copied) {
        toast({
          title: t("linkCopied"),
          description: "La receta se copió al portapapeles.",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo compartir la receta.",
          variant: "destructive",
        });
      }
      
      return recipeText;
    } catch (error) {
      console.error("Error sharing recipe:", error);
      toast({
        title: t("error"),
        description: t("shareError"),
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  return { shareRecipe, isSharing };
}
