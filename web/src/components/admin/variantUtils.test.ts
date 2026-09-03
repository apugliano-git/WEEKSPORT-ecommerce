import { describe, expect, it } from 'vitest'
import { groupVariantsByColor, sortVariants, withVariantStock } from './variantUtils'

const variant = (id: string, talle: string, color: string, cantidad: number, visible_en_catalogo = true) => ({
  id,
  producto_id: 'product-1',
  talle,
  color,
  cantidad,
  precio: 100,
  visible_en_catalogo,
})

describe('variant utilities', () => {
  it('orders sizes, groups colors, and preserves stock/visibility', () => {
    const variants = [
      variant('m-black', 'M', 'Negro', 2),
      variant('xs-black', 'XS', 'Negro', 1, false),
      variant('s-blue', 'S', 'Azul', 4),
    ]
    expect(sortVariants(variants).map(item => item.talle)).toEqual(['XS', 'S', 'M'])
    expect(groupVariantsByColor(variants)).toEqual([
      { color: 'Negro', precio: 100, variantes: [variants[1], variants[0]] },
      { color: 'Azul', precio: 100, variantes: [variants[2]] },
    ])
    expect(groupVariantsByColor(variants)[0].variantes[0]).toMatchObject({ cantidad: 1, visible_en_catalogo: false })
  })

  it('updates one variant stock without mutating the server snapshot', () => {
    const products = [{
      id: 'product-1',
      nombre: 'Remera',
      descripcion: '',
      categoria_id: 'category-1',
      genero: 'Unisex',
      tipo_talle: 'estandar',
      imagenes: [],
      activo: true,
      created_at: '2026-01-01T00:00:00.000Z',
      variantes_stock: [variant('m-black', 'M', 'Negro', 2)],
    }]

    const updated = withVariantStock(products, 'm-black', 7)

    expect(updated[0].variantes_stock?.[0].cantidad).toBe(7)
    expect(products[0].variantes_stock[0].cantidad).toBe(2)
  })
})
