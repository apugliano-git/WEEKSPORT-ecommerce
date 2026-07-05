'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { useCart } from '@/context/CartContext'

interface ProductCardProps {
  producto: Producto;
}

export function ProductCard({ producto }: ProductCardProps) {
  const { addItem } = useCart()
  const variantes = producto.variantes_stock || []
  
  // Extraer talles y colores únicos para mostrar las opciones
  const talles = Array.from(new Set(variantes.map(v => v.talle)))
  const colores = Array.from(new Set(variantes.map(v => v.color)))

  // Seleccionar por defecto la primera variante que tenga stock real (si existe)
  const varianteInicial = variantes.find(v => v.cantidad > 0) || variantes[0];

  // Estado local para la selección del usuario
  const [selectedTalle, setSelectedTalle] = useState<string>(varianteInicial?.talle || '')
  const [selectedColor, setSelectedColor] = useState<string>(varianteInicial?.color || '')

  // Encontrar la variante exacta que coincida con la selección actual
  const selectedVariante = variantes.find(v => v.talle === selectedTalle && v.color === selectedColor)
  
  // Validar el stock
  const isOutOfStock = !selectedVariante || selectedVariante.cantidad === 0;

  const handleAddToCart = () => {
    if (selectedVariante && selectedVariante.cantidad > 0) {
      addItem(producto, selectedVariante, 1)
    }
  }

  return (
    <div className="flex flex-col bg-[#1A1A20] rounded-[24px] overflow-hidden border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] group hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(255,92,0,0.15)] hover:border-white/10 transition-all duration-500 ease-out">
      {/* Imagen */}
      <div className="relative aspect-[4/5] bg-[#0F0F12] overflow-hidden">
        {producto.imagenes[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={producto.imagenes[0]} 
            alt={producto.nombre} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500">Sin imagen</div>
        )}
        
        {/* Etiqueta de Sin Stock */}
        {isOutOfStock && (
          <div className="absolute top-4 right-4 bg-red-500/95 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-extrabold px-3 py-1.5 rounded-full shadow-lg">
            Agotado
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold font-display text-white line-clamp-1 group-hover:text-[#F400A1] transition-colors">{producto.nombre}</h3>
        <p className="text-sm text-gray-400 mt-2 line-clamp-2 min-h-[40px] leading-relaxed font-light">{producto.descripcion}</p>

        {/* Selección de Variantes */}
        <div className="mt-6 space-y-5">
          {/* Selector de Talle */}
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-3">Talle</span>
            <div className="flex flex-wrap gap-2">
              {talles.map(talle => {
                const isAvailable = variantes.some(v => v.talle === talle && v.cantidad > 0)
                return (
                  <button
                    key={talle}
                    onClick={() => setSelectedTalle(talle)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      selectedTalle === talle 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110' 
                        : isAvailable 
                          ? 'bg-[#23232A] text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'bg-[#15151A] text-gray-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {talle}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-3">Color</span>
            <div className="flex flex-wrap gap-2">
              {colores.map(color => {
                const isAvailable = variantes.some(v => v.talle === selectedTalle && v.color === color && v.cantidad > 0)
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                      selectedColor === color 
                        ? 'bg-[#F400A1] text-white shadow-[0_0_15px_rgba(244,0,161,0.3)] border border-[#F400A1]' 
                        : isAvailable
                          ? 'bg-[#23232A] text-gray-300 border border-white/5 hover:border-white/20 hover:text-white'
                          : 'bg-[#15151A] text-gray-600 border border-transparent opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Precio y Acción */}
        <div className="mt-8 pt-5 border-t border-white/5 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Precio</span>
            <span className="text-2xl font-bold font-display text-white">
              {selectedVariante?.precio 
                ? selectedVariante.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) 
                : '---'}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-95 ${
              isOutOfStock
                ? 'bg-[#23232A] text-gray-600 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-110'
            }`}
            aria-label="Añadir al carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
