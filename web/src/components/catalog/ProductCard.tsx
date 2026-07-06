'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { useCart } from '@/context/CartContext'

interface ProductCardProps {
  producto: Producto;
}

export function ProductCard({ producto }: ProductCardProps) {
  // TODO: migrar a modal de detalle de producto
  /*
  const { addItem } = useCart()
  const variantes = producto.variantes_stock || []
  const talles = Array.from(new Set(variantes.map(v => v.talle)))
  const colores = Array.from(new Set(variantes.map(v => v.color)))
  const varianteInicial = variantes.find(v => v.cantidad > 0) || variantes[0];
  const [selectedTalle, setSelectedTalle] = useState<string>(varianteInicial?.talle || '')
  const [selectedColor, setSelectedColor] = useState<string>(varianteInicial?.color || '')
  const selectedVariante = variantes.find(v => v.talle === selectedTalle && v.color === selectedColor)
  const isOutOfStock = !selectedVariante || selectedVariante.cantidad === 0;

  const handleAddToCart = () => {
    if (selectedVariante && selectedVariante.cantidad > 0) {
      addItem(producto, selectedVariante, 1)
    }
  }
  */

  // Por ahora, asumimos si hay alguna variante con stock o usamos el precio de la primera
  const precioMostrar = producto.variantes_stock?.[0]?.precio || 0;
  const isOutOfStock = !producto.variantes_stock?.some(v => v.cantidad > 0);

  return (
    <button className="flex flex-col bg-[#1A1A20] rounded-2xl overflow-hidden border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] group hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,92,0,0.15)] hover:border-white/10 transition-all duration-300 ease-out text-left w-full">
      {/* Imagen */}
      <div className="relative aspect-square bg-[#0F0F12] overflow-hidden w-full">
        {producto.imagenes[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={producto.imagenes[0]} 
            alt={producto.nombre} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs">Sin imagen</div>
        )}
        
        {/* Etiqueta de Sin Stock */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-500/95 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-extrabold px-2 py-1 rounded-full shadow-lg">
            Agotado
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium font-display text-white truncate group-hover:text-[#F400A1] transition-colors">
          {producto.nombre}
        </h3>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-base font-bold font-display text-[#F400A1]">
            {precioMostrar 
              ? precioMostrar.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) 
              : '---'}
          </span>
        </div>
      </div>
    </button>
  )
}
