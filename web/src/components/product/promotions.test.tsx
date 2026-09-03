import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ProductInfo } from './ProductInfo'
import { CartProvider } from '@/context/CartContext'
import type { Producto } from '@/types'

const product: Producto = {
  id: 'product-1', nombre: 'Remera', descripcion: '', categoria_id: 'category-1',
  imagenes: [], activo: true, tipo_talle: 'estandar', created_at: '',
  precio_promocional: 800,
  variantes_stock: [{
    id: 'variant-1', producto_id: 'product-1', talle: 'M', color: 'Negro',
    cantidad: 3, precio: 1000, visible_en_catalogo: true,
  }],
}

describe.each([
  ['tarjeta', (producto: Producto) => renderToStaticMarkup(<ProductCard producto={producto} />)],
  ['ficha', (producto: Producto) => renderToStaticMarkup(<CartProvider><ProductInfo producto={producto} /></CartProvider>)],
] as const)('%s: promociones', (_, render) => {
  it('mantiene el precio anterior tachado para descuentos existentes', () => {
    const html = render(product)
    expect(html).toContain('Descuento')
    expect(html).toContain('line-through')
    expect(html).toContain('1.000,00')
    expect(html).toContain('800,00')
  })

  it('muestra sólo el precio final para una promoción', () => {
    const html = render({ ...product, promocion_sin_precio_anterior: true } as Producto)
    expect(html).toContain('Promoción')
    expect(html).toContain('800,00')
    expect(html).not.toContain('1.000,00')
    expect(html).not.toContain('line-through')
  })

  it('no etiqueta como promoción un producto sin precio promocional', () => {
    const html = render({ ...product, precio_promocional: null })
    expect(html).not.toContain('Descuento')
    expect(html).not.toContain('Promoción')
    expect(html).toContain('1.000,00')
  })
})
