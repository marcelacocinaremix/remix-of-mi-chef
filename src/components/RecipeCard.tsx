import { Clock, ShoppingBag, ChefHat, Lightbulb, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Recipe {
  name: string;
  time: number;
  ingredients: string[];
  steps: string[];
  tip: string;
  variation?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="animate-slide-up">
      <div
        className={cn(
          "bg-card rounded-2xl overflow-hidden",
          "shadow-elevated border border-border/50"
        )}
      >
        {/* Header */}
        <div className="gradient-warm p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <span className="text-2xl">🍽️</span>
            <span className="text-sm font-medium uppercase tracking-wide">
              Tu receta de hoy
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-2 mt-3 opacity-90">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Tiempo estimado: {recipe.time} minutos
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ingredients */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Ingredientes
              </h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-foreground/90"
                >
                  <span className="w-2 h-2 rounded-full bg-sage" />
                  <span className="capitalize">{ingredient}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Preparación paso a paso
              </h3>
            </div>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full",
                      "bg-primary/10 text-primary",
                      "flex items-center justify-center",
                      "text-sm font-bold font-display"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-foreground/90 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Tip */}
          <section
            className={cn(
              "p-4 rounded-xl",
              "bg-amber-light/20 border border-amber/30"
            )}
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-foreground mb-1">
                  💡 Tip de Marcela
                </h4>
                <p className="text-foreground/80 text-sm">{recipe.tip}</p>
              </div>
            </div>
          </section>

          {/* Variation */}
          {recipe.variation && (
            <section
              className={cn(
                "p-4 rounded-xl",
                "bg-secondary border border-sage/30"
              )}
            >
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-1">
                    🔄 Variación opcional
                  </h4>
                  <p className="text-foreground/80 text-sm">{recipe.variation}</p>
                </div>
              </div>
            </section>
          )}

          {/* Footer message */}
          <div className="pt-4 border-t border-border text-center">
          <p className="text-muted-foreground italic text-sm">
            "Espero que disfrutes esta receta. En{" "}
            <span className="text-primary font-medium">MARCELACOCINA</span>{" "}
            tenés muchas más ideas fáciles para el día a día."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
