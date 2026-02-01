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

  // Robust clipboard copy that works in PWA/standalone mode
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

    // Method 2: execCommand fallback (works in more contexts)
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
      
      // Try native share first (mobile/PWA)
      // Check if we're in standalone mode or mobile
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      
      if (navigator.share && (isMobile || isStandalone)) {
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
          // User cancelled - not an error, still return URL
          if (shareError?.name === 'AbortError') {
            return shareUrl;
          }
          // Fall through to clipboard for other errors
          console.log('Native share failed, falling back to clipboard:', shareError);
        }
      }
      
      // Fallback to clipboard using robust method
      const copied = await copyToClipboard(shareUrl);
      
      if (copied) {
        toast({
          title: t("linkCopied"),
          description: t("linkCopiedDesc"),
        });
      } else {
        // Final fallback - show URL in toast for manual copy
        toast({
          title: t("linkCopied"),
          description: shareUrl,
          duration: 10000, // Longer duration so user can copy manually
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
