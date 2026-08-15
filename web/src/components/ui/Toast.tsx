'use client'

import React, { useEffect } from 'react'

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpFade {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-toast {
          animation: slideUpFade 0.3s ease-out forwards;
        }
      `}} />
      <div className="fixed bottom-6 left-1/2 z-50 animate-toast">
        <div className="bg-[#1A1A20] border border-[#F400A1]/50 shadow-[0_0_20px_rgba(244,0,161,0.2)] text-white px-6 py-3 rounded-full flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F400A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <span className="text-sm font-medium whitespace-nowrap">{message}</span>
        </div>
      </div>
    </>
  )
}
