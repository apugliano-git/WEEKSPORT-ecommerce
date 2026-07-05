import React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 0; // Server Component dinámico

export default async function AdminDashboardPage() {
  // 1. Fetching directo a Supabase
  const { data: categoriasData } = await supabase.from('categorias').select('*')
  const categorias = categoriasData || []
  
  const categoryMap = categorias.reduce((acc, cat) => {
    acc[cat.id] = cat.nombre;
    return acc;
  }, {} as Record<string, string>);

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
  
  // Aplanamiento estructural para la tabla
  const variantRows: any[] = [];
  productos.forEach((prod: any) => {
    const prodVariants = prod.variantes_stock || [];
    prodVariants.forEach((v: any) => {
      variantRows.push({
        productoId: prod.id,
        nombre: prod.nombre,
        categoria: categoryMap[prod.categoria_id] || 'Sin categoría',
        activo: prod.activo,
        varianteId: v.id,
        talle: v.talle,
        color: v.color,
        cantidad: v.cantidad,
        precio: prod.precio, // o v.precio si estuviese desnormalizado
      });
    });
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Productos Activos</span>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span className="text-5xl font-extrabold text-white tracking-tighter">{activeProducts}</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 flex flex-col shadow-lg shadow-black/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Variantes Agotadas</span>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </div>
              <span className="text-5xl font-extrabold text-white tracking-tighter">{outOfStockVariants}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Inventario Físico - HTML Semántico y sin librerías externas */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800/50 overflow-hidden shadow-lg shadow-black/50">
          <div className="p-6 border-b border-zinc-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5C00]"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Inventario de Variantes
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Control logístico y existencias a nivel de variante física (Talle/Color).</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 text-xs text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-800/50">
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Variante</th>
                  <th className="px-6 py-4 text-center">Stock Físico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {variantRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No hay inventario registrado en la base de datos.
                    </td>
                  </tr>
                ) : (
                  variantRows.map(row => {
                    const isOutOfStock = row.cantidad === 0;
                    // Regla de Stock Crítico (RF-08)
                    const isCritical = row.cantidad > 0 && row.cantidad < 3;

                    return (
                      <tr key={row.varianteId} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">
                          {row.nombre}
                          {!row.activo && <span className="ml-2 bg-red-950 text-red-500 text-[10px] px-2 py-0.5 rounded border border-red-900/50 uppercase">Inactivo</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{row.categoria}</td>
                        <td className="px-6 py-4 text-zinc-300">
                          <span className="bg-zinc-950 px-2 py-1 rounded-md text-xs font-mono mr-2 border border-zinc-800">{row.talle}</span>
                          <span className="bg-zinc-950 px-2 py-1 rounded-md text-xs font-mono border border-zinc-800">{row.color}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            {/* Alerta Visual SVG Nativa si es crítico */}
                            {isCritical && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 animate-pulse"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            )}
                            
                            {/* Condición Lógica Declarativa (RF-08) Tailwind v4 */}
                            <span className={`font-mono text-sm px-3 py-1 rounded-full border ${
                              isOutOfStock
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 font-bold'
                                : isCritical
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 font-bold animate-pulse'
                                  : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                            }`}>
                              {row.cantidad} uds
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
