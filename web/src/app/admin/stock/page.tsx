import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StockManager } from '@/components/admin/StockManager'

export const revalidate = 0; // Server Component dinámico

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  
  const params = await searchParams
  const buscar = typeof params.buscar === 'string' ? params.buscar : ''

  // Fetch de categorías
  const { data: categoriasData } = await supabase.from('categorias').select('*')
  const categorias = categoriasData || []

  // Fetch de productos con join a variantes_stock
  const { data: productosData } = await supabase
    .from('productos')
    .select(`
      *,
      variantes_stock (*)
    `)
    .order('created_at', { ascending: false })
  
  const productos = productosData || []

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            Gestión de Stock
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Ajuste rápido de cantidades para variantes individuales.</p>
        </div>
        <Link 
          href="/admin/stock/importar"
          className="inline-flex items-center justify-center gap-2 bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          Importar CSV
        </Link>
      </header>
      
      <StockManager productos={productos} categorias={categorias} initialSearch={buscar} />
    </div>
  )
}
