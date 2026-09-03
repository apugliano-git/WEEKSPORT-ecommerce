import type { CartItem } from '@/types'

export function cartItemSubtotal(item: CartItem): number {
  const promo = item.producto.precio_promocional
  const precio = typeof promo === 'number' && Number.isFinite(promo) && promo > 0
    ? promo
    : item.variante.precio
  return precio * item.cantidad
}
