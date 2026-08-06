import React from 'react'
import Link from 'next/link'
import { obtenerMetricasInventario, obtenerVentasRecientes } from '@/lib/dashboardService'
import { UltimasVentas } from '@/components/admin/UltimasVentas'

export const revalidate = 0; // Server Component dinámico

export default async function AdminDashboardPage() {
  const metricas = await obtenerMetricasInventario();
  const ventasRecientes = await obtenerVentasRecientes(5);
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
        <section className="flex flex-col gap-4 mt-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2 font-display">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Métricas del Mes
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#1A1A20] p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col shadow-lg shadow-black/50">
              <span className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Productos Activos</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter">{metricas.productosActivos}</span>
            </div>
            
            <div className={`bg-[#1A1A20] p-4 sm:p-6 rounded-2xl border flex flex-col shadow-lg shadow-black/50 transition-colors ${metricas.productosSinStock > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 ${metricas.productosSinStock > 0 ? 'text-red-400' : 'text-zinc-500'}`}>Productos sin stock</span>
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tighter ${metricas.productosSinStock > 0 ? 'text-red-400' : 'text-white'}`}>{metricas.productosSinStock}</span>
            </div>

            <div className={`bg-[#1A1A20] p-4 sm:p-6 rounded-2xl border flex flex-col shadow-lg shadow-black/50 transition-colors ${metricas.variantesCriticas > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'}`}>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 ${metricas.variantesCriticas > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>Variantes Críticas (&lt;3)</span>
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tighter ${metricas.variantesCriticas > 0 ? 'text-amber-400' : 'text-white'}`}>{metricas.variantesCriticas}</span>
            </div>

            <div className="bg-[#1A1A20] p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col shadow-lg shadow-black/50">
              <span className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Ventas del Mes</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter">{metricas.ventasDelMes}</span>
            </div>
          </div>
        </section>

        {/* Últimas ventas */}
        <section className="flex flex-col gap-4 mt-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2 font-display">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
            Últimas Ventas
          </h2>
          <UltimasVentas ventas={ventasRecientes} />
        </section>

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
