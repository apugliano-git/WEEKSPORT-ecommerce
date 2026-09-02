import type { CartItem, Producto, VarianteStock } from '@/types'

function isVariante(value: unknown): value is VarianteStock {
  if (typeof value !== 'object' || value === null) return false
  const variant = value as Record<string, unknown>
  return typeof variant.id === 'string'
    && typeof variant.producto_id === 'string'
    && typeof variant.talle === 'string'
    && typeof variant.color === 'string'
    && typeof variant.cantidad === 'number'
    && Number.isInteger(variant.cantidad)
    && variant.cantidad >= 0
    && typeof variant.precio === 'number'
    && Number.isFinite(variant.precio)
    && typeof variant.visible_en_catalogo === 'boolean'
}

function isProducto(value: unknown): value is Producto {
  if (typeof value !== 'object' || value === null) return false
  const product = value as Record<string, unknown>
  return typeof product.id === 'string'
    && typeof product.nombre === 'string'
    && typeof product.descripcion === 'string'
    && typeof product.categoria_id === 'string'
    && Array.isArray(product.imagenes)
    && product.imagenes.every(image => typeof image === 'string')
    && typeof product.activo === 'boolean'
    && typeof product.tipo_talle === 'string'
    && typeof product.created_at === 'string'
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.variante_id === 'string'
    && typeof item.cantidad === 'number'
    && Number.isInteger(item.cantidad)
    && item.cantidad > 0
    && isProducto(item.producto)
    && isVariante(item.variante)
}

export function parseStoredCart(serialized: string | null): CartItem[] {
  if (!serialized) return []
  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed) || !parsed.every(isCartItem)) return []
    return parsed
  } catch {
    return []
  }
}
