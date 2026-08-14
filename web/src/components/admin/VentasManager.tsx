'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { procesarVentaAtomicamente, VentaItem } from '@/lib/ventasService';
import { Producto, Categoria, VarianteStock } from '@/types';

// Item enriquecido con snapshot del producto/variante
interface CarritoItem extends VentaItem {
  nombre_producto: string;
  talle: string;
  color: string;
  precio_unitario: number;
  subtotal: number;
  cantidad_disponible: number; // Para validación visual en el carrito
}

interface VentasManagerProps {
  productos: Producto[];
  categorias: Categoria[];
}

export function VentasManager({ productos, categorias }: VentasManagerProps) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cantidadInput, setCantidadInput] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al clickear fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoryMap = useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id] = cat.nombre;
      return acc;
    }, {} as Record<string, string>);
  }, [categorias]);

  // Aplana todos los productos y variantes en una lista buscable
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results: { producto: Producto; variante: VarianteStock }[] = [];

    for (const prod of productos) {
      if (!prod.variantes_stock) continue;

      const matchProduct = 
        prod.nombre.toLowerCase().includes(term) ||
        (categoryMap[prod.categoria_id] || '').toLowerCase().includes(term);

      for (const variante of prod.variantes_stock) {
        // Solo mostrar variantes con stock
        if (variante.cantidad <= 0) continue;

        const matchVariant = 
          variante.talle.toLowerCase().includes(term) ||
          variante.color.toLowerCase().includes(term);

        if (matchProduct || matchVariant) {
          results.push({ producto: prod, variante });
        }
      }
    }

    return results.slice(0, 10); // Límite para no saturar el dropdown
  }, [productos, searchTerm, categoryMap]);

  // Selección de variante desde el dropdown
  const handleSelectVariant = (producto: Producto, variante: VarianteStock) => {
    setSelectedVariantId(variante.id);
    setSearchTerm(`${producto.nombre} - ${variante.talle} / ${variante.color}`);
    setIsDropdownOpen(false);
  };

  const handleAgregarAlCarrito = () => {
    if (!selectedVariantId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un producto del buscador.' });
      return;
    }
    if (cantidadInput <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    // Buscar variante y producto seleccionados
    let varianteSeleccionada: VarianteStock | null = null;
    let productoSeleccionado: Producto | null = null;

    for (const prod of productos) {
      const v = (prod.variantes_stock || []).find(v => v.id === selectedVariantId);
      if (v) {
        varianteSeleccionada = v;
        productoSeleccionado = prod;
        break;
      }
    }

    if (!varianteSeleccionada || !productoSeleccionado) {
      setMensaje({ tipo: 'error', texto: `Variante no encontrada.` });
      return;
    }

    if (varianteSeleccionada.cantidad < cantidadInput) {
      setMensaje({ tipo: 'error', texto: `Stock insuficiente. Disponible: ${varianteSeleccionada.cantidad} unidades.` });
      return;
    }

    // Verificar si ya está en el carrito y si la suma excede el stock
    const itemEnCarrito = carrito.find(item => item.variante_id === selectedVariantId);
    if (itemEnCarrito && itemEnCarrito.cantidad + cantidadInput > varianteSeleccionada.cantidad) {
      setMensaje({ tipo: 'error', texto: `La suma excede el stock. Solo hay ${varianteSeleccionada.cantidad} unidades disponibles.` });
      return;
    }

    const precioUnitario = varianteSeleccionada.precio || 0;
    const subtotal = precioUnitario * cantidadInput;

    const nuevoItem: CarritoItem = {
      variante_id: varianteSeleccionada.id,
      cantidad: cantidadInput,
      nombre_producto: productoSeleccionado.nombre,
      talle: varianteSeleccionada.talle,
      color: varianteSeleccionada.color,
      precio_unitario: precioUnitario,
      subtotal,
      cantidad_disponible: varianteSeleccionada.cantidad
    };

    setCarrito(prev => {
      const index = prev.findIndex(item => item.variante_id === selectedVariantId);
      if (index !== -1) {
        const nuevoCarrito = [...prev];
        const updated = { ...nuevoCarrito[index] };
        updated.cantidad += cantidadInput;
        updated.subtotal = updated.precio_unitario * updated.cantidad;
        nuevoCarrito[index] = updated;
        return nuevoCarrito;
      }
      return [...prev, nuevoItem];
    });

    setSearchTerm('');
    setSelectedVariantId(null);
    setCantidadInput(1);
    setMensaje({ tipo: 'success', texto: `"${productoSeleccionado.nombre} — ${varianteSeleccionada.talle} / ${varianteSeleccionada.color}" agregado al carrito.` });
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

      {/* Buscador de variante */}
      <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Agregar Producto</h2>
          <p className="text-sm text-gray-500 mt-1">Buscá por nombre, talle o color. Solo se muestran variantes con stock.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Dropdown de Búsqueda */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="relative">
              <input
                id="variante-search"
                type="text"
                autoComplete="off"
                className="w-full bg-[#0F0F12] text-white placeholder-gray-600 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedVariantId(null);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Buscar (ej: Botines, M, Negro...)"
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && selectedVariantId) {
                    handleAgregarAlCarrito();
                  } else if (e.key === 'Enter' && searchResults.length > 0) {
                    handleSelectVariant(searchResults[0].producto, searchResults[0].variante);
                  }
                }}
              />
              <span className="absolute left-3 top-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedVariantId(null); }}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>

            {/* Lista de sugerencias */}
            {isDropdownOpen && searchTerm.trim() && !selectedVariantId && (
              <div className="absolute z-50 mt-2 w-full bg-[#1A1A20] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No se encontraron variantes con stock.</div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {searchResults.map((res) => (
                      <li key={res.variante.id}>
                        <button
                          onClick={() => handleSelectVariant(res.producto, res.variante)}
                          className="w-full text-left p-3 hover:bg-white/5 transition-colors flex flex-col gap-1"
                        >
                          <span className="font-semibold text-white text-sm">{res.producto.nombre}</span>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Talle: <span className="text-gray-300 font-medium">{res.variante.talle}</span> · Color: <span className="text-gray-300 font-medium">{res.variante.color || 'N/A'}</span></span>
                            <span className="text-emerald-400 font-bold">{res.variante.cantidad} disp.</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

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
            disabled={!selectedVariantId}
            className="bg-[#F400A1] hover:bg-[#D000A0] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Agregar
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
