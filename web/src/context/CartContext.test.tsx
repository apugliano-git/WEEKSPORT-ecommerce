import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CartProvider, useCart } from './CartContext'

const storedCart = JSON.stringify([{
  variante_id: 'variante-1',
  cantidad: 1,
  producto: {
    id: 'producto-1', nombre: 'Remera', descripcion: '', categoria_id: 'categoria-1',
    imagenes: [], activo: true, tipo_talle: 'ropa', created_at: '2026-09-02T00:00:00Z',
  },
  variante: {
    id: 'variante-1', producto_id: 'producto-1', talle: 'M', color: 'Negro', cantidad: 2,
    precio: 1000, visible_en_catalogo: true,
  },
}])

function ItemCount() {
  return <span>{useCart().totalItems}</span>
}

describe('CartProvider hydration', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('produce el mismo HTML inicial en servidor y navegador', () => {
    const serverHtml = renderToString(<CartProvider><ItemCount /></CartProvider>)
    vi.stubGlobal('window', {
      localStorage: { getItem: () => storedCart },
    })

    const browserHtml = renderToString(<CartProvider><ItemCount /></CartProvider>)

    expect(browserHtml).toBe(serverHtml)
  })
})
