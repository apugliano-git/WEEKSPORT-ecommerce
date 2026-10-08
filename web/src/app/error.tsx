'use client'

export default function ErrorPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold">No pudimos cargar la página</h1>
      <p>Hubo un problema de conexión. Intentá nuevamente.</p>
      <button
        className="rounded-lg bg-[#F400A1] px-6 py-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-4"
        onClick={() => window.location.reload()}
      >
        Volver a intentar
      </button>
    </main>
  )
}
