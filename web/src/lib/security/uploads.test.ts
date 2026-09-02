import { describe, expect, it } from 'vitest'
import { validateImageUpload } from './uploads'

describe('validateImageUpload', () => {
  it('rejects empty, oversized, and SVG files', () => {
    expect(validateImageUpload(new File([], 'empty.png', { type: 'image/png' })).ok).toBe(false)
    expect(validateImageUpload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })).ok).toBe(false)
    expect(validateImageUpload(new File(['<svg/>'], 'avatar.svg', { type: 'image/svg+xml' })).ok).toBe(false)
  })

  it('accepts the four raster formats and derives the extension from MIME', () => {
    const cases = [
      ['photo.jpeg', 'image/jpeg', 'jpg'],
      ['photo.jpg', 'image/png', 'png'],
      ['photo.exe', 'image/webp', 'webp'],
      ['photo.svg', 'image/avif', 'avif'],
    ] as const

    for (const [name, type, extension] of cases) {
      const result = validateImageUpload(new File(['pixels'], name, { type }))
      expect(result).toEqual({ ok: true, extension })
    }
  })
})
