import { describe, expect, it } from 'vitest'
import { resetSizesAfterCreate, updateVariantQuantity } from './inventoryForm'

it('keeps stock independent for each color and size', () => {
  const green = updateVariantQuantity({}, 'Verde', 'S', 1)
  const bothGreenSizes = updateVariantQuantity(green, 'Verde', 'M', 1)
  const stock = updateVariantQuantity(bothGreenSizes, 'Rojo', 'L', 2)
  expect(stock).toEqual({ Verde: { S: 1, M: 1 }, Rojo: { L: 2 } })
  expect(bothGreenSizes).toEqual({ Verde: { S: 1, M: 1 } })
  expect(updateVariantQuantity(stock, 'Rojo', 'L', 0)).toEqual({
    Verde: { S: 1, M: 1 }, Rojo: { L: 0 },
  })
})

describe('resetSizesAfterCreate', () => {
  it('keeps loaded standard sizes but clears quantities, and clears a different scheme', () => {
    expect(resetSizesAfterCreate('estandar', ['XS', 'S'])).toEqual({
      sizes: ['XS', 'S'],
      quantities: { XS: 0, S: 0 },
    })
    expect(resetSizesAfterCreate('tops', ['85', '90'])).toEqual({
      sizes: [],
      quantities: {},
    })
  })
})
