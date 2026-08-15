'use client'

import React from 'react'

interface Category {
  id: string
  name: string
}

interface CategoryGridProps {
  categories: Category[]
  activeCategoryId: string | null
  onSelectCategory: (id: string | null) => void
}

export function CategoryGrid({ categories, activeCategoryId, onSelectCategory }: CategoryGridProps) {
  // PLACEHOLDER: reemplazar por imágenes reales subidas por el admin
  const placeholders = [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop', // Remeras
    'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1000&auto=format&fit=crop', // Tops
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop', // Joggins/Pants
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop', // Shorts
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop', // Calzas/Leggings
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop', // Buzos
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'  // Accesorios
  ]

  const handleCategoryClick = (id: string) => {
    // If it's already active, we deselect it (return to all)
    if (activeCategoryId === id) {
      onSelectCategory(null)
    } else {
      onSelectCategory(id)
    }
    // Smooth scroll to catalog
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {categories.slice(0, 8).map((category, index) => {
          const isActive = activeCategoryId === category.id
          // Si la categoría tiene imagen guardada en BD la usará, si no usa el placeholder.
          // (Asumimos que la prop category ahora podría venir con imagen_url en el futuro cercano)
          const bgImage = (category as any).imagen_url || placeholders[index % placeholders.length]
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 group ${
                isActive ? 'ring-2 ring-[#F400A1]' : 'hover:ring-2 hover:ring-[#F400A1]/50 hover:scale-[1.02]'
              }`}
            >
              {/* Imagen de fondo */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
              
              {/* Overlay oscuro */}
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
              
              {/* Texto bottom-left */}
              <div className="absolute inset-0 p-4 flex items-end">
                <span className="font-display font-bold text-white uppercase tracking-wide text-left text-sm sm:text-base">
                  {category.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 9na Tarjeta Especial: Promociones */}
      <button
        onClick={() => handleCategoryClick('promociones')}
        className={`relative w-full h-32 sm:h-40 rounded-xl overflow-hidden transition-all duration-300 group flex items-center justify-center ${
          activeCategoryId === 'promociones' ? 'ring-2 ring-[#F400A1]' : 'hover:ring-2 hover:ring-[#F400A1]/50 hover:scale-[1.01]'
        }`}
      >
        {/* Fondo de Promociones (gradiente o imagen destacada) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2000&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F400A1]/80 to-black/70 mix-blend-multiply transition-colors group-hover:from-[#F400A1]/90" />
        
        {/* Contenido centrado */}
        <div className="relative z-10 p-4 text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#F400A1] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest">Ofertas Limitadas</span>
          </div>
          <span className="font-display font-black text-white uppercase tracking-[0.1em] text-2xl sm:text-4xl drop-shadow-lg">
            Promociones
          </span>
        </div>
      </button>
    </div>
  )
}
