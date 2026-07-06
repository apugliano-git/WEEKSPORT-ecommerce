'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

interface ProductGalleryProps {
  imagenes: string[]
  nombre: string
}

export function ProductGallery({ imagenes, nombre }: ProductGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Handle scroll to update dots
  const onScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const scrollPosition = scrollContainerRef.current.scrollLeft
    const containerWidth = scrollContainerRef.current.clientWidth
    const newIndex = Math.round(scrollPosition / containerWidth)
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex)
    }
  }, [activeIndex])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true })
      return () => container.removeEventListener('scroll', onScroll)
    }
  }, [onScroll])

  const scrollToImage = (index: number) => {
    if (!scrollContainerRef.current) return
    const containerWidth = scrollContainerRef.current.clientWidth
    scrollContainerRef.current.scrollTo({
      left: index * containerWidth,
      behavior: 'smooth',
    })
  }

  const hasMultiple = imagenes.length > 1
  const displayImages = imagenes.length > 0 ? imagenes : [''] // Fallback if no images

  return (
    <div className="relative group flex flex-col w-full">
      {/* Container Galería */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full aspect-[4/5] md:aspect-square md:rounded-2xl bg-[#1A1A20]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayImages.map((img, i) => (
          <div key={i} className="snap-center w-full h-full shrink-0 relative flex items-center justify-center">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={`${nombre} - Vista ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white/50 text-sm">Sin imagen</span>
            )}
          </div>
        ))}
      </div>

      {/* Flechas Desktop (Solo en md: hover) */}
      {hasMultiple && (
        <>
          <button
            onClick={() => scrollToImage(Math.max(0, activeIndex - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex hover:bg-black/80"
            aria-label="Imagen anterior"
            disabled={activeIndex === 0}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scrollToImage(Math.min(imagenes.length - 1, activeIndex + 1))}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex hover:bg-black/80"
            aria-label="Imagen siguiente"
            disabled={activeIndex === imagenes.length - 1}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicadores */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 z-10 md:-bottom-8 md:relative">
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToImage(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? 'w-6 bg-white md:bg-[#F400A1]' 
                  : 'w-1.5 bg-white/50 md:bg-white/20'
              }`}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  )
}
