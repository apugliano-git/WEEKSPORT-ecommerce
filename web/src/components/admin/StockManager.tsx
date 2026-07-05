'use client'

import React, { useState } from 'react'
import { Producto, Categoria } from '@/types'
import { actualizarStockVariante } from '@/lib/inventarioService'

interface StockManagerProps {
  productos: Producto[];
  categorias: Categoria[];
}

function StockRow({ row }: { row: any }) {
  const [currentStock, setCurrentStock] = useState(row.cantidad);
  const [inputValue, setInputValue] = useState(row.cantidad);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChanged = inputValue !== currentStock;
  const isInvalid = inputValue < 0 || isNaN(inputValue) || inputValue === '';
  const canSave = hasChanged && !isInvalid && status !== 'saving';

  const handleSave = async () => {
    if (!canSave) return;
    setStatus('saving');
    setErrorMessage('');
    
    const numericValue = parseInt(inputValue, 10);
    const res = await actualizarStockVariante(row.varianteId, numericValue);
    
    if (res.status === 'success') {
      setStatus('success');
      setCurrentStock(numericValue);
      setInputValue(numericValue);
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setErrorMessage(res.message);
    }
  }

  const isCritical = currentStock < 3;
  const isOutOfStock = currentStock === 0;

  return (
    <tr className={`hover:bg-white/[0.02] transition-colors ${isCritical ? 'bg-red-500/[0.02]' : ''}`}>
      <td className="px-6 py-4 font-semibold text-white">{row.nombre}</td>
      <td className="px-6 py-4 text-gray-400">{row.categoria}</td>
      <td className="px-6 py-4 text-gray-300 font-semibold">{row.talle}</td>
      <td className="px-6 py-4 text-gray-300">{row.color}</td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md text-xs ${
          isOutOfStock
            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
            : isCritical
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-extrabold'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {currentStock} uds
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <input
          type="number"
          min="0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
          className="w-20 bg-[#23232A] text-white text-center border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow"
        />
      </td>
      <td className="px-6 py-4 text-center relative">
        <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
          {status === 'saving' && <span className="text-xs text-orange-400 animate-pulse font-medium">Guardando...</span>}
          {status === 'success' && <span className="text-xs text-green-400 font-bold flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> OK</span>}
          {status === 'error' && <span className="text-[10px] text-red-400 absolute -bottom-2 whitespace-nowrap bg-red-950/80 px-2 py-0.5 rounded border border-red-900/50">{errorMessage}</span>}
          
          {status !== 'saving' && status !== 'success' && (
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canSave 
                  ? 'bg-[#F400A1] text-white hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20 cursor-pointer' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              Guardar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function StockManager({ productos, categorias }: StockManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const categoryMap = React.useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id] = cat.nombre;
      return acc;
    }, {} as Record<string, string>);
  }, [categorias]);

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
        });
      });
    });

    return rows;
  }, [productos, categoryMap]);

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
          <h3 className="text-xl font-bold font-display text-white">Ajuste Rápido de Stock</h3>
          <p className="text-sm text-gray-400 mt-1">Modificá existencias al instante sin editar el artículo completo.</p>
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
              <th className="px-6 py-4 text-center">Stock Actual</th>
              <th className="px-6 py-4 text-center">Nuevo Stock</th>
              <th className="px-6 py-4 text-center w-32">Acción</th>
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
              filteredRows.map(row => (
                <StockRow key={row.varianteId} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
