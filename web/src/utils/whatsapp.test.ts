import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CartItem } from '@/types'
import { procesarCheckoutWhatsApp } from './whatsapp'

const cart: CartItem[] = [{
  variante_id: 'variante-1',
  cantidad: 1,
  producto: {
    id: 'producto-1',
    nombre: 'Remera',
    descripcion: '',
    categoria_id: 'categoria-1',
    imagenes: [],
    activo: true,
    tipo_talle: 'ropa',
    created_at: '2026-09-02T00:00:00Z',
  },
  variante: {
    id: 'variante-1',
    producto_id: 'producto-1',
    talle: 'M',
    color: 'Negro',
    cantidad: 2,
    precio: 1000,
    visible_en_catalogo: true,
  },
}]

describe('procesarCheckoutWhatsApp', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('abre el checkout con el teléfono configurado normalizado', () => {
    let openedUrl = ''
    vi.stubGlobal('window', {
      open: (url: string) => { openedUrl = url },
    })

    const checkoutConTelefono = procesarCheckoutWhatsApp as unknown as (
      nombre: string,
      items: CartItem[],
      telefono: string,
    ) => void

    checkoutConTelefono('Ana', cart, '+54 9 11 5555-1234')

    expect(openedUrl).toMatch(/^https:\/\/wa\.me\/5491155551234\?text=/)
  })
})
