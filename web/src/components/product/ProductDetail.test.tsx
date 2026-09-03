import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { ProductDetail } from './ProductDetail'
import { CartProvider } from '@/context/CartContext'
import type { Producto } from '@/types'

const producto: Producto = {
  id: 'test', nombre: 'Conjunto', descripcion: 'Algodón: top y short.\nLino: camisa y pantalón.',
  categoria_id: 'cat', imagenes: [], activo: true, tipo_talle: 'unico', created_at: '',
  variantes_stock: [{ id: 'v1', producto_id: 'test', talle: 'Único', color: 'Algodón', cantidad: 3, precio: 20000, visible_en_catalogo: true }],
}

it('lee precio y descripción antes de los controles, sin duplicar la descripción', () => {
  const html = renderToStaticMarkup(<CartProvider><ProductDetail producto={producto} similares={[]} /></CartProvider>)
  const precio = html.indexOf('20.000,00')
  const descripcion = html.indexOf(producto.descripcion)
  const color = html.indexOf('>Color<')
  expect(precio).toBeGreaterThan(-1)
  expect(descripcion).toBeGreaterThan(precio)
  expect(color).toBeGreaterThan(descripcion)
  expect(html.split(producto.descripcion)).toHaveLength(2)
  expect(html).toContain('Seleccioná un talle')
})

it('mantiene los controles cuando no hay descripción', () => {
  const html = renderToStaticMarkup(<CartProvider><ProductDetail producto={{ ...producto, descripcion: '' }} similares={[]} /></CartProvider>)
  expect(html).not.toContain('Descripción')
  expect(html).toContain('>Color<')
  expect(html).toContain('Seleccioná un talle')
})
