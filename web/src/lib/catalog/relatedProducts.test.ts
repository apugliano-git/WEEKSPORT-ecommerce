import { describe, expect, it } from 'vitest'
import { deterministicProductOrder, filterVisibleInStock } from './relatedProducts'

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
})
