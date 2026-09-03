import { beforeEach, describe, expect, it, vi } from 'vitest'

const { single, from } = vi.hoisted(() => {
  const single = vi.fn()
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  return { single, from }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from }),
}))

import { actualizarStockVariante } from './inventarioService'

describe('actualizarStockVariante', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    single.mockResolvedValue({
      data: null,
      error: { message: 'JSON object requested, multiple (or no) rows returned' },
    })
  })

  it('does not report success when Supabase updated no row', async () => {
    const result = await actualizarStockVariante('missing-variant', 4)

    expect(result).toEqual({
      status: 'error',
      message: 'JSON object requested, multiple (or no) rows returned',
    })
  })
})
