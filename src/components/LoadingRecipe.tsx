import { cn } from "@/lib/utils";

interface LoadingRecipeProps {
  isInstantRecipe?: boolean;
  instantRecipeName?: string;
}

export function LoadingRecipe({ isInstantRecipe, instantRecipeName }: LoadingRecipeProps) {
  return (
    <div className="animate-fade-in">
      {/* Instant recipe hint */}
      {isInstantRecipe && instantRecipeName && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground animate-pulse">
            Mientras tanto, mirá esta receta: <span className="font-medium">{instantRecipeName}</span>
          </p>
        </div>
      )}

      <div
        className={cn(
          "bg-card rounded-2xl overflow-hidden",
          "shadow-card border border-border/50"
        )}
      >
        {/* Header skeleton with gradient animation */}
        <div className="gradient-warm p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 animate-pulse" />
            <div className="w-32 h-4 rounded bg-primary-foreground/20 animate-pulse" />
          </div>
          <div className="w-3/4 h-8 rounded-lg bg-primary-foreground/20 animate-pulse mb-3" />
          <div className="w-40 h-4 rounded bg-primary-foreground/20 animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div className="p-6 space-y-6">
          {/* Ingredients skeleton */}
          <div>
            <div className="w-32 h-6 rounded bg-muted animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-muted animate-pulse"
                  style={{ 
                    width: `${60 + Math.random() * 30}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Steps skeleton */}
          <div>
            <div className="w-48 h-6 rounded bg-muted animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 h-4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Tip skeleton */}
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="w-32 h-5 rounded bg-muted animate-pulse mb-2" />
            <div className="w-full h-4 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
