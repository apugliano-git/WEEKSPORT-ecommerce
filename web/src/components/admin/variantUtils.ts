import type { Producto, VarianteStock } from '@/types'

export const DEFAULT_SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL',
  '85', '90', '95', '100', '105', '110', '115', '120', '120+',
]

export interface VariantColorGroup {
  color: string
  precio: number
  variantes: VarianteStock[]
}

export function withVariantStock(products: Producto[], variantId: string, cantidad: number): Producto[] {
  return products.map(product => ({
    ...product,
    variantes_stock: product.variantes_stock?.map(variant =>
      variant.id === variantId ? { ...variant, cantidad } : variant
    ),
  }))
}

export function sortVariants(variants: VarianteStock[], sizeOrder: string[] = DEFAULT_SIZE_ORDER): VarianteStock[] {
  return [...variants].sort((left, right) => {
    const leftIndex = sizeOrder.indexOf(left.talle.toUpperCase())
    const rightIndex = sizeOrder.indexOf(right.talle.toUpperCase())
    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex
    if (leftIndex !== -1) return -1
    if (rightIndex !== -1) return 1
    return left.talle.localeCompare(right.talle)
  })
}

export function groupVariantsByColor(
  variants: VarianteStock[],
  sizeOrder?: string[],
): VariantColorGroup[] {
  const groups = new Map<string, VarianteStock[]>()
  for (const variant of variants) {
    const color = variant.color || 'Sin color'
    const group = groups.get(color) ?? []
    group.push(variant)
    groups.set(color, group)
  }
  return [...groups].map(([color, groupedVariants]) => ({
    color,
    precio: groupedVariants[0]?.precio ?? 0,
    variantes: sortVariants(groupedVariants, sizeOrder),
  }))
}
