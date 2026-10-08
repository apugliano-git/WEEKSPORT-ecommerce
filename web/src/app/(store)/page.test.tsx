import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { query, config } = vi.hoisted(() => ({ query: vi.fn(), config: vi.fn() }))
vi.mock('@/lib/siteConfig', () => ({ getSiteConfig: config }))
vi.mock('@/components/catalog/StoreClient', () => ({ StoreClient: () => null }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: (table: string) => ({
    select: () => table === 'categorias' ? { retry: () => query(table) } : { eq: () => ({ retry: () => query(table) }) },
  }) }),
}))
import HomePage from './page'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  vi.stubGlobal('React', React)
  query.mockReset()
  config.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

it('entrega el hero real y categorías recuperadas a la portada', async () => {
  const hero = { hero_titulo: 'WEEKSPORT', hero_imagen_url: '/hero-real.webp' }
  config.mockResolvedValue(hero)
  let categoryAttempts = 0
  query.mockImplementation(async (table: string) => {
    if (table === 'productos') return { data: [], error: null, status: 200 }
    categoryAttempts += 1
    return categoryAttempts === 1
      ? { data: null, error: { message: 'Unavailable' }, status: 503 }
      : { data: [{ id: 'cat', nombre: 'Calzas', imagen_url: '/calzas.webp' }], error: null, status: 200 }
  })
  const page = await HomePage()
  const store = page.props.children.props.children
  expect(store.props.config).toEqual(hero)
  expect(store.props.categorias).toEqual([{ id: 'cat', name: 'Calzas', imagen_url: '/calzas.webp' }])
})

it('no renderiza una portada incompleta si las categorías fallan definitivamente', async () => {
  config.mockResolvedValue({ hero_titulo: 'WEEKSPORT' })
  query.mockImplementation(async (table: string) => table === 'productos'
    ? { data: [], error: null, status: 200 }
    : { data: null, error: { message: 'Forbidden' }, status: 403 })
  await expect(HomePage()).rejects.toThrow('categorias')
})
