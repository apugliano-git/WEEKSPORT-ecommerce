import type { Producto, VarianteStock } from '@/types'

export function visibleVariants(variants: VarianteStock[] | undefined): VarianteStock[] {
  return (variants ?? []).filter(variant => variant.visible_en_catalogo)
}

export function filterVisibleInStock(products: Producto[]): Producto[] {
  return products
    .map(product => ({ ...product, variantes_stock: visibleVariants(product.variantes_stock) }))
    .filter(product => product.variantes_stock?.some(variant => variant.cantidad > 0))
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash >>> 0
}

export function deterministicProductOrder<T extends { id: string }>(products: T[], productId: string): T[] {
  return [...products].sort((left, right) => {
    const leftHash = stableHash(`${productId}:${left.id}`)
    const rightHash = stableHash(`${productId}:${right.id}`)
    return leftHash - rightHash || left.id.localeCompare(right.id)
  })
}

const buenosAiresDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function dailyProductOrder<T extends { id: string }>(products: T[], date = new Date()): T[] {
  return deterministicProductOrder(products, buenosAiresDay.format(date))
}
