export interface SalePayloadItem {
  variante_id: string
  cantidad: number
}

export function buildSalePayload<T extends Pick<SalePayloadItem, 'variante_id' | 'cantidad'>>(
  items: readonly T[],
): SalePayloadItem[] {
  return items.map(({ variante_id, cantidad }) => ({ variante_id, cantidad }))
}
