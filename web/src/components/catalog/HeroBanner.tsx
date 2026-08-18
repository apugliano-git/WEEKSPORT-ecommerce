'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export type Slide = {
  id: string;
  desktop_url: string;
  mobile_url: string;
  pos_y_desktop: number;
  pos_y_mobile: number;
  pos_x_mobile: number;
}

interface HeroBannerProps {
  heroTitulo?: string
  heroSubtitulo?: string
  heroDescripcion?: string
  heroSlides?: Slide[]
  
  // Legacy
  heroImagenUrl?: string
  heroImagenUrlMobile?: string
  heroImagenPosicionMobile?: number
  heroImagenPosicionYDesktop?: number
  heroImagenPosicionYMobile?: number
}

export function HeroBanner({ 
  heroTitulo, 
  heroSubtitulo, 
  heroDescripcion, 
  heroSlides = [],
  // Legacy
  heroImagenUrl,
  heroImagenUrlMobile,
  heroImagenPosicionMobile = 50,
  heroImagenPosicionYDesktop = 50,
  heroImagenPosicionYMobile = 50
}: HeroBannerProps) {
  
  // Embla setup (loop infinito y autoplay cada 30seg)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 30000, stopOnInteraction: false })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  // Normalizar slides: Si no hay heroSlides pero sí hay legacy, creamos un array con un slide. Si no, default genérico.
  const displaySlides: Slide[] = heroSlides && heroSlides.length > 0 ? heroSlides : [
    {
      id: 'legacy-or-default',
      desktop_url: heroImagenUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
      mobile_url: heroImagenUrlMobile || heroImagenUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
      pos_y_desktop: heroImagenPosicionYDesktop,
      pos_y_mobile: heroImagenPosicionYMobile,
      pos_x_mobile: heroImagenPosicionMobile
    }
  ]

  return (
    <section className="relative w-full h-[65vh] min-h-[480px] max-h-[720px] overflow-hidden bg-gradient-to-br from-[#1a0014] via-[#0F0F12] to-[#0a0a12] border-b border-white/5 flex flex-col justify-end group">
      {/* Glow blob fucsia blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F400A1]/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Carrusel - Embla */}
      <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {displaySlides.map((slide) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              {/* Background Image - Desktop */}
              <div 
                className="absolute inset-0 bg-cover hidden md:block"
                style={{ 
                  backgroundImage: `url(${slide.desktop_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'})`,
                  backgroundPosition: `center ${slide.pos_y_desktop ?? 50}%` 
                }}
              />
              
              {/* Background Image - Mobile */}
              <div 
                className="absolute inset-0 bg-cover md:hidden"
                style={{ 
                  backgroundImage: `url(${slide.mobile_url || slide.desktop_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'})`,
                  backgroundPosition: `${slide.pos_x_mobile ?? 50}% ${slide.pos_y_mobile ?? 50}%` 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay - Gradient on top of the carousel images */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12]/90 via-[#0F0F12]/60 to-transparent pointer-events-none z-0" />
      
      {/* Flechas de Navegación (Visibles on hover en desktop) */}
      {displaySlides.length > 1 && (
        <>
          <button 
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-[#F400A1] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0 hidden sm:block"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-[#F400A1] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 hidden sm:block"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Texto Overlay */}
      <div className="relative z-10 w-full max-w-7xl mx-auto self-center px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 text-left pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#F400A1] animate-pulse" />
          {heroSubtitulo || 'Nueva Colección'}
        </div>
        <h1 className="text-5xl sm:text-7xl font-black font-display text-white uppercase tracking-[0.12em] mb-4 leading-tight">
          {heroTitulo ? (
            heroTitulo
          ) : (
            <>
              Rendimiento en cada <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F400A1] to-white">
                movimiento
              </span>
            </>
          )}
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl font-light leading-relaxed mb-8 whitespace-pre-wrap pointer-events-auto">
          {heroDescripcion || 'Indumentaria de barrio diseñada para entrenar sin límites. Elevá tu potencial con calzas, tops y remeras de calidad premium.'}
        </p>

        {/* Indicadores de slides (Dots) */}
        {displaySlides.length > 1 && (
          <div className="flex gap-2 pointer-events-auto">
            {displaySlides.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === selectedIndex ? 'w-8 bg-[#F400A1]' : 'bg-white/30 hover:bg-white/50'}`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
