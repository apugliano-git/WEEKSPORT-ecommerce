'use client'

import React, { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { procesarCheckoutWhatsApp } from '@/utils/whatsapp'

export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, removeItem, updateQuantity, totalPrice } = useCart()
  const [nombre, setNombre] = useState('')

  if (!isDrawerOpen) return null;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    procesarCheckoutWhatsApp(nombre, cart)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={closeDrawer}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[#1A1A20] shadow-2xl border-l border-white/10 transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold font-display text-white">Tu Carrito</h2>
          <button onClick={closeDrawer} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.variante_id} className="flex gap-4 bg-[#23232A] p-3 rounded-xl border border-white/5 shadow-sm">
                <div className="w-20 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {item.producto.imagenes[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.producto.imagenes[0]} 
                      alt={item.producto.nombre} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Sin img</div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 text-white">{item.producto.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.variante.talle} | {item.variante.color}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-[#1A1A20] rounded-lg px-2 py-1 border border-white/10">
                      <button 
                        onClick={() => updateQuantity(item.variante_id, item.cantidad - 1)}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        disabled={item.cantidad <= 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                      </button>
                      <span className="text-sm font-medium w-4 text-center text-white">{item.cantidad}</span>
                      <button 
                        onClick={() => updateQuantity(item.variante_id, item.cantidad + 1)}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        disabled={item.cantidad >= item.variante.cantidad}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.variante_id)}
                      className="text-red-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Form */}
        {cart.length > 0 && (
          <div className="p-4 bg-[#1A1A20] border-t border-white/10 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">Total Estimado</span>
              <span className="text-2xl font-bold font-display text-white">
                {totalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
            
            <form onSubmit={handleCheckout} className="flex flex-col gap-3">
              <div>
                <label htmlFor="nombre" className="sr-only">Tu Nombre</label>
                <input 
                  type="text" 
                  id="nombre"
                  placeholder="Ingresá tu nombre para WhatsApp..."
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] transition-shadow"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#FF5C00] hover:bg-[#E05000] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Confirmar compra
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
