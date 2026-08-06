'use client';

import { useState } from 'react';
import { procesarVentaAtomicamente, VentaItem } from '@/lib/ventasService';
import { createClient } from '@/lib/supabase/client';

// Item enriquecido con snapshot del producto/variante
interface CarritoItem extends VentaItem {
  // Snapshot completo para mostrar en tabla y guardar en historial
  nombre_producto: string;
  talle: string;
  color: string;
  precio_unitario: number;
  subtotal: number;
}

export default function AdminVentasPage() {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [varianteIdInput, setVarianteIdInput] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);
  const [isBuscando, setIsBuscando] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  const supabase = createClient();

  // Busca el producto/variante y arma el snapshot completo antes de agregarlo al carrito
  const handleAgregarAlCarrito = async () => {
    if (!varianteIdInput.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese un ID de variante válido.' });
      return;
    }
    if (cantidadInput <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    setIsBuscando(true);
    setMensaje(null);

    try {
      // Buscar la variante con su producto relacionado
      const { data: variante, error } = await supabase
        .from('variantes_stock')
        .select(`
          id,
          talle,
          color,
          cantidad,
          precio,
          producto_id,
          productos (
            nombre
          )
        `)
        .eq('id', varianteIdInput.trim())
        .single();

      if (error || !variante) {
        setMensaje({ tipo: 'error', texto: `Variante no encontrada. Verificá el UUID.` });
        return;
      }

      if (variante.cantidad < cantidadInput) {
        setMensaje({ tipo: 'error', texto: `Stock insuficiente. Disponible: ${variante.cantidad} unidades.` });
        return;
      }

      const nombreProducto = (variante.productos as any)?.nombre || 'Producto desconocido';
      const precioUnitario = variante.precio || 0;
      const subtotal = precioUnitario * cantidadInput;

      const nuevoItem: CarritoItem = {
        variante_id: variante.id,
        cantidad: cantidadInput,
        nombre_producto: nombreProducto,
        talle: variante.talle,
        color: variante.color,
        precio_unitario: precioUnitario,
        subtotal,
      };

      setCarrito(prev => {
        const index = prev.findIndex(item => item.variante_id === varianteIdInput.trim());
        if (index !== -1) {
          const nuevoCarrito = [...prev];
          const updated = nuevoCarrito[index];
          updated.cantidad += cantidadInput;
          updated.subtotal = updated.precio_unitario * updated.cantidad;
          return nuevoCarrito;
        }
        return [...prev, nuevoItem];
      });

      setVarianteIdInput('');
      setCantidadInput(1);
      setMensaje({ tipo: 'success', texto: `"${nombreProducto} — ${variante.talle} / ${variante.color}" agregado al carrito.` });
    } finally {
      setIsBuscando(false);
    }
  };

  const handleRemoverDelCarrito = (variante_id: string) => {
    setCarrito(prev => prev.filter(item => item.variante_id !== variante_id));
  };

  const totalGeneral = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'El carrito está vacío. Agregue productos para procesar la venta.' });
      return;
    }

    setIsLoading(true);
    setMensaje({ tipo: 'info', texto: 'Iniciando transacción segura en PostgreSQL...' });

    try {
      // El carrito ya tiene todos los campos del snapshot — se manda completo
      const resultado = await procesarVentaAtomicamente(carrito);

      if (resultado.status === 'success') {
        setMensaje({
          tipo: 'success',
          texto: `Venta confirmada exitosamente. ID de operación transaccional: ${resultado.venta_id}`
        });
        setCarrito([]);
      } else {
        setMensaje({
          tipo: 'error',
          texto: `Fallo atómico (Rollback ejecutado): ${resultado.message} (Cód: ${resultado.errorCode || 'N/A'})`
        });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error crítico de red o servidor. Verifique consola.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrecio = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-8">
      {/* Feedback */}
      {mensaje && (
        <div className={`p-4 rounded-xl font-medium text-sm border ${
          mensaje.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          mensaje.tipo === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Ingresar variante */}
      <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Agregar Producto</h2>
          <p className="text-sm text-gray-500 mt-1">Pegá el UUID de la variante — el nombre, talle y precio se cargan automáticamente.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="variante-id"
            name="variante_id"
            type="text"
            className="flex-1 bg-[#0F0F12] text-white placeholder-gray-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow font-mono"
            value={varianteIdInput}
            onChange={(e) => setVarianteIdInput(e.target.value)}
            placeholder="UUID de variante (ej: 550e8400-...)"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAgregarAlCarrito(); }}
          />
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            min="1"
            className="w-full sm:w-28 bg-[#0F0F12] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow text-center"
            value={cantidadInput}
            onChange={(e) => setCantidadInput(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={handleAgregarAlCarrito}
            disabled={isBuscando}
            className="bg-[#F400A1] hover:bg-[#D000A0] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isBuscando ? 'Buscando...' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Carrito */}
      <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Payload de Venta Actual</h2>
          {carrito.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{carrito.length} línea{carrito.length !== 1 ? 's' : ''} · Total: <span className="text-white font-bold">{formatPrecio(totalGeneral)}</span></p>
          )}
        </div>

        {carrito.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm italic">Esperando productos para iniciar transacción...</p>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Talle / Color</th>
                    <th className="px-6 py-3 text-center">Cant.</th>
                    <th className="px-6 py-3 text-right">P. Unitario</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {carrito.map((item) => (
                    <tr key={item.variante_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{item.nombre_producto}</td>
                      <td className="px-6 py-4 text-gray-400">{item.talle} · {item.color}</td>
                      <td className="px-6 py-4 text-center text-white">{item.cantidad}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{formatPrecio(item.precio_unitario)}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">{formatPrecio(item.subtotal)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRemoverDelCarrito(item.variante_id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Quitar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0F0F12] border-t border-white/10">
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-400 uppercase tracking-widest">Total</td>
                    <td className="px-6 py-4 text-right text-xl font-black text-white">{formatPrecio(totalGeneral)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end">
              <button
                onClick={handleConfirmarVenta}
                disabled={isLoading}
                className="bg-[#F400A1] hover:bg-[#D000A0] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-[#F400A1]/20"
              >
                {isLoading ? 'Ejecutando Transacción...' : 'Confirmar Venta y Reducir Stock'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
