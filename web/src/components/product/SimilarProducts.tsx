'use client'

import React from 'react'
import { Producto } from '@/types'
import { ProductCard } from '@/components/catalog/ProductCard'
import Link from 'next/link'

interface SimilarProductsProps {
  similares: Producto[]
  categoriaId: string
}

export function SimilarProducts({ similares, categoriaId }: SimilarProductsProps) {
  if (!similares || similares.length === 0) return null

  return (
    <div className="flex flex-col border-t border-white/10 pt-12 md:pt-16 pb-20">
      <h2 className="text-2xl md:text-3xl font-display font-medium text-white mb-8 md:mb-12">
        También te puede interesar
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {similares.map(producto => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link 
          href={`/?categoria=${categoriaId}`}
          className="px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:border-[#F400A1] hover:text-[#F400A1] hover:bg-[#F400A1]/5 transition-all duration-300"
        >
          Ver más
        </Link>
      </div>
    </div>
  )
}
