'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { useCart } from '@/context/CartContext'

interface ProductCardProps {
  producto: Producto;
}

import Link from 'next/link'

export function ProductCard({ producto }: ProductCardProps) {
  const precioBase = producto.variantes_stock?.[0]?.precio || 0;
  const precioPromo = producto.precio_promocional ?? null;
  const isOutOfStock = !producto.variantes_stock?.some(v => v.cantidad > 0);

  return (
    <Link href={`/producto/${producto.id}`} className="flex flex-col bg-[#1A1A20] rounded-2xl overflow-hidden border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] group hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,92,0,0.15)] hover:border-white/10 transition-all duration-300 ease-out text-left w-full">
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
        
        {/* Badge Promoción */}
        {precioPromo && (
          <div className="absolute top-2 left-2 bg-[#F400A1] text-white text-[9px] uppercase tracking-widest font-extrabold px-2 py-1 rounded-full shadow-lg shadow-[#F400A1]/40">
            Oferta
          </div>
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
        <div className="mt-1 flex items-end justify-between gap-2">
          {precioPromo ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold font-display text-[#F400A1]">
                {precioPromo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
              <span className="text-xs text-gray-500 line-through leading-none">
                {precioBase.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
          ) : (
            <span className="text-base font-bold font-display text-[#F400A1]">
              {precioBase 
                ? precioBase.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) 
                : '---'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
