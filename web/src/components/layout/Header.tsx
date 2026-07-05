'use client'

import React from 'react'
import { useCart } from '@/context/CartContext'

export function Header() {
  const { totalItems, openDrawer } = useCart()

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0F0F12]/80 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-display tracking-tight">
            <span className="text-[#F400A1]">WEEK</span>SPORT
          </span>
        </div>
        
        <button 
          onClick={openDrawer}
          className="relative p-2 text-white hover:text-[#F400A1] transition-colors focus:outline-none"
          aria-label="Abrir carrito"
        >
          {/* Shopping Cart Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#F400A1] rounded-full transform translate-x-1 -translate-y-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
