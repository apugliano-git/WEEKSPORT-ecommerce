import React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 0; // Server Component dinámico

export default async function AdminDashboardPage() {
  // 1. Fetching directo a Supabase
  // Join relacional hacia variantes_stock
  const { data: productosData } = await supabase
    .from('productos')
    .select(`
      *,
      variantes_stock (*)
    `)
    .order('created_at', { ascending: false })
  
  const productos = productosData || []

  // 2. Cálculo de Métricas Administrativas
  // - Conteo total de Productos Activos
  const activeProducts = productos.filter((p: any) => p.activo).length

  // - Conteo de variantes agotadas (cantidad = 0)
  const allVariants = productos.flatMap((p: any) => p.variantes_stock || [])
  const outOfStockVariants = allVariants.filter((v: any) => v.cantidad === 0).length
  return (
    <div className="space-y-10">
        
        {/* Header - Acentos tipográficos vibrantes text-[#FF5C00] */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5C00]"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Dashboard Administrativo
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">Panel de control de inventario y estado general de la tienda.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/inventario/nuevo"
              className="inline-flex items-center justify-center gap-2 bg-[#FF5C00] hover:bg-orange-600 shadow-lg shadow-[#FF5C00]/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Nuevo Artículo
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 px-5 rounded-xl border border-zinc-800 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Catálogo
            </Link>
          </div>
        </header>

        {/* Tarjetas de Métricas - Bordes ultra suavizados (rounded-2xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 flex flex-col shadow-lg shadow-black/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full z-0 pointer-events-none" />
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Productos Activos</span>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span className="text-5xl font-extrabold text-white tracking-tighter">{activeProducts}</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 flex flex-col shadow-lg shadow-black/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full z-0 pointer-events-none" />
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Variantes Agotadas</span>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </div>
              <span className="text-5xl font-extrabold text-white tracking-tighter">{outOfStockVariants}</span>
            </div>
          </div>
        </div>

        {/* Panel de Accesos Rápidos */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5C00]"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link 
              href="/admin/productos"
              className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex items-center gap-4 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
            >
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Ver Productos</span>
            </Link>
            
            <Link 
              href="/admin/inventario/nuevo"
              className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex items-center gap-4 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
            >
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Nuevo Artículo</span>
            </Link>
            
            <Link 
              href="/admin/ventas"
              className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex items-center gap-4 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
            >
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Validar Ventas</span>
            </Link>
          </div>
        </section>
    </div>
  )
}
