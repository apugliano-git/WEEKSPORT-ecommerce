'use client'

import React, { useMemo } from 'react'
import { Producto } from '@/types'
import { ProductCard } from './ProductCard'
import { useSearch } from '@/context/SearchContext'

interface CatalogClientProps {
  productos: Producto[];
  categorias: { id: string; name: string }[];
  activeCategoryId?: string | null;
}

export function CatalogClient({ productos, categorias, activeCategoryId = null }: CatalogClientProps) {
  const { searchQuery } = useSearch()

  const filteredProductos = useMemo(() => {
    let result = productos;
    
    if (activeCategoryId) {
      result = result.filter(p => p.categoria_id === activeCategoryId)
    }
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => p.nombre.toLowerCase().includes(query))
    }
    
    return result
  }, [productos, activeCategoryId, searchQuery])

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold mb-6 text-white tracking-tight">Nuestro Catálogo</h2>
      </div>

      {filteredProductos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-[#1A1A20] rounded-2xl border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p className="text-lg font-medium">No hay productos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProductos.map(producto => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}
