import React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ProductTable } from '@/components/admin/ProductTable'
import { Producto, Categoria } from '@/types'

export const revalidate = 0; // Evitar caché estática

export default async function AdminPage() {
  // 0. Obtener Datos desde Supabase
  const { data: categoriasData } = await supabase.from('categorias').select('*')
  const categorias: Categoria[] = categoriasData || []

  const { data: productosData } = await supabase
    .from('productos')
    .select(`
      *,
      variantes_stock (*)
    `)
    .order('created_at', { ascending: false })
  
  const productos: Producto[] = productosData || []

  // 1. Productos Activos
  const activeProducts = productos.filter(p => p.activo).length

  // 2. Productos Sin Stock (la suma de cantidades de todas sus variantes es 0, o no tiene variantes)
  const outOfStockProducts = productos.filter(p => {
    const variants = p.variantes_stock || []
    if (variants.length === 0) return true
    const totalStock = variants.reduce((sum, v) => sum + v.cantidad, 0)
    return totalStock === 0
  }).length

  // 3. Variantes en Stock Crítico (cantidad > 0 y cantidad < 3)
  const criticalStockVariants = productos.flatMap(p => p.variantes_stock || [])
    .filter(v => v.cantidad > 0 && v.cantidad < 3).length

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold font-display text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-gray-400 mt-2">
            Visualización en tiempo real del inventario y las métricas clave de WEEKSPORT.
          </p>
        </div>
        <div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-[#23232A] hover:bg-[#2D2D35] text-white font-bold py-3 px-6 rounded-xl border border-white/5 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver al catálogo
          </Link>
        </div>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Productos Activos */}
        <div className="relative overflow-hidden bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Productos Activos</span>
            <span className="text-3xl font-bold font-display text-white mt-1 block">{activeProducts}</span>
          </div>
        </div>

        {/* Productos Sin Stock */}
        <div className="relative overflow-hidden bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-500" />
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Productos Sin Stock</span>
            <span className="text-3xl font-bold font-display text-white mt-1 block">{outOfStockProducts}</span>
          </div>
        </div>

        {/* Variantes en Stock Crítico */}
        <div className="relative overflow-hidden bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5C00]/5 rounded-full blur-2xl group-hover:bg-[#FF5C00]/10 transition-colors duration-500" />
          <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/10 flex items-center justify-center text-[#FF5C00] border border-[#FF5C00]/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Variantes Stock Crítico</span>
            <span className="text-3xl font-bold font-display text-white mt-1 block">{criticalStockVariants}</span>
          </div>
        </div>

      </div>

      {/* Tabla del Inventario */}
      <ProductTable productos={productos} categorias={categorias} />
    </main>
  )
}
