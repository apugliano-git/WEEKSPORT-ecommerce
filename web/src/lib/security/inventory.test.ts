import { describe, expect, it } from 'vitest'
import { parseProductCreationRpcResponse } from './inventoryRpc'

describe('parseProductCreationRpcResponse', () => {
  it('accepts only a successful response with a product id', () => {
    expect(parseProductCreationRpcResponse({ status: 'success', producto_id: 'product-1' }))
      .toEqual({ status: 'success', producto_id: 'product-1' })
    expect(parseProductCreationRpcResponse({ status: 'success' })).toEqual({
      status: 'error',
      message: 'Respuesta inválida de la base de datos.',
    })
  })

  it('normalizes database errors without trusting arbitrary values', () => {
    expect(parseProductCreationRpcResponse({ status: 'error', message: 'invalid category' })).toEqual({
      status: 'error',
      message: 'invalid category',
    })
    expect(parseProductCreationRpcResponse({ status: 'error', message: 42 })).toEqual({
      status: 'error',
      message: 'Error al crear el producto.',
    })
  })
})
