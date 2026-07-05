import React from 'react'
import { supabase } from '@/lib/supabase'
import { StockManager } from '@/components/admin/StockManager'

export const revalidate = 0; // Server Component dinámico

export default async function AdminStockPage() {
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
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          Gestión de Stock
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">Ajuste rápido de cantidades para variantes individuales.</p>
      </header>
      
      <StockManager productos={productos} categorias={categorias} />
    </div>
  )
}
