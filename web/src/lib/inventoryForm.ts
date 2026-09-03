export function resetSizesAfterCreate(currentScheme: string, sizes: string[]) {
  return currentScheme === 'estandar'
    ? { sizes, quantities: Object.fromEntries(sizes.map(size => [size, 0])) }
    : { sizes: [], quantities: {} }
}
