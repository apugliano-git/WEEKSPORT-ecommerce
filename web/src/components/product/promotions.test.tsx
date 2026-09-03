import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ProductInfo } from './ProductInfo'
import { CartProvider } from '@/context/CartContext'
import type { Producto } from '@/types'
import { CatalogClient } from '@/components/catalog/CatalogClient'
import { SearchProvider } from '@/context/SearchContext'

const product: Producto = {
  id: 'product-1', nombre: 'Remera', descripcion: '', categoria_id: 'category-1',
  imagenes: [], activo: true, tipo_talle: 'estandar', created_at: '',
  precio_promocional: 800,
  variantes_stock: [{
    id: 'variant-1', producto_id: 'product-1', talle: 'M', color: 'Negro',
    cantidad: 3, precio: 1000, visible_en_catalogo: true,
  }],
}

const oferta = { ...product, precio_promocional: null, en_oferta: true } as Producto

it('Oferta oculta todos los precios de la tarjeta y conserva el nombre', () => {
  const html = renderToStaticMarkup(<ProductCard producto={oferta} />)
  expect(html).toContain('Oferta')
  expect(html).toContain('Remera')
  expect(html).not.toContain('$')
  expect(html).not.toContain('1.000,00')
})

it('incluye Oferta en promociones aunque no tenga precio promocional', () => {
  const html = renderToStaticMarkup(<SearchProvider><CatalogClient
    activeCategoryId="promociones"
    productos={[oferta, { ...product, id: 'normal', nombre: 'Normal', precio_promocional: null }]}
  /></SearchProvider>)
  expect(html).toContain('Remera')
  expect(html).not.toContain('Normal')
})

it.each([1000, 1500])('la ficha de Oferta conserva el precio de su variante: %s', (precio) => {
  const html = renderToStaticMarkup(<CartProvider><ProductInfo producto={{
    ...oferta, variantes_stock: [{ ...product.variantes_stock![0], precio }],
  }} /></CartProvider>)
  expect(html).toContain(precio === 1000 ? '1.000,00' : '1.500,00')
  expect(html).not.toContain('line-through')
})

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
