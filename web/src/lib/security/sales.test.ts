import { describe, expect, it } from 'vitest'
import { buildSalePayload } from './sales'

describe('buildSalePayload', () => {
  it('strips client-controlled snapshots before the RPC call', () => {
    expect(buildSalePayload([
      {
        variante_id: 'variant-1',
        cantidad: 2,
        nombre_producto: 'Producto manipulado',
        talle: 'M',
        color: 'Negro',
        precio_unitario: 1,
        subtotal: 2,
      },
    ])).toEqual([{ variante_id: 'variant-1', cantidad: 2 }])
  })
})
