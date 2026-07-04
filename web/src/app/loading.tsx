import { Skeleton } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center pt-24 space-y-12">
      <div className="w-full max-w-7xl flex flex-col items-center">
        {/* Simulación del Hero / Título */}
        <Skeleton className="h-14 w-3/4 max-w-2xl rounded-xl mb-12" />
        
        {/* Simulación de la grilla de catálogo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-4">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
