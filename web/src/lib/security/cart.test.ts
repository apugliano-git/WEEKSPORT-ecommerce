import { describe, expect, it } from 'vitest'
import { parseStoredCart } from './cart'

const validCartItem = {
  variante_id: 'variant-1',
  cantidad: 1,
  producto: {
    id: 'product-1', nombre: 'Producto', descripcion: '', categoria_id: 'category-1',
    imagenes: [], activo: true, tipo_talle: 'estandar', created_at: '2026-01-01T00:00:00Z',
  },
  variante: {
    id: 'variant-1', producto_id: 'product-1', talle: 'M', color: 'Negro', cantidad: 2,
    precio: 100, visible_en_catalogo: true,
  },
}

describe('parseStoredCart', () => {
  it('loads only valid cart-shaped data and rejects malformed storage', () => {
    expect(parseStoredCart(JSON.stringify([validCartItem]))).toEqual([validCartItem])
    expect(parseStoredCart(JSON.stringify([{ ...validCartItem, cantidad: 0 }]))).toEqual([])
    expect(parseStoredCart('{not-json')).toEqual([])
  })
})
