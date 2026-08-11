import { StoreClient } from "@/components/catalog/StoreClient";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
export const revalidate = 0; // Evitar caché estática para reflejar cambios en tiempo real

export default async function HomePage() {
  // 0. Obtener Configuración
  const { data: config } = await supabase
    .from('configuracion_sitio')
    .select('*')
    .eq('id', 1)
    .single();

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

  const productosBrutos = productosData || [];
  
  // Filtrar variantes para mostrar solo las visibles en el catálogo público
  const productos = productosBrutos.map(prod => ({
    ...prod,
    variantes_stock: (prod.variantes_stock || []).filter((v: any) => v.visible_en_catalogo)
  }));

  return (
    <main className="flex-1 w-full flex flex-col">
      <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center">Cargando catálogo...</div>}>
        <StoreClient productos={productos} categorias={categorias} config={config} />
      </Suspense>
    </main>
  );
}
