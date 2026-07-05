'use client'

import React from 'react'

interface HeroBannerProps {
  imageUrl?: string
}

export function HeroBanner({ imageUrl }: HeroBannerProps) {
  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative w-full h-[65vh] min-h-[480px] max-h-[720px] overflow-hidden bg-gradient-to-br from-[#1a0014] via-[#0F0F12] to-[#0a0a12] border-b border-white/5 flex flex-col justify-end">
      {/* Glow blob fucsia blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F400A1]/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Background Image (if any) or Placeholder */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'})` }}
      />
      {/* PLACEHOLDER: reemplazar por imagen real subida por el admin */}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12]/90 via-[#0F0F12]/60 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#F400A1] animate-pulse" />
          Nueva Colección
        </div>
        <h1 className="text-5xl sm:text-7xl font-black font-display text-white uppercase tracking-[0.12em] mb-4 leading-tight">
          Rendimiento en cada <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F400A1] to-white">
            movimiento
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl font-light leading-relaxed mb-8">
          Indumentaria de barrio diseñada para entrenar sin límites. Elevá tu potencial con calzas, tops y remeras de calidad premium.
        </p>
        <button 
          onClick={scrollToCatalog}
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#F400A1] hover:bg-[#D000A0] text-white font-bold rounded-full transition-colors"
        >
          Ver Catálogo
        </button>
      </div>
    </section>
  )
}
