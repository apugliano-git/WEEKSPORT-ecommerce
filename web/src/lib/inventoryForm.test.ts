import { describe, expect, it } from 'vitest'
import { resetSizesAfterCreate } from './inventoryForm'

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
