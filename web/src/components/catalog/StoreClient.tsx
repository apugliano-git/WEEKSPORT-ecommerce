'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { HeroBanner } from './HeroBanner'
import { CategoryGrid } from './CategoryGrid'
import { CatalogClient } from './CatalogClient'

import { useSearchParams } from 'next/navigation'

interface StoreClientProps {
  productos: Producto[]
  categorias: { id: string; name: string }[]
}

export function StoreClient({ productos, categorias }: StoreClientProps) {
  const searchParams = useSearchParams()
  const defaultCategory = searchParams.get('categoria')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(defaultCategory)

  return (
    <>
      <HeroBanner />
      
      <section className="max-w-7xl w-full mx-auto self-center px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-[#0F0F12]">
        <div className="pb-24 md:pb-32">
          <CategoryGrid 
            categories={categorias}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
          />
        </div>
        
        {/* El ID catalogo es clave para el smooth scroll */}
        <div id="catalogo" className="scroll-mt-24 pb-24 md:pb-32">
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
