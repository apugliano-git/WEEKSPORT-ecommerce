import { StoreClient } from "@/components/catalog/StoreClient";
import { createClient } from "@/lib/supabase/server";
import { filterVisibleInStock, visibleVariants } from "@/lib/catalog/relatedProducts";
import { Suspense } from "react";
export const revalidate = 0; // Evitar caché estática para reflejar cambios en tiempo real

export default async function HomePage() {
  const supabase = await createClient();
  // 0. Obtener Configuración
  const { data: config } = await supabase
    .from('configuracion_sitio')
    .select('*')
    .eq('id', 1)
    .single();

  // 1. Obtener Categorías
  const { data: categoriasData } = await supabase
    .from('categorias')
    .select('id, nombre, imagen_url');

  const categorias = (categoriasData || []).map(cat => ({
    id: cat.id,
    name: cat.nombre, // Mapeo temporal de 'nombre' a 'name' para mantener compatibilidad con el front
    imagen_url: cat.imagen_url
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
  
  // Filtrar variantes para mostrar solo las visibles en el catálogo público y excluir productos sin stock
  const productos = filterVisibleInStock(productosBrutos).map(prod => ({
    ...prod,
    variantes_stock: visibleVariants(prod.variantes_stock),
  }));

  return (
    <main className="flex-1 w-full flex flex-col">
      <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center">Cargando catálogo...</div>}>
        <StoreClient productos={productos} categorias={categorias} config={config} />
      </Suspense>
    </main>
  );
}
