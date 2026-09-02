'use client'

import React, { useState } from 'react'
import { Producto } from '@/types'
import { HeroBanner } from './HeroBanner'
import type { Slide } from './HeroBanner'
import { CategoryGrid } from './CategoryGrid'
import { CatalogClient } from './CatalogClient'

import { useSearchParams } from 'next/navigation'

interface StoreClientProps {
  productos: Producto[]
  categorias: { id: string; name: string; imagen_url?: string }[]
  config?: {
    hero_titulo?: string | null
    hero_subtitulo?: string | null
    hero_descripcion?: string | null
    hero_imagen_url?: string | null
    hero_imagen_url_mobile?: string | null
    hero_imagen_posicion_mobile?: number | null
    hero_imagen_posicion_y_desktop?: number | null
    hero_imagen_posicion_y_mobile?: number | null
    hero_slides?: Slide[] | null
  } | null
}

export function StoreClient({ productos, categorias, config }: StoreClientProps) {
  const searchParams = useSearchParams()
  const defaultCategory = searchParams.get('categoria')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(defaultCategory)

  return (
    <>
      <HeroBanner 
        heroTitulo={config?.hero_titulo ?? undefined}
        heroSubtitulo={config?.hero_subtitulo ?? undefined}
        heroDescripcion={config?.hero_descripcion ?? undefined}
        heroImagenUrl={config?.hero_imagen_url ?? undefined}
        heroImagenUrlMobile={config?.hero_imagen_url_mobile ?? undefined}
        heroImagenPosicionMobile={config?.hero_imagen_posicion_mobile ?? undefined}
        heroImagenPosicionYDesktop={config?.hero_imagen_posicion_y_desktop ?? undefined}
        heroImagenPosicionYMobile={config?.hero_imagen_posicion_y_mobile ?? undefined}
        heroSlides={config?.hero_slides ?? undefined}
      />
      
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
            activeCategoryId={activeCategoryId} 
          />
        </div>
      </section>
    </>
  )
}
