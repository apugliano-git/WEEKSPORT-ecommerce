'use client'

import React, { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CSVRow {
  'Categoría': string
  'Subcategoría': string
  'Producto': string
  'Tipo Talle': string
  'Talle': string
  'Color': string
  'Cantidad': string
  'Precio Venta': string
  'Precio Efectivo': string
  'Precio Tarjeta 1': string
  'Precio Tarjeta 2y3': string
  'Costo': string
  'Visible Catálogo': string
  'Hoja origen': string
  'Fila Excel origen': string
  'Revisar manual': string
}

type GeneroEnum = 'Hombre' | 'Mujer' | 'Unisex' | 'Niños'
type TipoTalleEnum = 'unico' | 'sin_talle' | 'tops' | 'estandar' | 'ninos' | 'colegial'

interface ProductoAgrupado {
  categoria: string
  producto: string
  tipoTalle: TipoTalleEnum
  genero: GeneroEnum
  variantes: CSVRow[]
  categoriaId: number | null
  categoriaError: boolean
}

interface Categoria {
  id: number
  nombre: string
}

type Step = 'idle' | 'review' | 'importing' | 'done'

interface ImportSummary {
  productosCreados: number
  variantesCreadas: number
  variantesActualizadas: number
  errores: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}

function normalizeNombre(s: string): string {
  return s.trim().toLowerCase()
}

function detectarGenero(nombre: string): GeneroEnum {
  if (/\(ni[ñn]os?\)/i.test(nombre)) return 'Niños'
  return 'Unisex'
}

function normalizeTipoTalle(raw: string): TipoTalleEnum {
  const map: Record<string, TipoTalleEnum> = {
    'unico': 'unico',
    'único': 'unico',
    'sin_talle': 'sin_talle',
    'sin talle': 'sin_talle',
    'tops': 'tops',
    'estandar': 'estandar',
    'estándar': 'estandar',
    'ninos': 'ninos',
    'niños': 'ninos',
    'colegial': 'colegial',
  }
  return map[raw.trim().toLowerCase()] ?? 'estandar'
}

// ─── StatCard helper ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  alert,
  warn,
}: {
  label: string
  value: number
  alert?: boolean
  warn?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col shadow-lg shadow-black/40 ${
      alert
        ? 'bg-red-500/10 border-red-500/30'
        : warn
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-[#1A1A20] border-white/5'
    }`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
        alert ? 'text-red-400' : warn ? 'text-amber-400' : 'text-zinc-500'
      }`}>{label}</span>
      <span className={`text-3xl font-extrabold tracking-tighter ${
        alert ? 'text-red-300' : warn ? 'text-amber-300' : 'text-white'
      }`}>{value.toLocaleString('es-AR')}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImportarStockPage() {
  const [step, setStep] = useState<Step>('idle')
  const [productos, setProductos] = useState<ProductoAgrupado[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [filasPorRevisar, setFilasPorRevisar] = useState(0)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ── Fetch categorías reales ───────────────────────────────────────────────
  const fetchCategorias = useCallback(async (): Promise<Categoria[]> => {
    const { data, error } = await supabase.from('categorias').select('id, nombre')
    if (error) throw error
    return data ?? []
  }, [supabase])

  // ── Parseo del CSV ────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setParseError(null)
    setProductos([])
    setFilasPorRevisar(0)

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('El archivo debe ser un CSV (.csv).')
      return
    }

    let cats: Categoria[] = []
    try {
      cats = await fetchCategorias()
      setCategorias(cats)
    } catch {
      setParseError('No se pudieron cargar las categorías desde la base de datos.')
      return
    }

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`Error al parsear el CSV: ${results.errors[0].message}`)
          return
        }

        const rows = results.data as CSVRow[]

        if (rows.length === 0) {
          setParseError('El CSV no contiene filas de datos.')
          return
        }

        // Validar columnas requeridas
        const required = [
          'Categoría', 'Producto', 'Tipo Talle', 'Talle', 'Color',
          'Cantidad', 'Precio Venta', 'Precio Efectivo', 'Precio Tarjeta 1',
          'Precio Tarjeta 2y3', 'Visible Catálogo',
        ]
        const headers = Object.keys(rows[0])
        const missing = required.filter(col => !headers.includes(col))
        if (missing.length > 0) {
          setParseError(`Columnas faltantes en el CSV: ${missing.join(', ')}`)
          return
        }

        // Contar filas con "Revisar manual"
        const conRevisar = rows.filter(r => (r['Revisar manual'] ?? '').trim() !== '').length
        setFilasPorRevisar(conRevisar)

        // Agrupar por (Categoría, Producto)
        const catMap = new Map(cats.map(c => [normalizeNombre(c.nombre), c]))
        const grupos = new Map<string, ProductoAgrupado>()

        for (const row of rows) {
          const cat = (row['Categoría'] ?? '').trim()
          const prod = (row['Producto'] ?? '').trim()
          const key = `${cat}__${prod}`
          if (!grupos.has(key)) {
            const catMatch = catMap.get(normalizeNombre(cat))
            grupos.set(key, {
              categoria: cat,
              producto: prod,
              tipoTalle: normalizeTipoTalle(row['Tipo Talle'] ?? ''),
              genero: detectarGenero(prod),
              variantes: [],
              categoriaId: catMatch?.id ?? null,
              categoriaError: !catMatch,
            })
          }
          grupos.get(key)!.variantes.push(row)
        }

        setProductos(Array.from(grupos.values()))
        setStep('review')
      },
      error: (err: Error) => {
        setParseError(`Error al leer el archivo: ${err.message}`)
      },
    })
  }, [fetchCategorias])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const updateGenero = (idx: number, genero: GeneroEnum) => {
    setProductos(prev => prev.map((p, i) => i === idx ? { ...p, genero } : p))
  }

  const hayErrores = productos.some(p => p.categoriaError)

  // ── IMPORTACIÓN REAL ──────────────────────────────────────────────────────
  const handleImport = async () => {
    setStep('importing')
    setProgress({ done: 0, total: productos.length })

    let productosCreados = 0
    let variantesCreadas = 0
    let variantesActualizadas = 0
    const errores: string[] = []

    for (let i = 0; i < productos.length; i++) {
      const grupo = productos[i]

      try {
        // 1. Buscar si ya existe el producto
        const { data: existente, error: buscarError } = await supabase
          .from('productos')
          .select('id, variantes_stock(talle, color)')
          .eq('nombre', grupo.producto)
          .eq('categoria_id', grupo.categoriaId!)
          .maybeSingle()

        if (buscarError) throw buscarError

        let productoId: string
        const variantesExistentes = new Set<string>()

        if (existente) {
          productoId = existente.id
          if (existente.variantes_stock) {
            existente.variantes_stock.forEach((v: any) => {
              variantesExistentes.add(`${(v.talle ?? '').trim()}__${(v.color ?? '').trim()}`)
            })
          }
        } else {
          const { data: nuevo, error: insertError } = await supabase
            .from('productos')
            .insert({
              nombre: grupo.producto,
              descripcion: '',
              categoria_id: grupo.categoriaId,
              genero: grupo.genero,
              tipo_talle: grupo.tipoTalle,
              imagenes: [],
              activo: true,
            })
            .select('id')
            .single()

          if (insertError) throw insertError
          productoId = nuevo.id
          productosCreados++
        }

        // 2. Insertar o actualizar variantes en lotes de 50
        let creadasEnEsteProducto = 0
        let actualizadasEnEsteProducto = 0

        const variantesPayload = grupo.variantes.map(row => {
          const talle = (row['Talle'] ?? '').trim()
          const color = (row['Color'] ?? '').trim()
          
          if (variantesExistentes.has(`${talle}__${color}`)) {
            actualizadasEnEsteProducto++
          } else {
            creadasEnEsteProducto++
          }

          return {
            producto_id: productoId,
            talle,
            color,
            cantidad: parseInt(row['Cantidad'] ?? '0', 10) || 0,
            precio: parseNum(row['Precio Venta']),
            precio_efectivo: parseNum(row['Precio Efectivo']),
            precio_tarjeta1: parseNum(row['Precio Tarjeta 1']),
            precio_tarjeta2y3: parseNum(row['Precio Tarjeta 2y3']),
            visible_en_catalogo: (row['Visible Catálogo'] ?? '').trim().toLowerCase() === 'true',
          }
        })

        const BATCH = 50
        for (let b = 0; b < variantesPayload.length; b += BATCH) {
          const lote = variantesPayload.slice(b, b + BATCH)
          const { error: varError } = await supabase
            .from('variantes_stock')
            .upsert(lote, { onConflict: 'producto_id,talle,color' })
            
          if (varError) throw varError
        }
        variantesCreadas += creadasEnEsteProducto
        variantesActualizadas += actualizadasEnEsteProducto

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err)
        errores.push(`[${grupo.categoria} / ${grupo.producto}]: ${msg}`)
      }

      setProgress({ done: i + 1, total: productos.length })
    }

    setSummary({ productosCreados, variantesCreadas, variantesActualizadas, errores })
    setStep('done')
  }

  const handleReset = () => {
    setStep('idle')
    setProductos([])
    setCategorias([])
    setParseError(null)
    setFilasPorRevisar(0)
    setProgress({ done: 0, total: 0 })
    setSummary(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const totalVariantes = productos.reduce((s, p) => s + p.variantes.length, 0)
  const pct = progress.total > 0 ? Math.round(100 * progress.done / progress.total) : 0
  const circumference = 2 * Math.PI * 34

  // ─── UI ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" className="text-[#F400A1]">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            Importar Stock Masivo
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Cargá un CSV con el formato estándar. Revisá antes de confirmar — nada se escribe sin tu aprobación.
          </p>
        </div>
        {step !== 'idle' && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-4 rounded-xl border border-zinc-800 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Nueva importación
          </button>
        )}
      </header>

      {/* ── PASO 1: Carga ─────────────────────────────────────────────────── */}
      {step === 'idle' && (
        <section className="space-y-6">
          <div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'relative flex flex-col items-center justify-center gap-4 cursor-pointer',
              'rounded-2xl border-2 border-dashed p-16 transition-all duration-200',
              isDragging
                ? 'border-[#F400A1] bg-[#F400A1]/5 scale-[1.01]'
                : 'border-zinc-700 bg-[#1A1A20] hover:border-zinc-500 hover:bg-zinc-900/60',
            ].join(' ')}
          >
            <div className={`p-4 rounded-2xl border transition-colors ${isDragging ? 'border-[#F400A1]/40 bg-[#F400A1]/10' : 'border-zinc-700 bg-zinc-900'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                strokeLinejoin="round" className={isDragging ? 'text-[#F400A1]' : 'text-zinc-400'}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Arrastrá tu CSV aquí</p>
              <p className="text-zinc-500 text-sm mt-1">o hacé clic para seleccionar el archivo</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Categoría', 'Producto', 'Tipo Talle', 'Talle', 'Color', 'Cantidad', 'Precio Venta', '...'].map(col => (
                <span key={col} className="text-[10px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  {col}
                </span>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleInputChange}
              id="csv-upload"
            />
          </div>

          {parseError && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-red-400 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-300 text-sm">{parseError}</p>
            </div>
          )}

          {/* Tabla de formato esperado */}
          <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-6 space-y-3">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Formato esperado del CSV</h2>
            <div className="overflow-x-auto">
              <table className="text-xs text-zinc-500 font-mono w-full border-collapse">
                <thead>
                  <tr>
                    {['Categoría','Subcategoría','Producto','Tipo Talle','Talle','Color','Cantidad',
                      'Precio Venta','Precio Efectivo','Precio Tarjeta 1','Precio Tarjeta 2y3',
                      'Costo','Visible Catálogo','Hoja origen','Fila Excel origen','Revisar manual'].map(col => (
                      <th key={col} className="text-left p-2 border-b border-zinc-800 whitespace-nowrap text-zinc-400">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {['Remeras','Básicas','Remera Básica Lisa','tops','S','Blanco','5',
                      '12000','10000','13000','14000','7000','True','Stock','2',''].map((v, i) => (
                      <td key={i} className="p-2 text-zinc-600 whitespace-nowrap">{v || <span className="italic opacity-40">vacío</span>}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-600">
              <strong className="text-zinc-500">Visible Catálogo</strong> debe ser <code className="bg-zinc-900 px-1 rounded">True</code> o <code className="bg-zinc-900 px-1 rounded">False</code>.
              &nbsp;El campo <strong className="text-zinc-500">Revisar manual</strong> es solo informativo.
            </p>
          </div>
        </section>
      )}

      {/* ── PASO 2: Revisión ──────────────────────────────────────────────── */}
      {step === 'review' && (
        <section className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Productos únicos" value={productos.length} />
            <StatCard label="Total variantes" value={totalVariantes} />
            <StatCard label="Cat. sin matchear" value={productos.filter(p => p.categoriaError).length} alert={hayErrores} />
            <StatCard label="Filas por revisar" value={filasPorRevisar} warn={filasPorRevisar > 0} />
          </div>

          {/* Advertencia revisión manual */}
          {filasPorRevisar > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-amber-400 mt-0.5 shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-amber-300 text-sm">
                <strong>{filasPorRevisar} filas</strong> del CSV tienen contenido en la columna &quot;Revisar manual&quot;.
                Serán importadas igual — revisalas manualmente luego si es necesario.
              </p>
            </div>
          )}

          {/* Error categorías sin match */}
          {hayErrores && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 rounded-xl p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-red-400 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="text-red-300 text-sm font-semibold">
                  Hay categorías del CSV que no existen en la base de datos.
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  Categorías disponibles: <span className="text-red-300/80">{categorias.map(c => c.nombre).join(', ')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Tabla de revisión */}
          <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Productos detectados</h2>
              <span className="text-xs text-zinc-500">{productos.length} productos · {totalVariantes} variantes</span>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#1A1A20] sticky top-0 z-10">
                    <th className="text-left p-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Categoría</th>
                    <th className="text-left p-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Producto</th>
                    <th className="text-left p-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Tipo Talle</th>
                    <th className="text-center p-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Variantes</th>
                    <th className="text-left p-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Género</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-white/5 transition-colors ${
                        prod.categoriaError
                          ? 'bg-red-500/10 hover:bg-red-500/15'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {prod.categoriaError && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round" className="text-red-400 shrink-0">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          )}
                          <span className={prod.categoriaError ? 'text-red-300 font-medium' : 'text-white'}>
                            {prod.categoria}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-zinc-200 max-w-[220px] truncate" title={prod.producto}>
                        {prod.producto}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                          {prod.tipoTalle}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-bold text-xs">
                          {prod.variantes.length}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={prod.genero}
                          onChange={e => updateGenero(idx, e.target.value as GeneroEnum)}
                          id={`genero-select-${idx}`}
                          className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F400A1] transition-all"
                        >
                          <option value="Unisex">Unisex</option>
                          <option value="Hombre">Hombre</option>
                          <option value="Mujer">Mujer</option>
                          <option value="Niños">Niños</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón confirmar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <p className="text-zinc-500 text-sm">
              {hayErrores
                ? 'Resolvé las categorías sin matchear antes de importar.'
                : `Todo listo. Se crearán hasta ${productos.length} productos y ${totalVariantes} variantes.`}
            </p>
            <button
              onClick={handleImport}
              disabled={hayErrores}
              id="btn-confirmar-importar"
              className={[
                'inline-flex items-center gap-2 font-semibold py-3 px-6 rounded-xl transition-all text-sm shrink-0',
                hayErrores
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20 text-white cursor-pointer',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Confirmar e importar
            </button>
          </div>
        </section>
      )}

      {/* ── PASO 3: Importando ────────────────────────────────────────────── */}
      {step === 'importing' && (
        <section className="space-y-8">
          <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-12 flex flex-col items-center gap-6">
            {/* Círculo de progreso SVG */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#2A2A35" strokeWidth="6"/>
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#F400A1" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * pct / 100} ${circumference}`}
                  style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                {pct}%
              </span>
            </div>

            <div className="text-center">
              <p className="text-white font-semibold text-xl">Importando...</p>
              <p className="text-zinc-400 text-sm mt-1">
                {progress.done} de {progress.total} productos procesados
              </p>
            </div>

            {/* Barra lineal */}
            <div className="w-full max-w-sm bg-zinc-900 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-[#F400A1] rounded-full"
                style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
              />
            </div>

            <p className="text-zinc-600 text-xs">No cerrés esta pestaña durante la importación.</p>
          </div>
        </section>
      )}

      {/* ── PASO 4: Resumen final ─────────────────────────────────────────── */}
      {step === 'done' && summary && (
        <section className="space-y-6">
          {/* Banner resultado */}
          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
            summary.errores.length === 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            {summary.errores.length === 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="text-amber-400 mt-0.5 shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
            <div>
              <p className={`font-semibold ${summary.errores.length === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {summary.errores.length === 0
                  ? 'Importación completada sin errores'
                  : `Importación completada con ${summary.errores.length} error${summary.errores.length > 1 ? 'es' : ''}`}
              </p>
              <p className={`text-sm mt-1 ${summary.errores.length === 0 ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
                {summary.errores.length > 0
                  ? 'Los productos con error no fueron modificados. Podés reintentar desde cero o corregir manualmente.'
                  : 'Todos los productos y variantes fueron insertados correctamente.'}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Productos creados" value={summary.productosCreados} />
            <StatCard label="Variantes creadas" value={summary.variantesCreadas} />
            <StatCard label="Actualizadas" value={summary.variantesActualizadas} />
            <StatCard label="Errores" value={summary.errores.length} alert={summary.errores.length > 0} />
          </div>

          {/* Lista errores */}
          {summary.errores.length > 0 && (
            <div className="bg-[#1A1A20] rounded-2xl border border-red-500/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="text-red-400">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3 className="text-sm font-bold text-white">Detalle de errores</h3>
                <span className="text-xs text-zinc-600 ml-auto">{summary.errores.length} error{summary.errores.length > 1 ? 'es' : ''}</span>
              </div>
              <ul className="divide-y divide-white/5" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {summary.errores.map((err, i) => (
                  <li key={i} className="px-5 py-3 text-xs text-red-300 font-mono">{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 px-5 rounded-xl border border-zinc-800 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Nueva importación
            </button>
            <a
              href="/admin/stock"
              className="inline-flex items-center gap-2 bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
              Ver stock
            </a>
          </div>
        </section>
      )}
    </div>
  )
}
