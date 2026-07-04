import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-black">
      {/* Header Admin */}
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Tabla de administración simulada */}
      <div className="bg-zinc-950 p-6 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-1/3 rounded-lg" />
          <Skeleton className="h-10 w-1/4 rounded-lg" />
        </div>
        
        <div className="space-y-4">
          {/* Filas */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/30">
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <Skeleton className="h-6 w-1/4 rounded-md" />
              <Skeleton className="h-6 w-1/5 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
