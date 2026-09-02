const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const

export type ImageExtension = (typeof IMAGE_EXTENSIONS)[keyof typeof IMAGE_EXTENSIONS]

export type ImageUploadValidation =
  | { ok: true; extension: ImageExtension }
  | { ok: false; error: string }

export function validateImageUpload(file: File): ImageUploadValidation {
  if (file.size === 0) {
    return { ok: false, error: 'La imagen no puede estar vacía.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: 'El archivo excede el límite de 5 MB permitidos.' }
  }
  const extension = IMAGE_EXTENSIONS[file.type as keyof typeof IMAGE_EXTENSIONS]
  if (!extension) {
    return { ok: false, error: 'Formato de imagen no permitido. Usá JPEG, PNG, WebP o AVIF.' }
  }
  return { ok: true, extension }
}
