import { beforeEach, expect, it, vi } from 'vitest'

const { update, eq, single, upload } = vi.hoisted(() => {
  const single = vi.fn()
  const eq = vi.fn(() => ({ select: () => ({ single }) }))
  const update = vi.fn(() => ({ eq }))
  return { update, eq, single, upload: vi.fn() }
})
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ from: () => ({ update }) }) }))
vi.mock('@/lib/inventarioService', () => ({ subirImagenProducto: upload }))
import { guardarCategoria } from './categoriasService'

beforeEach(() => {
  vi.clearAllMocks()
  single.mockResolvedValue({ data: { nombre: 'Joggings', imagen_url: 'foto-actual.jpg' }, error: null })
  upload.mockResolvedValue({ url: 'foto-nueva.jpg' })
})

it('renombra sin subir foto ni modificar slug o asociaciones', async () => {
  const result = await guardarCategoria('cat-1', '  Joggings  ')
  expect(result.data).toEqual({ nombre: 'Joggings', imagen_url: 'foto-actual.jpg' })
  expect(upload).not.toHaveBeenCalled()
  expect(update).toHaveBeenCalledWith({ nombre: 'Joggings' })
  expect(eq).toHaveBeenCalledWith('id', 'cat-1')
})

it('guarda nombre e imagen juntos cuando se elige una foto', async () => {
  const file = new File(['image'], 'foto.jpg', { type: 'image/jpeg' })
  await guardarCategoria('cat-1', 'Joggings', file)
  expect(upload).toHaveBeenCalledWith(file)
  expect(update).toHaveBeenCalledWith({ nombre: 'Joggings', imagen_url: 'foto-nueva.jpg' })
})

it('rechaza nombres vacíos antes de subir o escribir', async () => {
  expect((await guardarCategoria('cat-1', '   ')).error).toBeTruthy()
  expect(upload).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})

it('no guarda si falla la foto', async () => {
  upload.mockResolvedValue({ error: 'Foto inválida' })
  expect((await guardarCategoria('cat-1', 'Joggings', new File([], 'foto.jpg'))).error).toBe('Foto inválida')
  expect(update).not.toHaveBeenCalled()
})

it('reporta errores de escritura y conexión sin falso éxito', async () => {
  single.mockResolvedValue({ data: null, error: { message: 'Sin permisos' } })
  expect((await guardarCategoria('cat-1', 'Joggings')).error).toBe('Sin permisos')
  single.mockRejectedValue(new Error('offline'))
  expect((await guardarCategoria('cat-1', 'Joggings')).error).toBeTruthy()
})
