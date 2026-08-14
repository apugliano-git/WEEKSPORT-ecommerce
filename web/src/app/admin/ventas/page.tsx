import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { VentasManager } from '@/components/admin/VentasManager'

export const revalidate = 0; // Server Component dinámico

export default async function AdminVentasPage() {
  const supabase = await createClient()
  
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
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M20 6 9 17l-5-5"/></svg>
            Validar Ventas
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Deducción de transacciones e historial.</p>
        </div>
      </header>
      
      <VentasManager productos={productos} categorias={categorias} />
    </div>
  )
}
