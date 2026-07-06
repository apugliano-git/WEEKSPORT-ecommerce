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

  // Fetch similar products
  // 1. Same genero
  let similares: Producto[] = []
  
  if (producto.genero) {
    const { data: porGenero } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('genero', producto.genero)
      .neq('id', producto.id)
      .eq('activo', true)
      .limit(4)
      
    similares = (porGenero as Producto[]) || []
  }

  // 2. Same category to fill remaining spots up to 4
  if (similares.length < 4) {
    const idsExcluir = [producto.id, ...similares.map(p => p.id)]
    const idsString = `(${idsExcluir.join(',')})`
    
    const { data: porCategoria } = await supabase
      .from('productos')
      .select('*, variantes_stock(*)')
      .eq('categoria_id', producto.categoria_id)
      .not('id', 'in', idsString)
      .eq('activo', true)
      .limit(4 - similares.length)

    similares = [...similares, ...((porCategoria as Producto[]) || [])]
  }

  return (
    <ProductDetail producto={producto as Producto} similares={similares} />
  )
}
