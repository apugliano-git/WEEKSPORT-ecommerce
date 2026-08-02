'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Producto, Categoria, VarianteStock } from '@/types'
import { actualizarProducto } from '@/lib/productoService'

interface ProductTableProps {
  productos: Producto[];
  categorias: Categoria[];
}

function ProductRow({ product, categoryMap, onEdit }: { product: Producto, categoryMap: Record<string, string>, onEdit: (p: Producto) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const variants: VarianteStock[] = product.variantes_stock || [];
  
  const totalStock = variants.reduce((sum, v) => sum + v.cantidad, 0);
  
  let priceDisplay = 'N/A';
  if (variants.length > 0) {
    const prices = variants.map(v => v.precio);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      priceDisplay = minPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    } else {
      priceDisplay = `Desde ${minPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`;
    }
  }

  const isOutOfStockTotal = totalStock === 0;

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
        <td className="px-6 py-4">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className={`p-1 rounded-md bg-white/5 text-gray-400 group-hover:text-white transition-all ${isExpanded ? 'rotate-90 bg-[#F400A1]/20 text-[#F400A1]' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <span className="font-semibold text-white text-left">{product.nombre}</span>
          </button>
        </td>
        <td className="px-6 py-4 text-gray-400">{categoryMap[product.categoria_id] || 'Sin categoría'}</td>
        <td className="px-6 py-4 text-gray-400">{product.genero || 'Unisex'}</td>
        <td className="px-6 py-4 text-center">
          <span className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md text-xs ${
            isOutOfStockTotal
              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            {totalStock} uds
          </span>
        </td>
        <td className="px-6 py-4 text-right font-medium text-white">{priceDisplay}</td>
        <td className="px-6 py-4 text-center">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            product.activo 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-gray-500/10 text-gray-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.activo ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            {product.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          <button
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Editar
          </button>
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-white/5 bg-black/20">
            <div className="px-12 py-5 animate-fadeIn">
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">Este producto no tiene variantes de stock.</p>
              ) : (
                <table className="w-full text-left border-collapse bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden shadow-inner">
                  <thead>
                    <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="px-4 py-3">Variante ID</th>
                      <th className="px-4 py-3">Talle</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {variants.map(v => {
                      const isCritical = v.cantidad < 3;
                      const isOutOfStock = v.cantidad === 0;
                      return (
                        <tr key={v.id} className={`${isCritical ? 'bg-red-500/[0.02]' : 'hover:bg-white/[0.02]'}`}>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.id.split('-')[0]}...</td>
                          <td className="px-4 py-3 text-gray-300 font-semibold">{v.talle}</td>
                          <td className="px-4 py-3 text-gray-300">{v.color}</td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {v.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] ${
                              isOutOfStock
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : isCritical
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-extrabold'
                                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}>
                              {v.cantidad} uds
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function ProductTable({ productos, categorias }: ProductTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [editingProduct, setEditingProduct] = useState<{
    id: string;
    nombre: string;
    descripcion: string;
    categoria_id: string;
    genero: string;
    activo: boolean;
  } | null>(null)
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [editError, setEditError] = useState('')

  // Mapear IDs de categorías a nombres para una visualización amigable
  const categoryMap = React.useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id] = cat.nombre;
      return acc;
    }, {} as Record<string, string>);
  }, [categorias]);

  // Filtrar productos
  const filteredProducts = React.useMemo(() => {
    let result = productos;

    if (selectedCategoryId) {
      result = result.filter(prod => prod.categoria_id === selectedCategoryId);
    }

    if (!searchTerm.trim()) return result;
    
    const term = searchTerm.toLowerCase();
    return result.filter(prod => {
      const matchProduct = prod.nombre.toLowerCase().includes(term) ||
                           (categoryMap[prod.categoria_id] || '').toLowerCase().includes(term) ||
                           (prod.genero || '').toLowerCase().includes(term);
      
      const matchVariant = (prod.variantes_stock || []).some(v => 
        v.talle.toLowerCase().includes(term) || 
        v.color.toLowerCase().includes(term)
      );

      return matchProduct || matchVariant;
    });
  }, [productos, searchTerm, selectedCategoryId, categoryMap]);

  const handleEdit = (product: Producto) => {
    setEditingProduct({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      categoria_id: product.categoria_id,
      genero: product.genero || 'Unisex',
      activo: product.activo,
    });
    setEditStatus('idle');
    setEditError('');
  }

  return (
    <div className="bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-display text-white">Inventario de Productos</h3>
          <p className="text-sm text-gray-400 mt-1">Lista detallada del catálogo con stock agrupado por producto.</p>
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
              placeholder="Buscar por nombre, talle o color..."
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
              <th className="px-6 py-4">Género</th>
              <th className="px-6 py-4 text-center">Stock Total</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron productos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => (
                <ProductRow 
                  key={prod.id} 
                  product={prod} 
                  categoryMap={categoryMap} 
                  onEdit={handleEdit} 
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Editar Producto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Nombre</label>
                <input 
                  type="text" 
                  value={editingProduct.nombre}
                  onChange={e => setEditingProduct({...editingProduct, nombre: e.target.value})}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Descripción</label>
                <textarea 
                  value={editingProduct.descripcion}
                  onChange={e => setEditingProduct({...editingProduct, descripcion: e.target.value})}
                  rows={3}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoría</label>
                <select 
                  value={editingProduct.categoria_id}
                  onChange={e => setEditingProduct({...editingProduct, categoria_id: e.target.value})}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]"
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Género</label>
                <select 
                  value={editingProduct.genero}
                  onChange={e => setEditingProduct({...editingProduct, genero: e.target.value})}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]"
                >
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Niños">Niños</option>
                </select>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct({...editingProduct, activo: !editingProduct.activo})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingProduct.activo ? 'bg-[#F400A1]' : 'bg-zinc-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingProduct.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-300">
                  {editingProduct.activo ? 'Producto visible en catálogo' : 'Producto oculto'}
                </span>
              </div>
              
              {editStatus === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {editError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#1A1A20]">
              <button 
                onClick={() => setEditingProduct(null)}
                disabled={editStatus === 'saving'}
                className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setEditStatus('saving');
                  setEditError('');
                  const res = await actualizarProducto(editingProduct.id, {
                    nombre: editingProduct.nombre,
                    descripcion: editingProduct.descripcion,
                    categoria_id: editingProduct.categoria_id,
                    genero: editingProduct.genero,
                    activo: editingProduct.activo
                  });
                  if (res.status === 'success') {
                    setEditStatus('success');
                    setEditingProduct(null);
                    router.refresh();
                  } else {
                    setEditStatus('error');
                    setEditError(res.message);
                  }
                }}
                disabled={editStatus === 'saving' || !editingProduct.nombre || !editingProduct.categoria_id}
                className="px-5 py-2.5 bg-[#F400A1] hover:bg-[#D000A0] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#F400A1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
