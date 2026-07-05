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
  // We expect up to 7 categories. Let's define some gradients for them.
  const gradients = [
    'from-neutral-900 to-neutral-800',
    'from-stone-900 to-stone-800',
    'from-zinc-900 to-zinc-800',
    'from-gray-900 to-gray-800',
    'from-slate-900 to-slate-800',
    'from-neutral-950 to-neutral-800',
    'from-zinc-950 to-zinc-800'
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
        const gradient = gradients[index % gradients.length]
        
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 group ${
              isActive ? 'ring-2 ring-[#F400A1]' : 'hover:ring-2 hover:ring-[#F400A1]/50 hover:scale-[1.02]'
            }`}
          >
            {/* Gradiente de fondo único por índice */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
            
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
