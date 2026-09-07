import { describe, expect, it } from 'vitest'
import * as productHelpers from './relatedProducts'

const { deterministicProductOrder, filterVisibleInStock } = productHelpers

describe('related product helpers', () => {
  it('filters invisible and out-of-stock variants', () => {
    const products = [
      { id: 'one', variantes_stock: [{ visible_en_catalogo: true, cantidad: 1 }] },
      { id: 'two', variantes_stock: [{ visible_en_catalogo: false, cantidad: 4 }] },
      { id: 'three', variantes_stock: [{ visible_en_catalogo: true, cantidad: 0 }] },
    ]

    expect(filterVisibleInStock(products as never[]).map(product => product.id)).toEqual(['one'])
  })

  it('is stable for a product and varies by product seed', () => {
    const products = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]
    const first = deterministicProductOrder(products, 'current')
    expect(deterministicProductOrder(products, 'current')).toEqual(first)
    expect(deterministicProductOrder(products, 'other')).not.toEqual(first)
  })

  it('keeps the catalog order for one Buenos Aires day and changes it the next day', () => {
    const dailyProductOrder = Reflect.get(productHelpers, 'dailyProductOrder') as
      | ((products: { id: string }[], date: Date) => { id: string }[])
      | undefined
    const products = Array.from({ length: 12 }, (_, index) => ({ id: `product-${index}` }))

    expect(dailyProductOrder).toBeTypeOf('function')
    expect(dailyProductOrder?.(products, new Date('2026-09-06T03:05:00Z')))
      .toEqual(dailyProductOrder?.(products, new Date('2026-09-07T02:55:00Z')))
    expect(dailyProductOrder?.(products, new Date('2026-09-07T02:55:00Z')))
      .not.toEqual(dailyProductOrder?.(products, new Date('2026-09-07T03:05:00Z')))
  })
})
