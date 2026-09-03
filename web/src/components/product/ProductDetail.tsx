'use client'

import React from 'react'
import { Producto } from '@/types'
import { ProductInfo } from './ProductInfo'
import { SimilarProducts } from './SimilarProducts'

interface ProductDetailProps {
  producto: Producto
  similares: Producto[]
}

export function ProductDetail({ producto, similares }: ProductDetailProps) {
  return (
    <div className="flex-1 w-full flex flex-col bg-[#0F0F12]">
      <section className="max-w-7xl w-full mx-auto self-center px-0 md:px-6 lg:px-8 py-0 md:py-12">
        <ProductInfo producto={producto} />
        
        {/* Productos Similares: Ancho completo debajo */}
        {similares.length > 0 && (
          <div className="mt-12 md:mt-24 w-full px-4 md:px-0">
            <SimilarProducts similares={similares} categoriaId={producto.categoria_id} />
          </div>
        )}
      </section>
    </div>
  )
}
