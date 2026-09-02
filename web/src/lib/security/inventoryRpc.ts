export type ProductCreationRpcResult =
  | { status: 'success'; producto_id: string }
  | { status: 'error'; message: string }

export function parseProductCreationRpcResponse(data: unknown): ProductCreationRpcResult {
  if (typeof data !== 'object' || data === null) {
    return { status: 'error', message: 'Respuesta inválida de la base de datos.' }
  }

  const response = data as Record<string, unknown>
  if (response.status === 'success' && typeof response.producto_id === 'string') {
    return { status: 'success', producto_id: response.producto_id }
  }

  if (response.status === 'success') {
    return { status: 'error', message: 'Respuesta inválida de la base de datos.' }
  }

  if (response.status === 'error' && typeof response.message === 'string') {
    return { status: 'error', message: response.message }
  }

  return { status: 'error', message: 'Error al crear el producto.' }
}
