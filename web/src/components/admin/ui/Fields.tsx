'use client'

import React from 'react'

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={[
          'w-full bg-[#23232A] text-white placeholder-gray-500',
          'border rounded-lg px-4 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 transition-shadow',
          error
            ? 'border-red-500/60 focus:ring-red-500/40'
            : 'border-white/10 focus:ring-[#F400A1]',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      <select
        className={[
          'w-full bg-[#23232A] text-white',
          'border rounded-lg px-4 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 transition-shadow',
          'cursor-pointer appearance-none',
          error
            ? 'border-red-500/60 focus:ring-red-500/40'
            : 'border-white/10 focus:ring-[#F400A1]',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
