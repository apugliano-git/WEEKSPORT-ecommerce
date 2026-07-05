import { StoreClient } from "@/components/catalog/StoreClient";
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
      <StoreClient productos={productos} categorias={categorias} />
    </main>
  );
}
