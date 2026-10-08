import { beforeEach, expect, it, vi } from 'vitest'
const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('react', () => ({ cache: (fn: unknown) => fn }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => ({ retry: query }) }) }) }) }),
}))
import { getSiteConfig } from './siteConfig'
beforeEach(() => query.mockReset())
it('recupera la configuración después de un fallo temporal', async () => {
  query.mockResolvedValueOnce({ data: null, error: { message: 'Unavailable' }, status: 503 })
    .mockResolvedValueOnce({ data: { hero_titulo: 'WEEKSPORT' }, error: null, status: 200 })
  expect(await getSiteConfig()).toEqual({ hero_titulo: 'WEEKSPORT' })
})
it('no convierte un error de permisos en configuración vacía', async () => {
  query.mockResolvedValue({ data: null, error: { message: 'Forbidden' }, status: 403 })
  await expect(getSiteConfig()).rejects.toThrow('configuracion_sitio')
  expect(query).toHaveBeenCalledTimes(1)
})
