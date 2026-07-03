'use client'

import React from 'react'

interface CategoryFilterProps {
  categories: { id: string; name: string }[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryFilter({ categories, activeCategoryId, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectCategory(null)}
        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
          activeCategoryId === null 
            ? 'bg-[#FF5C00] text-white shadow-[0_0_15px_rgba(255,92,0,0.3)]' 
            : 'bg-[#23232A] text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
        }`}
      >
        Todas
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeCategoryId === cat.id 
              ? 'bg-[#FF5C00] text-white shadow-[0_0_15px_rgba(255,92,0,0.3)]' 
              : 'bg-[#23232A] text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
