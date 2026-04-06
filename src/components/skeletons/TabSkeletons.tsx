import { Skeleton } from "@/components/ui/skeleton";

/** Inicio tab skeleton */
export function InicioSkeleton() {
  return (
    <div className="space-y-4 mb-6 animate-in fade-in duration-300">
      {/* Hero header */}
      <div className="text-center pt-4 pb-4 space-y-2">
        <Skeleton className="h-10 w-40 mx-auto rounded-lg" />
        <Skeleton className="h-3 w-28 mx-auto" />
        <Skeleton className="h-0.5 w-16 mx-auto" />
      </div>
      {/* Streak */}
      <Skeleton className="h-16 w-full rounded-xl" />
      {/* Cards */}
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      {/* AI Tip */}
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

/** Mi Cocina tab skeleton */
export function MiCocinaSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Banner */}
      <Skeleton className="w-full h-[100px] rounded-xl" />
      {/* Folder grid */}
      <div className="grid grid-cols-4 gap-2 px-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
      {/* Recipe list */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Planificar tab skeleton */
export function PlanificarSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Sub-tab bar */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>
      {/* Banner */}
      <Skeleton className="w-full h-[100px] rounded-xl" />
      {/* Content */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Generar tab skeleton */
export function GenerarSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Input area */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* Quick filters */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Time & meal selectors */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
      {/* Generate button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** Más tab skeleton */
export function MasSkeleton() {
  return (
    <div className="space-y-3 px-1 py-2 animate-in fade-in duration-300">
      <Skeleton className="h-6 w-24" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
