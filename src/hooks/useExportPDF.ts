import { jsPDF } from "jspdf";
import { Recipe } from "@/components/RecipeList";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useExportPDF() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportRecipeToPDF = async (recipe: Recipe) => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 7): number => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
      };

      // Helper to check and add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Title with warm color
      doc.setFillColor(234, 88, 12); // Orange
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(recipe.name, contentWidth);
      doc.text(titleLines, margin, 25);
      
      // Subtitle info
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`⏱ ${recipe.time} min  |  👥 ${recipe.servings} porciones  |  📊 ${recipe.difficulty}`, margin, 35);
      
      yPosition = 55;
      doc.setTextColor(0, 0, 0);

      // Nutrition section
      doc.setFillColor(255, 247, 237); // Light orange bg
      doc.roundedRect(margin, yPosition - 5, contentWidth, 35, 3, 3, "F");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text("🔥 Información Nutricional (por porción)", margin + 5, yPosition + 5);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const nutritionText = `Calorías: ${recipe.nutrition.calories} kcal  |  Proteínas: ${recipe.nutrition.protein}g  |  Carbohidratos: ${recipe.nutrition.carbs}g  |  Grasas: ${recipe.nutrition.fat}g  |  Fibra: ${recipe.nutrition.fiber}g`;
      yPosition = addWrappedText(nutritionText, margin + 5, yPosition + 18, contentWidth - 10, 6);
      yPosition += 15;

      // Ingredients section
      checkNewPage(50);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text("🛒 Ingredientes", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      
      recipe.ingredients.forEach((ingredient) => {
        checkNewPage(10);
        doc.text(`• ${ingredient}`, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 8;

      // Steps section
      checkNewPage(50);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text("👨‍🍳 Preparación", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      recipe.steps.forEach((step, index) => {
        checkNewPage(25);
        
        // Step number circle
        doc.setFillColor(234, 88, 12);
        doc.circle(margin + 4, yPosition - 2, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}`, margin + 2.5, yPosition);
        
        // Step text
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yPosition = addWrappedText(step, margin + 12, yPosition, contentWidth - 15, 5);
        yPosition += 5;
      });
      yPosition += 5;

      // Tip section
      if (recipe.tip) {
        checkNewPage(30);
        doc.setFillColor(254, 252, 232); // Light yellow
        doc.roundedRect(margin, yPosition - 5, contentWidth, 25, 3, 3, "F");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 130, 0);
        doc.text("💡 Tip de Marcela", margin + 5, yPosition + 5);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 80, 0);
        addWrappedText(recipe.tip, margin + 5, yPosition + 14, contentWidth - 10, 5);
        yPosition += 30;
      }

      // Variation section
      if (recipe.variation) {
        checkNewPage(30);
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, yPosition - 5, contentWidth, 25, 3, 3, "F");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("🔄 Variación opcional", margin + 5, yPosition + 5);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        addWrappedText(recipe.variation, margin + 5, yPosition + 14, contentWidth - 10, 5);
        yPosition += 30;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Generado con MiChef by MARCELACOCINA",
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = recipe.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").replace(/\s+/g, "_");
      doc.save(`${fileName}.pdf`);

      toast({
        title: "¡PDF exportado!",
        description: `${recipe.name} se descargó correctamente.`,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportRecipeToPDF, isExporting };
}
