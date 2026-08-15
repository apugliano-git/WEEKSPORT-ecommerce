import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ProductModal } from '@/components/product/ProductModal';
import { Producto } from '@/types';

export const revalidate = 0; // Evitar caché, igual que la ruta original

export default async function InterceptedProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // ----- Misma lógica de fetching que (store)/producto/[id]/page.tsx -----

  const { data: productoBruto, error } = await supabase
    .from('productos')
    .select('*, variantes_stock(*)')
    .eq('id', productId)
    .single();

  if (error || !productoBruto || !productoBruto.activo) {
    notFound();
  }

  const producto: Producto = {
    ...productoBruto,
    variantes_stock: (productoBruto.variantes_stock || []).filter(
      (v: any) => v.visible_en_catalogo
    ),
  };

  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function filterVisibleVariants(prods: any[]): Producto[] {
    return prods.map((prod) => ({
      ...prod,
      variantes_stock: (prod.variantes_stock || []).filter(
        (v: any) => v.visible_en_catalogo
      ),
    })).filter(prod => 
      prod.variantes_stock.reduce((acc: number, v: any) => acc + v.cantidad, 0) > 0
    );
  }

  let similares: Producto[] = [];

  // Nivel 1: misma categoría + mismo género
  let nivel1Data: Producto[] = [];
  if (producto.genero) {
    const { data: nivel1 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('categoria_id', producto.categoria_id)
      .eq('genero', producto.genero)
      .neq('id', producto.id)
      .eq('activo', true)
      .limit(15);
    nivel1Data = filterVisibleVariants(nivel1 || []);
  }

  similares = shuffleArray(nivel1Data).slice(0, 4);

  // Nivel 2: mismo género
  if (similares.length < 4 && producto.genero) {
    const idsExcluir = [producto.id, ...similares.map((p) => p.id)];
    const idsString = `(${idsExcluir.join(',')})`;
    const { data: nivel2 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('genero', producto.genero)
      .not('id', 'in', idsString)
      .eq('activo', true)
      .limit(15);

    const pool2 = shuffleArray(filterVisibleVariants(nivel2 || []));
    similares = [...similares, ...pool2.slice(0, 4 - similares.length)];
  }

  // Nivel 3: cualquier producto activo (emergencia)
  if (similares.length < 4) {
    const idsExcluir = [producto.id, ...similares.map((p) => p.id)];
    const idsString = `(${idsExcluir.join(',')})`;
    const { data: nivel3 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .not('id', 'in', idsString)
      .eq('activo', true)
      .limit(15);

    const pool3 = shuffleArray(filterVisibleVariants(nivel3 || []));
    similares = [...similares, ...pool3.slice(0, 4 - similares.length)];
  }

  // ----- Renderiza dentro del modal, no como página completa -----
  return <ProductModal producto={producto as Producto} similares={similares} />;
}
