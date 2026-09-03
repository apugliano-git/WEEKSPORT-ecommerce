import { beforeEach, expect, it, vi } from 'vitest'

const { update, single } = vi.hoisted(() => {
  const single = vi.fn()
  const update = vi.fn(() => ({ eq: () => ({ select: () => ({ single }) }) }))
  return { update, single }
})
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ from: () => ({ update }) }) }))

import { setPromocion, clearPromocion } from './productoService'

beforeEach(() => {
  vi.clearAllMocks()
  single.mockResolvedValue({ data: { id: 'product-1' }, error: null })
})

it('guarda precio y modo juntos; los llamados existentes siguen siendo descuentos', async () => {
  expect((await setPromocion('product-1', 800)).status).toBe('success')
  expect(update).toHaveBeenLastCalledWith({ precio_promocional: 800, promocion_sin_precio_anterior: false })
  expect((await setPromocion('product-1', 1000, true)).status).toBe('success')
  expect(update).toHaveBeenLastCalledWith({ precio_promocional: 1000, promocion_sin_precio_anterior: true })
  await clearPromocion('product-1')
  expect(update).toHaveBeenLastCalledWith({ precio_promocional: null, promocion_sin_precio_anterior: false })
})

it('rechaza precios no positivos o no finitos sin escribir', async () => {
  for (const precio of [0, -1, NaN, Infinity]) {
    expect((await setPromocion('product-1', precio, true)).status).toBe('error')
  }
  expect(update).not.toHaveBeenCalled()
})

it('propaga un error de guardado sin reportar éxito', async () => {
  single.mockResolvedValue({ data: null, error: { message: 'Sin permisos' } })
  expect(await setPromocion('product-1', 800, true)).toEqual({ status: 'error', message: 'Sin permisos' })
})
