import { describe, expect, it } from 'vitest'
import { isCronRequestAuthorized } from './cron'

describe('isCronRequestAuthorized', () => {
  it('fails closed when the configured secret is absent', () => {
    expect(isCronRequestAuthorized('Bearer anything', undefined)).toBe(false)
    expect(isCronRequestAuthorized(null, '')).toBe(false)
  })

  it('requires an exact Bearer header', () => {
    expect(isCronRequestAuthorized('Bearer secret', 'secret')).toBe(true)
    expect(isCronRequestAuthorized('bearer secret', 'secret')).toBe(false)
    expect(isCronRequestAuthorized('Bearer secret-extra', 'secret')).toBe(false)
  })
})
