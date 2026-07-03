import { CatalogClient } from "@/components/catalog/CatalogClient";
import { supabase } from "@/lib/supabase";

export const revalidate = 0; // Evitar caché estática para reflejar cambios en tiempo real

export default async function HomePage() {
  // 1. Obtener Categorías
  const { data: categoriasData } = await supabase
    .from('categorias')
    .select('id, nombre');

  const categorias = (categoriasData || []).map(cat => ({
    id: cat.id,
    name: cat.nombre // Mapeo temporal de 'nombre' a 'name' para mantener compatibilidad con el front
  }));

  // 2. Obtener Productos Activos con sus variantes
  const { data: productosData } = await supabase
    .from('productos')
    .select(`
      *,
      variantes_stock (*)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });

  const productos = productosData || [];

  return (
    <main className="flex-1 w-full flex flex-col">
      {/* Hero Section Premium */}
      <section className="relative w-full overflow-hidden bg-[#0A0A0C] border-b border-white/5 pt-20 pb-24 sm:pt-32 sm:pb-36 flex items-center justify-center">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5C00]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#FF5C00] text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
            Catálogo Exclusivo
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold font-display text-white tracking-tighter mb-6 leading-tight">
            Rendimiento en cada <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-orange-400">
              movimiento
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Indumentaria de barrio diseñada para entrenar sin límites. Elevá tu potencial con calzas, tops y remeras de calidad premium.
          </p>
        </div>
      </section>

      {/* Contenedor del Catálogo */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#1A1A20]/50 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl">
            <div className="w-20 h-20 bg-[#FF5C00]/10 rounded-full flex items-center justify-center mb-6 border border-[#FF5C00]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5C00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
            </div>
            <h3 className="text-2xl font-bold font-display text-white mb-2">Próximamente</h3>
            <p className="text-gray-400 text-center max-w-md leading-relaxed">
              Estamos preparando la nueva colección. Nuestro catálogo de indumentaria deportiva estará disponible muy pronto.
            </p>
          </div>
        ) : (
          <CatalogClient productos={productos as any} categorias={categorias} />
        )}
      </section>
    </main>
  );
}
