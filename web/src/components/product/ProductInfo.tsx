'use client'

import React, { useState } from 'react'
import { Producto, VarianteStock } from '@/types'
import { useCart } from '@/context/CartContext'

interface ProductInfoProps {
  producto: Producto
}

export function ProductInfo({ producto }: ProductInfoProps) {
  const { addItem } = useCart()
  const variantes = producto.variantes_stock || []
  
  // Extract unique talles and colores that exist in stock combinations
  const talles = Array.from(new Set(variantes.map(v => v.talle))).filter(Boolean)
  const colores = Array.from(new Set(variantes.map(v => v.color))).filter(Boolean)
  
  // Initial selection
  const varianteInicial = variantes.find(v => v.cantidad > 0) || variantes[0]
  
  const [selectedTalle, setSelectedTalle] = useState<string>(varianteInicial?.talle || '')
  const [selectedColor, setSelectedColor] = useState<string>(varianteInicial?.color || '')
  const [quantity, setQuantity] = useState<number>(1)

  const selectedVariante = variantes.find(
    v => v.talle === selectedTalle && v.color === selectedColor
  )
  
  // Determine if out of stock
  const isOutOfStock = !selectedVariante || selectedVariante.cantidad === 0

  // Price
  const precioMostrar = selectedVariante?.precio || variantes[0]?.precio || 0

  const handleAddToCart = () => {
    if (selectedVariante && selectedVariante.cantidad > 0) {
      addItem(producto, selectedVariante, quantity)
      // Reset quantity or show toast
      setQuantity(1)
    }
  }

  const handleIncrease = () => {
    if (selectedVariante && quantity < selectedVariante.cantidad) {
      setQuantity(q => q + 1)
    }
  }

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1)
    }
  }

  return (
    <div className="flex flex-col text-white w-full max-w-lg mx-auto md:mx-0">
      
      {/* Title & Badge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-white">
            {producto.nombre}
          </h1>
        </div>
        {producto.genero && (
          <div>
            <span className="inline-block px-3 py-1 bg-white/10 text-white/80 text-xs font-semibold rounded-full uppercase tracking-wider">
              {producto.genero}
            </span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mt-4 md:mt-6">
        <span className="text-3xl md:text-4xl font-bold font-display text-[#F400A1]">
          {precioMostrar ? precioMostrar.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '---'}
        </span>
      </div>

      {/* Selectors */}
      <div className="mt-8 flex flex-col gap-6">
        
        {/* Color */}
        {colores.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-white/70 uppercase tracking-widest">Color</span>
            <div className="flex flex-wrap gap-2">
              {colores.map(color => {
                const isSelected = selectedColor === color
                const hasStockWithThisColor = variantes.some(v => v.color === color && (selectedTalle ? v.talle === selectedTalle : true) && v.cantidad > 0)
                
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color)
                      setQuantity(1) // reset qty
                    }}
                    disabled={!hasStockWithThisColor && false} // keep selectable but maybe style differently
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      isSelected 
                        ? 'border-[#F400A1] bg-[#F400A1]/10 text-white' 
                        : 'border-white/20 hover:border-white/50 text-white/80'
                    } ${!hasStockWithThisColor ? 'opacity-50 line-through' : ''}`}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Talle */}
        {talles.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/70 uppercase tracking-widest">Talle</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {talles.map(talle => {
                const isSelected = selectedTalle === talle
                const hasStockWithThisTalle = variantes.some(v => v.talle === talle && v.color === selectedColor && v.cantidad > 0)

                return (
                  <button
                    key={talle}
                    onClick={() => {
                      setSelectedTalle(talle)
                      setQuantity(1) // reset qty
                    }}
                    className={`w-12 h-12 flex items-center justify-center rounded-full border font-medium transition-all ${
                      isSelected
                        ? 'border-[#F400A1] bg-[#F400A1]/10 text-white'
                        : 'border-white/20 hover:border-white/50 text-white/80'
                    } ${!hasStockWithThisTalle ? 'opacity-30 relative after:content-[""] after:absolute after:w-full after:h-[1px] after:bg-white/50 after:-rotate-45' : ''}`}
                  >
                    {talle}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-white/70 uppercase tracking-widest">Cantidad</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-white/20 rounded-full bg-[#1A1A20] px-2 py-1">
              <button 
                onClick={handleDecrease}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button 
                onClick={handleIncrease}
                disabled={isOutOfStock || (selectedVariante && quantity >= selectedVariante.cantidad)}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-50"
              >
                +
              </button>
            </div>
            {selectedVariante && selectedVariante.cantidad > 0 && selectedVariante.cantidad <= 5 && (
              <span className="text-xs text-orange-400 font-medium tracking-wide">
                ¡Últimas {selectedVariante.cantidad} unidades!
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Botón Agregar */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`mt-8 w-full py-4 rounded-full font-bold text-base uppercase tracking-widest transition-all duration-300 ${
          isOutOfStock
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-[#F400A1] hover:bg-[#D4008B] hover:shadow-[0_0_20px_rgba(244,0,161,0.4)] text-white'
        }`}
      >
        {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
      </button>

      {/* Descripción */}
      {producto.descripcion && (
        <div className="mt-10 md:mt-12">
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-widest mb-4">
            Descripción
          </h3>
          <div className="text-white/80 font-sans text-base leading-relaxed whitespace-pre-wrap">
            {producto.descripcion}
          </div>
        </div>
      )}
    </div>
  )
}
