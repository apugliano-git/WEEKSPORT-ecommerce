'use client'

import React from 'react'

// ─── TableShell ───────────────────────────────────────────────────────────────
// Contenedor reutilizable que envuelve el patrón de tabla del admin:
// un panel oscuro con header (título + filtros) y un área scrolleable con tabla.

interface Column {
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface TableShellProps {
  /** Sección izquierda del header: título y subtítulo */
  title: string
  subtitle?: string
  /** Sección derecha del header: filtros, buscadores, botones */
  actions?: React.ReactNode
  /** Definición de columnas para el <thead> */
  columns: Column[]
  /** Filas del <tbody> */
  children: React.ReactNode
  /** Mensaje cuando no hay resultados */
  emptyMessage?: string
  /** Fuerza mostrar el empty state en lugar de children */
  isEmpty?: boolean
}

const alignMap: Record<NonNullable<Column['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function TableShell({
  title,
  subtitle,
  actions,
  columns,
  children,
  emptyMessage = 'No se encontraron resultados.',
  isEmpty = false,
}: TableShellProps) {
  return (
    <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-display text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto animate-fadeIn">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={[
                    'px-6 py-4',
                    alignMap[col.align ?? 'left'],
                    col.width ?? '',
                  ].join(' ')}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
