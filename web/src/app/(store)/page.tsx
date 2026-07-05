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
      <section className="relative w-full overflow-hidden bg-[#0F0F12] border-b border-white/5 pt-20 pb-24 sm:pt-32 sm:pb-36 flex items-center justify-center">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F400A1]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#F400A1] animate-pulse" />
            Catálogo Exclusivo
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold font-display text-white tracking-tighter mb-6 leading-tight">
            Rendimiento en cada <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F400A1] to-white">
              movimiento
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Indumentaria de barrio diseñada para entrenar sin límites. Elevá tu potencial con calzas, tops y remeras de calidad premium.
          </p>
        </div>
      </section>

      {/* Contenedor del Catálogo */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-[#0F0F12]">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F400A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/><path d="M3 15h6"/><path d="M3 18h6"/></svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Inventario en transición</h3>
            <p className="text-neutral-400 max-w-sm mx-auto">
              Estamos actualizando nuestro stock. Muy pronto descubrirás las nuevas prendas exclusivas para tu entrenamiento.
            </p>
          </div>
        ) : (
          <CatalogClient productos={productos} categorias={categorias} />
        )}
      </section>
    </main>
  );
}
