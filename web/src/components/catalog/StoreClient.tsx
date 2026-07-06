'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { HeroBanner } from './HeroBanner'
import { CategoryGrid } from './CategoryGrid'
import { CatalogClient } from './CatalogClient'

interface StoreClientProps {
  productos: Producto[]
  categorias: { id: string; name: string }[]
}

export function StoreClient({ productos, categorias }: StoreClientProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  return (
    <>
      <HeroBanner />
      
      <section className="max-w-7xl w-full mx-auto self-center px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-[#0F0F12]">
        <div className="mb-24 md:mb-32">
          <CategoryGrid 
            categories={categorias}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />
        </div>
        
        {/* El ID catalogo es clave para el smooth scroll */}
        <div id="catalogo" className="scroll-mt-24 mb-24 md:mb-32">
          <CatalogClient 
            productos={productos} 
            categorias={categorias} 
            activeCategoryId={activeCategoryId} 
          />
        </div>
      </section>
    </>
  )
}
