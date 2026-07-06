'use client'

import React from 'react'
import { Producto } from '@/types'
import { ProductGallery } from './ProductGallery'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 lg:gap-12 items-start">
          {/* Columna Izquierda: Galería */}
          <div className="w-full">
            <ProductGallery imagenes={producto.imagenes} nombre={producto.nombre} />
          </div>

          {/* Columna Derecha: Información */}
          <div className="w-full px-4 py-6 md:p-0">
            <ProductInfo producto={producto} />
          </div>
        </div>
        
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
