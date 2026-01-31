import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/components/RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import { validateRecipe } from "@/lib/recipeSchema";

export function useShareRecipe() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);

  const generateShareCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const shareRecipe = async (recipe: Recipe) => {
    if (isSharing) return null; // Prevent double clicks
    
    setIsSharing(true);
    
    try {
      // Validate recipe data before storing
      const validatedRecipe = validateRecipe(recipe);
      if (!validatedRecipe) {
        console.error('Recipe validation failed');
        toast({
          title: t("error"),
          description: "Los datos de la receta no son válidos.",
          variant: "destructive",
        });
        return null;
      }
      const shareCode = generateShareCode();
      
      // Get current user for ownership tracking (but don't expose identity)
      const { data: { user } } = await supabase.auth.getUser();

      // Share anonymously by default - no username exposure
      const { error } = await supabase.from("shared_recipes").insert([{
        share_code: shareCode,
        recipe_name: validatedRecipe.name.slice(0, 200),
        recipe_data: JSON.parse(JSON.stringify(validatedRecipe)), // Convert to plain JSON
        shared_by_name: null, // Anonymous sharing - no identity exposure
        user_id: user?.id || null,
      }]);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/r/${shareCode}`;
      const shareText = `¡Mirá esta receta de ${validatedRecipe.name}! 👨‍🍳`;
      
      // Try native share first (mobile)
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: validatedRecipe.name,
            text: shareText,
            url: shareUrl,
          });
          
          toast({
            title: t("shareSuccess"),
            description: t("shareSuccessDesc"),
          });
          return shareUrl;
        } catch (shareError: any) {
          // User cancelled - not an error
          if (shareError?.name === 'AbortError') {
            return shareUrl; // Still return URL, share was saved
          }
          // Fall through to clipboard
        }
      }
      
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t("linkCopied"),
          description: t("linkCopiedDesc"),
        });
      } catch {
        // Final fallback - show URL in toast
        toast({
          title: t("linkCopied"),
          description: shareUrl,
        });
      }
      
      return shareUrl;
    } catch (error: any) {
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
