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

  it('Oferta conserva los distintos precios de variantes del mismo producto', () => {
    let openedUrl = ''
    vi.stubGlobal('window', { open: (url: string) => { openedUrl = url } })
    const producto = { ...cart[0].producto, en_oferta: true, precio_promocional: null }
    procesarCheckoutWhatsApp('Ana', [
      { ...cart[0], producto, cantidad: 2 },
      { ...cart[0], producto, variante_id: 'variante-2', variante: { ...cart[0].variante, id: 'variante-2', color: 'Algodón', precio: 1500 } },
    ], '5491155551234')
    const message = new URL(openedUrl).searchParams.get('text')!
    expect(message).toContain('Color: Negro) x2 - $\u00a02.000,00')
    expect(message).toContain('Color: Algodón) x1 - $\u00a01.500,00')
    expect(message).toContain('Total estimado: $\u00a03.500,00')
  })

  it.each([null, 0, -1, NaN, Infinity])('usa el precio base si no hay un precio promocional válido: %s', (precio) => {
    let openedUrl = ''
    vi.stubGlobal('window', { open: (url: string) => { openedUrl = url } })
    procesarCheckoutWhatsApp('Ana', [{ ...cart[0], producto: { ...cart[0].producto, precio_promocional: precio } }], '5491155551234')
    expect(new URL(openedUrl).searchParams.get('text')).toContain('Total estimado: $\u00a01.000,00')
  })

  it.each([false, true])('usa el precio final en subtotales y total (sin anterior: %s)', (sinAnterior) => {
    let openedUrl = ''
    vi.stubGlobal('window', { open: (url: string) => { openedUrl = url } })
    procesarCheckoutWhatsApp('Ana', [
      { ...cart[0], cantidad: 2, producto: { ...cart[0].producto, precio_promocional: 800, promocion_sin_precio_anterior: sinAnterior } },
      { ...cart[0], producto: { ...cart[0].producto, nombre: 'Short' } },
    ], '5491155551234')
    const message = new URL(openedUrl).searchParams.get('text')!
    expect(message).toContain('Remera (Talle: M, Color: Negro) x2 - $\u00a01.600,00')
    expect(message).toContain('Short (Talle: M, Color: Negro) x1 - $\u00a01.000,00')
    expect(message).toContain('Total estimado: $\u00a02.600,00')
  })

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
