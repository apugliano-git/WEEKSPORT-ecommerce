'use client'

import React, { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Cerrar al hacer click en el overlay (fuera del panel)
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose()
        }
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={panelRef}
        className="bg-[#1A1A20] w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
          <h3 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body (scrolleable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer (opcional) */}
        {footer && (
          <div className="p-6 border-t border-white/5 flex justify-end gap-3 flex-shrink-0 bg-[#1A1A20]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
