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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {categories.slice(0, 7).map((category, index) => {
        const isActive = activeCategoryId === category.id
        const bgImage = placeholders[index % placeholders.length]
        
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

      {/* Tarjeta Promoción (Hardcodeada) */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden opacity-60 pointer-events-none bg-gradient-to-br from-[#1a0014] to-[#0a0a12]">
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="absolute top-3 right-3">
          <span className="inline-block bg-[#F400A1] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Próximamente
          </span>
        </div>

        <div className="absolute inset-0 p-4 flex items-end">
          <span className="font-display font-bold text-white uppercase tracking-wide text-left text-sm sm:text-base">
            Promoción
          </span>
        </div>
      </div>
    </div>
  )
}
