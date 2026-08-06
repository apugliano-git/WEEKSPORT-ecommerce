'use client';

import React from 'react';
import { Modal } from '@/components/admin/ui/Modal';
import { VentaItem } from '@/lib/ventasService';

interface VentaRow {
  id: string;
  created_at: string;
  items: VentaItem[] | null;
  detalles?: string | null;
}

interface VentaDetalleProps {
  venta: VentaRow | null;
  onClose: () => void;
}

function formatFecha(fechaStr: string) {
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ' a las ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatPrecio(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export function VentaDetalle({ venta, onClose }: VentaDetalleProps) {
  if (!venta) return null;

  const items: VentaItem[] = Array.isArray(venta.items) ? venta.items : [];

  // Determinar si todos los items tienen snapshot completo (venta nueva)
  const tieneSnapshot = items.length > 0 && items.every(i => i.nombre_producto);

  const totalGeneral = tieneSnapshot
    ? items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0)
    : null;

  const totalUnidades = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <Modal
      isOpen={!!venta}
      onClose={onClose}
      title={`Venta #${venta.id.split('-')[0].toUpperCase()}`}
    >
      <div className="flex flex-col gap-5">
        {/* Fecha */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          {formatFecha(venta.created_at)}
        </div>

        {/* Sin items */}
        {items.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4 italic">No hay items registrados en esta venta.</p>
        )}

        {/* Venta con snapshot completo */}
        {tieneSnapshot && (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Talle</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">P. Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white text-sm">{item.nombre_producto}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{item.talle}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{item.color}</td>
                      <td className="px-4 py-3 text-center text-white">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right text-gray-300 text-sm">{formatPrecio(item.precio_unitario ?? 0)}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{formatPrecio(item.subtotal ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-[#0F0F12] border border-white/5 rounded-xl px-5 py-4">
              <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Total de la venta</span>
              <span className="text-2xl font-black text-white">{formatPrecio(totalGeneral ?? 0)}</span>
            </div>
          </div>
        )}

        {/* Venta sin snapshot (formato viejo) */}
        {!tieneSnapshot && items.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>
                <strong>Detalle completo no disponible</strong> — Esta venta se registró antes de guardar el detalle por producto. Solo se conservan los IDs de variante.
              </span>
            </div>

            {/* Resumen crudo */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm border-b border-white/5 pb-3 mb-1">
                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">ID de variante</span>
                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Cantidad</span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="font-mono text-xs text-gray-500 truncate pr-4">{item.variante_id}</span>
                  <span className="text-white font-bold shrink-0">{item.cantidad} ud{item.cantidad !== 1 ? 's' : ''}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-1">
                <span className="text-gray-400 text-sm">Total de unidades</span>
                <span className="text-white font-bold">{totalUnidades}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
