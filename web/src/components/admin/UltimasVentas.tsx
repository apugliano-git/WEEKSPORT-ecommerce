'use client';

import { useState } from 'react';
import { VentaDetalle } from '@/components/admin/VentaDetalle';
import type { VentaItem } from '@/lib/ventasService';

interface VentaRow {
  id: string;
  created_at: string;
  items: VentaItem[] | null;
  detalles?: string | null;
}

function formatFecha(fechaStr: string) {
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function resumirItems(items: VentaItem[] | null) {
  if (!Array.isArray(items) || items.length === 0) return 'Sin artículos';
  const hasNames = items.every(item => typeof item.nombre_producto === 'string' && item.nombre_producto.length > 0);
  if (hasNames) {
    if (items.length <= 2) return items.map(item => item.nombre_producto ?? '').join(', ');
    return `${items[0].nombre_producto}, ${items[1].nombre_producto} y ${items.length - 2} más`;
  }
  return `${items.length} artículo${items.length !== 1 ? 's' : ''}`;
}

export function UltimasVentas({ ventas }: { ventas: VentaRow[] }) {
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRow | null>(null);

  return (
    <>
      <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden shadow-lg shadow-black/50">
        {ventas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Todavía no hay ventas registradas.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {ventas.map((venta) => (
              <button
                key={venta.id}
                onClick={() => setVentaSeleccionada(venta)}
                className="w-full p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm">Venta #{venta.id.split('-')[0].toUpperCase()}</span>
                  <span className="text-gray-400 text-xs mt-0.5">{resumirItems(venta.items)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-500 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg">
                    {formatFecha(venta.created_at)}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <VentaDetalle
        venta={ventaSeleccionada}
        onClose={() => setVentaSeleccionada(null)}
      />
    </>
  );
}
