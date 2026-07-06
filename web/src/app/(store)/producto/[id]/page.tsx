import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product/ProductDetail'
import { Producto } from '@/types'

export const revalidate = 0; // Avoid caching

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Fetch product
  const { data: producto, error } = await supabase
    .from('productos')
    .select('*, variantes_stock(*)')
    .eq('id', productId)
    .single()

  if (error || !producto || !producto.activo) {
    notFound()
  }

  // Helper shuffle function
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  let similares: Producto[] = []

  // Nivel 1: misma categoría + mismo género
  let nivel1Data: Producto[] = []
  if (producto.genero) {
    const { data: nivel1 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('categoria_id', producto.categoria_id)
      .eq('genero', producto.genero)
      .neq('id', producto.id)
      .eq('activo', true)
      .limit(15)
    nivel1Data = (nivel1 as Producto[]) || []
  }
  
  similares = shuffleArray(nivel1Data).slice(0, 4)

  // Nivel 2: mismo género
  if (similares.length < 4 && producto.genero) {
    const idsExcluir = [producto.id, ...similares.map(p => p.id)]
    const idsString = `(${idsExcluir.join(',')})`
    const { data: nivel2 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('genero', producto.genero)
      .not('id', 'in', idsString)
      .eq('activo', true)
      .limit(15)
    
    const pool2 = shuffleArray((nivel2 as Producto[]) || [])
    similares = [...similares, ...pool2.slice(0, 4 - similares.length)]
  }

  // Nivel 3: cualquier producto activo (emergencia)
  if (similares.length < 4) {
    const idsExcluir = [producto.id, ...similares.map(p => p.id)]
    const idsString = `(${idsExcluir.join(',')})`
    const { data: nivel3 } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .not('id', 'in', idsString)
      .eq('activo', true)
      .limit(15)

    const pool3 = shuffleArray((nivel3 as Producto[]) || [])
    similares = [...similares, ...pool3.slice(0, 4 - similares.length)]
  }

  return (
    <ProductDetail producto={producto as Producto} similares={similares} />
  )
}
