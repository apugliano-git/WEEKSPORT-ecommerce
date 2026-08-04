'use client'

import React from 'react'

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'neutral'
  children: React.ReactNode
  /** If true, animates with pulse (useful for critical stock) */
  pulse?: boolean
  className?: string
}

const variantClasses: Record<BadgeProps['variant'], string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  neutral: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
}

export function Badge({ variant, children, pulse = false, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'px-2.5 py-1 rounded-lg text-xs font-bold',
        variantClasses[variant],
        pulse ? 'animate-pulse' : '',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
