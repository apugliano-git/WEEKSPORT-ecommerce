'use client'

import React from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 'primary' = magenta (#F400A1), 'success' = emerald */
  variant?: 'primary' | 'success'
  disabled?: boolean
  className?: string
}

const trackClasses: Record<NonNullable<SwitchProps['variant']>, string> = {
  primary: 'bg-[#F400A1]',
  success: 'bg-emerald-500',
}

export function Switch({
  checked,
  onChange,
  variant = 'primary',
  disabled = false,
  className = '',
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A1A20]',
        checked ? trackClasses[variant] : 'bg-zinc-600',
        variant === 'primary' ? 'focus:ring-[#F400A1]/40' : 'focus:ring-emerald-500/40',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3 w-3 transform rounded-full bg-white',
          'transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}
