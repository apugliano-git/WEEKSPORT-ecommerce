'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductDetail } from './ProductDetail';
import { Producto } from '@/types';

interface ProductModalProps {
  producto: Producto;
  similares: Producto[];
}

export function ProductModal({ producto, similares }: ProductModalProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Cerrar con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    // Overlay — click fuera del contenido cierra el modal
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 md:py-8"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Contenedor del modal — click aquí NO propaga al overlay */}
      <div
        className="
          relative w-[95vw] max-w-4xl
          bg-[#0F0F12] rounded-2xl border border-white/10
          shadow-[0_25px_60px_rgba(0,0,0,0.7)]
          my-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre / Atrás */}
        <button
          onClick={handleClose}
          aria-label="Volver"
          className="
            fixed top-4 right-4 z-[100]
            md:absolute md:top-3 md:right-3 md:z-10
            w-10 h-10 md:w-8 md:h-8 flex items-center justify-center
            rounded-full bg-black/60 md:bg-white/10 backdrop-blur-md hover:bg-white/20
            text-white border border-white/10 md:border-transparent transition-colors
          "
        >
          {/* Icono de flecha < (Back) en móvil, X en desktop (opcional, pero ponemos flecha como pidió) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="md:hidden"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hidden md:block"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Contenido reutilizando exactamente el mismo componente */}
        <ProductDetail producto={producto} similares={similares} />
      </div>
    </div>
  );
}
