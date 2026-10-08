// Solo lecturas: reintentar escrituras podría duplicar operaciones.
export async function readQuery<T>(
  name: string,
  query: () => PromiseLike<{ data: T; error: { message: string } | null; status: number }>,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const { data, error, status } = await query()
    if (!error) return data
    const temporary = status === 0 || status === 408 || status === 429 || status >= 500
    console.error(`[store] ${name} failed`, { status, attempt: attempt + 1, message: error.message })
    if (!temporary || attempt === 2) {
      throw new Error(`No se pudo cargar ${name}`, { cause: error })
    }
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)))
  }
}
