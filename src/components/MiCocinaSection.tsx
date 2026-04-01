import { useState } from "react";
import { FavoriteRecipes } from "./FavoriteRecipes";
import SmartHistory from "./SmartHistory";
import { Heart } from "lucide-react";
import { Recipe } from "./RecipeList";
import { useLanguage } from "@/contexts/LanguageContext";
import miCocinaBanner from "@/assets/mi-cocina-banner.jpg";

interface MiCocinaSectionProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export const MiCocinaSection = ({
  onSelectRecipe,
}: MiCocinaSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Slim Banner */}
      <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-md">
        <img src={miCocinaBanner} alt="Mi Cocina" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
          <div className="px-4">
            <h3 className="text-white font-semibold text-base drop-shadow-lg">Mi Cocina</h3>
            <p className="text-white/80 text-xs font-light">Tus recetas guardadas</p>
          </div>
        </div>
      </div>

      {/* Content — solo favoritos */}
      <div className="animate-fade-in max-w-xl mx-auto">
        <FavoriteRecipes onSelectRecipe={onSelectRecipe} />
      </div>
    </div>
  );
};
