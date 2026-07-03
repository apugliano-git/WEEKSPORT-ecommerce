import { Skeleton } from "@/components/ui/Skeleton";

export default function CargandoAdministrador() {
  return (
    <div className="min-h-screen bg-black p-6 md:p-10 text-neutral-200">
      {/* Encabezado y Tarjetas de Métricas Simuladas */}
      <div className="mb-10 flex flex-col gap-8">
        <Skeleton className="h-10 w-1/4 rounded-lg bg-neutral-800" />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Tarjeta: Productos Activos */}
          <div className="flex flex-col justify-center rounded-2xl border border-neutral-800 bg-zinc-950 p-6">
            <Skeleton className="mb-4 h-5 w-2/5 rounded-md bg-neutral-800" />
            <Skeleton className="h-12 w-1/4 rounded-md bg-neutral-800" />
          </div>
          
          {/* Tarjeta: Sin Stock */}
          <div className="flex flex-col justify-center rounded-2xl border border-neutral-800 bg-zinc-950 p-6">
            <Skeleton className="mb-4 h-5 w-1/3 rounded-md bg-neutral-800" />
            <Skeleton className="h-12 w-1/4 rounded-md bg-neutral-800" />
          </div>
          
          {/* Tarjeta: Ventas u otra métrica */}
          <div className="flex flex-col justify-center rounded-2xl border border-neutral-800 bg-zinc-950 p-6">
            <Skeleton className="mb-4 h-5 w-1/2 rounded-md bg-neutral-800" />
            <Skeleton className="h-12 w-1/4 rounded-md bg-neutral-800" />
          </div>
        </div>
      </div>

      {/* Tabla de Productos Simulada */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-zinc-950">
        {/* Encabezado de la Tabla */}
        <div className="grid grid-cols-[100px_1fr_1fr_150px_100px] gap-4 border-b border-neutral-800 bg-neutral-900/50 p-4">
          <Skeleton className="h-6 w-full rounded-md bg-neutral-800" />
          <Skeleton className="h-6 w-3/4 rounded-md bg-neutral-800" />
          <Skeleton className="h-6 w-1/2 rounded-md bg-neutral-800" />
          <Skeleton className="h-6 w-full rounded-md bg-neutral-800" />
          <Skeleton className="h-6 w-full rounded-md bg-neutral-800" />
        </div>

        {/* Filas de la Tabla */}
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div 
              key={indice} 
              className="grid grid-cols-[100px_1fr_1fr_150px_100px] items-center gap-4 border-b border-neutral-800/40 p-4 last:border-0"
            >
              {/* ID Simulado */}
              <Skeleton className="h-5 w-1/2 rounded-md bg-neutral-800" />
              
              {/* Nombre e Imagen de la prenda */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-neutral-800" />
                <Skeleton className="h-5 w-3/4 rounded-md bg-neutral-800" />
              </div>

              {/* Categoría Simulada */}
              <Skeleton className="h-5 w-2/3 rounded-full bg-neutral-800" />

              {/* Matriz de Variantes de Stock */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-8 rounded-md bg-neutral-800" />
                <Skeleton className="h-6 w-8 rounded-md bg-neutral-800" />
                <Skeleton className="h-6 w-8 rounded-md bg-neutral-800" />
              </div>

              {/* Acciones de la fila */}
              <div className="flex justify-end gap-3">
                <Skeleton className="h-8 w-8 rounded-md bg-neutral-800" />
                <Skeleton className="h-8 w-8 rounded-md bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
