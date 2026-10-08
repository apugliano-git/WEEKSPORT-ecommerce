import { afterEach, expect, it, vi } from 'vitest'
import { readQuery } from './readQuery'

afterEach(() => vi.restoreAllMocks())

it('mantiene los datos vacíos legítimos sin reintentar', async () => {
  expect(await readQuery('categorias', async () => ({ data: [], error: null, status: 200 }))).toEqual([])
})

it('recupera categorías ante un error de red', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let attempts = 0
  const categories = [{ id: 'one', nombre: 'Calzas' }]
  const data = await readQuery('categorias', async () => {
    attempts += 1
    return attempts === 1
      ? { data: null, error: { message: 'fetch failed' }, status: 0 }
      : { data: categories, error: null, status: 200 }
  })
  expect(data).toEqual(categories)
  expect(attempts).toBe(2)
})

it('limita los reintentos y propaga fallos persistentes', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let attempts = 0
  await expect(readQuery('productos', async () => {
    attempts += 1
    return { data: null, error: { message: 'Unavailable' }, status: 503 }
  })).rejects.toThrow('productos')
  expect(attempts).toBe(3)
})
