import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0; // Server Component dinámico

export default async function AdminDashboardPage() {
  const supabase = await createClient()

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
        
        {/* Header - Acentos tipográficos vibrantes text-[#F400A1] */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Dashboard Administrativo
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">Panel de control de inventario y estado general de la tienda.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/inventario/nuevo"
              className="inline-flex items-center justify-center gap-2 bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
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

        {/* Módulos del Sistema */}
        <section className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2 font-display">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Módulos del Sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              href="/admin/inventario/nuevo"
              className="bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/50 flex flex-col gap-4 hover:bg-white/5 hover:border-white/10 transition-all group"
            >
              <div className="p-3 bg-[#0F0F12] rounded-xl border border-white/5 w-fit group-hover:border-[#F400A1]/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">Nuevo Producto</span>
                <span className="text-sm text-gray-500 mt-1 block">Alta en el catálogo</span>
              </div>
            </Link>

            <Link 
              href="/admin/productos"
              className="bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/50 flex flex-col gap-4 hover:bg-white/5 hover:border-white/10 transition-all group"
            >
              <div className="p-3 bg-[#0F0F12] rounded-xl border border-white/5 w-fit group-hover:border-[#F400A1]/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">Productos</span>
                <span className="text-sm text-gray-500 mt-1 block">Gestión de base de datos</span>
              </div>
            </Link>
            
            <Link 
              href="/admin/stock"
              className="bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/50 flex flex-col gap-4 hover:bg-white/5 hover:border-white/10 transition-all group"
            >
              <div className="p-3 bg-[#0F0F12] rounded-xl border border-white/5 w-fit group-hover:border-[#F400A1]/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">Stock</span>
                <span className="text-sm text-gray-500 mt-1 block">Ajuste rápido de inventario</span>
              </div>
            </Link>
            
            <Link 
              href="/admin/ventas"
              className="bg-[#1A1A20] p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/50 flex flex-col gap-4 hover:bg-white/5 hover:border-white/10 transition-all group"
            >
              <div className="p-3 bg-[#0F0F12] rounded-xl border border-white/5 w-fit group-hover:border-[#F400A1]/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">Validar Ventas</span>
                <span className="text-sm text-gray-500 mt-1 block">Deducción de transacciones</span>
              </div>
            </Link>
          </div>
        </section>
    </div>
  )
}
