import { Recipe } from "@/components/RecipeList";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useExportPDF() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Format recipe as plain text for .txt file
  const formatRecipeAsText = (recipe: Recipe): string => {
    const lines: string[] = [];
    
    lines.push('═'.repeat(50));
    lines.push(`🍽️ ${recipe.name.toUpperCase()}`);
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push(`⏱️ Tiempo: ${recipe.time} minutos`);
    lines.push(`👥 Porciones: ${recipe.servings}`);
    lines.push(`📊 Dificultad: ${recipe.difficulty}`);
    lines.push('');
    
    // Nutrition
    lines.push('─'.repeat(50));
    lines.push('📊 INFORMACIÓN NUTRICIONAL (por porción)');
    lines.push('─'.repeat(50));
    lines.push(`• Calorías: ${recipe.nutrition.calories} kcal`);
    lines.push(`• Proteínas: ${recipe.nutrition.protein}g`);
    lines.push(`• Carbohidratos: ${recipe.nutrition.carbs}g`);
    lines.push(`• Grasas: ${recipe.nutrition.fat}g`);
    lines.push(`• Fibra: ${recipe.nutrition.fiber}g`);
    lines.push('');
    
    // Ingredients
    lines.push('─'.repeat(50));
    lines.push('🛒 INGREDIENTES');
    lines.push('─'.repeat(50));
    recipe.ingredients.forEach(ing => lines.push(`• ${ing}`));
    lines.push('');
    
    // Steps
    lines.push('─'.repeat(50));
    lines.push('👨‍🍳 PREPARACIÓN');
    lines.push('─'.repeat(50));
    recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push('');
    
    // Tip
    if (recipe.tip) {
      lines.push('─'.repeat(50));
      lines.push('💡 TIP DE MARCELA');
      lines.push('─'.repeat(50));
      lines.push(recipe.tip);
      lines.push('');
    }
    
    // Variation
    if (recipe.variation) {
      lines.push('─'.repeat(50));
      lines.push('🔄 VARIACIÓN OPCIONAL');
      lines.push('─'.repeat(50));
      lines.push(recipe.variation);
      lines.push('');
    }
    
    // Tags
    if (recipe.tags && recipe.tags.length > 0) {
      lines.push('─'.repeat(50));
      lines.push(`🏷️ Tags: ${recipe.tags.join(', ')}`);
      lines.push('');
    }
    
    lines.push('═'.repeat(50));
    lines.push('Generado con MiChef by MARCELACOCINA');
    lines.push('═'.repeat(50));
    
    return lines.join('\n');
  };

  // Download text as .txt file - robust method for Android/PWA
  const downloadTextFile = async (content: string, filename: string): Promise<boolean> => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      
      // Method 1: Try native share with file (works great on Android)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'text/plain' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: filename,
            });
            return true;
          } catch (err: any) {
            if (err?.name === 'AbortError') return false;
            // Fall through to download method
          }
        }
      }

      // Method 2: Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after small delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  };

  const exportRecipeToPDF = async (recipe: Recipe) => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const content = formatRecipeAsText(recipe);
      const fileName = recipe.name
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "")
        .replace(/\s+/g, "_") + ".txt";
      
      const success = await downloadTextFile(content, fileName);
      
      if (success) {
        toast({
          title: "¡Receta exportada!",
          description: `${recipe.name} se guardó como archivo de texto.`,
        });
      }
    } catch (error) {
      console.error("Error exporting recipe:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar la receta. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportRecipeToPDF, isExporting };
}
