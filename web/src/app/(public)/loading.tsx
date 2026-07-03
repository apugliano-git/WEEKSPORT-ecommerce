import { Skeleton } from "@/components/ui/Skeleton";

export default function CargandoPublico() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-12">
      {/* Barra de Filtros Simulada */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-24 rounded-full bg-neutral-800" />
        <Skeleton className="h-10 w-32 rounded-full bg-neutral-800" />
        <Skeleton className="h-10 w-28 rounded-full bg-neutral-800" />
        <Skeleton className="h-10 w-40 rounded-full bg-neutral-800" />
      </div>

      {/* Grilla de Tarjetas Simulada */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, indice) => (
          <div 
            key={indice} 
            className="flex flex-col gap-4 rounded-[24px] bg-neutral-900/40 p-4 transition-all"
          >
            {/* Contenedor de la Imagen Grande */}
            <Skeleton className="aspect-[3/4] w-full rounded-[24px] bg-neutral-800" />
            
            {/* Información del Producto */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-1 flex-col gap-3">
                {/* Nombre de la prenda */}
                <Skeleton className="h-6 w-3/4 rounded-md bg-neutral-800" />
                {/* Precio de la prenda */}
                <Skeleton className="h-5 w-1/3 rounded-md bg-neutral-800" />
              </div>
              {/* Marcador Redondo de Compra Rápida */}
              <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-neutral-800" />
            </div>

            {/* Píldoras para Variantes (Talles y Colores) */}
            <div className="mt-1 flex gap-2">
              <Skeleton className="h-7 w-12 rounded-full bg-neutral-800" />
              <Skeleton className="h-7 w-12 rounded-full bg-neutral-800" />
              <Skeleton className="h-7 w-12 rounded-full bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
