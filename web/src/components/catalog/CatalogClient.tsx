'use client'

import React, { useState, useMemo } from 'react'
import { Producto } from '@/types'
import { CategoryFilter } from './CategoryFilter'
import { ProductCard } from './ProductCard'

interface CatalogClientProps {
  productos: Producto[];
  categorias: { id: string; name: string }[];
}

export function CatalogClient({ productos, categorias }: CatalogClientProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const filteredProductos = useMemo(() => {
    if (!activeCategoryId) return productos;
    return productos.filter(p => p.categoria_id === activeCategoryId)
  }, [productos, activeCategoryId])

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold mb-6 text-white tracking-tight">Nuestro Catálogo</h2>
        <CategoryFilter 
          categories={categorias} 
          activeCategoryId={activeCategoryId} 
          onSelectCategory={setActiveCategoryId} 
        />
      </div>

      {filteredProductos.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-[#1A1A20] rounded-2xl border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p className="text-lg font-medium">No hay productos disponibles en esta categoría.</p>
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
