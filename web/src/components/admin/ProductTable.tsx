'use client'

import React, { useState } from 'react'
import { Producto, Categoria } from '@/types'

interface ProductTableProps {
  productos: Producto[];
  categorias: Categoria[];
}

export function ProductTable({ productos, categorias }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  // Mapear IDs de categorías a nombres para una visualización amigable
  const categoryMap = React.useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id] = cat.nombre;
      return acc;
    }, {} as Record<string, string>);
  }, [categorias]);

  // Aplanar la estructura de productos para mostrar cada variante como una fila individual
  const variantRows = React.useMemo(() => {
    const rows: {
      productoId: string;
      categoriaId: string;
      nombre: string;
      categoria: string;
      activo: boolean;
      varianteId: string;
      talle: string;
      color: string;
      cantidad: number;
      precio: number;
    }[] = [];

    productos.forEach(prod => {
      const variants = prod.variantes_stock || [];
      variants.forEach(v => {
        rows.push({
          productoId: prod.id,
          categoriaId: prod.categoria_id,
          nombre: prod.nombre,
          categoria: categoryMap[prod.categoria_id] || 'Sin categoría',
          activo: prod.activo,
          varianteId: v.id,
          talle: v.talle,
          color: v.color,
          cantidad: v.cantidad,
          precio: v.precio,
        });
      });
    });

    return rows;
  }, [productos, categoryMap]);

  // Filtrar las filas según la búsqueda del usuario y la categoría seleccionada
  const filteredRows = React.useMemo(() => {
    let result = variantRows;

    if (selectedCategoryId) {
      result = result.filter(row => row.categoriaId === selectedCategoryId);
    }

    if (!searchTerm.trim()) return result;
    
    const term = searchTerm.toLowerCase();
    return result.filter(row => 
      row.nombre.toLowerCase().includes(term) ||
      row.categoria.toLowerCase().includes(term) ||
      row.talle.toLowerCase().includes(term) ||
      row.color.toLowerCase().includes(term)
    );
  }, [variantRows, searchTerm, selectedCategoryId]);

  return (
    <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-display text-white">Inventario de Variantes</h3>
          <p className="text-sm text-gray-400 mt-1">Lista detallada de las variantes de stock de tu tienda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full sm:w-auto bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow cursor-pointer appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por producto, talle o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow"
            />
            <span className="absolute left-3 top-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto animate-fadeIn">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Talle</th>
              <th className="px-6 py-4">Color</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron variantes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredRows.map(row => {
                const isCritical = row.cantidad < 3;
                const isOutOfStock = row.cantidad === 0;

                return (
                  <tr 
                    key={row.varianteId} 
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isCritical ? 'bg-red-500/[0.02]' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-white">{row.nombre}</td>
                    <td className="px-6 py-4 text-gray-400">{row.categoria}</td>
                    <td className="px-6 py-4 text-gray-300 font-semibold">{row.talle}</td>
                    <td className="px-6 py-4 text-gray-300">{row.color}</td>
                    <td className="px-6 py-4 text-right font-medium text-white">
                      {row.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md text-xs ${
                        isOutOfStock
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : isCritical
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-extrabold'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {row.cantidad} uds
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.activo 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.activo ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                        {row.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
