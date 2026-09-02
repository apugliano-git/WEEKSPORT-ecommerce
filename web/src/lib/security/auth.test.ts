import { describe, expect, it } from 'vitest'
import { isAdminUser } from './auth'

describe('isAdminUser', () => {
  it('accepts only the server-controlled admin app_metadata role', () => {
    expect(isAdminUser(null)).toBe(false)
    expect(isAdminUser({ app_metadata: {} })).toBe(false)
    expect(isAdminUser({ app_metadata: { role: 'USER' } })).toBe(false)
    expect(isAdminUser({ app_metadata: { role: 'admin' } })).toBe(true)
  })
})
