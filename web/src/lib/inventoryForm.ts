export function resetSizesAfterCreate(currentScheme: string, sizes: string[]) {
  return currentScheme === 'estandar'
    ? { sizes, quantities: Object.fromEntries(sizes.map(size => [size, 0])) }
    : { sizes: [], quantities: {} }
}
export type StockByColor = Record<string, Record<string, number>>

export function updateVariantQuantity(stock: StockByColor, color: string, size: string, quantity: number): StockByColor {
  return { ...stock, [color]: { ...stock[color], [size]: quantity } }
}
