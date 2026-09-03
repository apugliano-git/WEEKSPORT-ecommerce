import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy } from './contentSecurityPolicy'

describe('buildContentSecurityPolicy', () => {
  it('allows eval only in development', () => {
    const development = buildContentSecurityPolicy(true, 'https://example.supabase.co')
    const production = buildContentSecurityPolicy(false, 'https://example.supabase.co')

    expect(development).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
    expect(production).toContain("script-src 'self' 'unsafe-inline'")
    expect(production).not.toContain("'unsafe-eval'")
  })
})
