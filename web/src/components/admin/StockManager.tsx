'use client'

import React, { useState } from 'react'
import { Producto, Categoria } from '@/types'
import { actualizarStockVariante } from '@/lib/inventarioService'
import { TableShell, Select, Input, Badge, Button, BottomSheet, Switch } from '@/components/admin/ui'

interface StockManagerProps {
  productos: Producto[];
  categorias: Categoria[];
}

function StockVariantRow({ variante }: { variante: any }) {
  const [currentStock, setCurrentStock] = useState(variante.cantidad);
  const [inputValue, setInputValue] = useState<number | ''>(variante.cantidad);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChanged = inputValue !== currentStock;
  const isInvalid = typeof inputValue === 'number' && inputValue < 0 || inputValue === '';
  const canSave = hasChanged && !isInvalid && status !== 'saving';

  const handleSave = async () => {
    if (!canSave) return;
    setStatus('saving');
    setErrorMessage('');
    
    const numericValue = inputValue as number;
    const res = await actualizarStockVariante(variante.id, numericValue);
    
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
      <td className="px-4 py-3 text-gray-300 font-semibold">{variante.talle}</td>
      <td className="px-4 py-3 text-gray-300">{variante.color}</td>
      <td className="px-4 py-3 text-center">
        <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
          {currentStock} uds
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <Input
          type="number"
          min="0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
          className="w-20 text-center mx-auto !py-1 text-xs"
        />
      </td>
      <td className="px-4 py-3 text-center relative">
        <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
          {status === 'success' && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> OK</span>}
          {status === 'error' && <span className="text-[10px] text-red-400 absolute -bottom-2 whitespace-nowrap bg-red-950/80 px-2 py-0.5 rounded border border-red-900/50">{errorMessage}</span>}
          
          {status !== 'success' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!canSave}
              isLoading={status === 'saving'}
            >
              Guardar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileStockVariantItem({ variante }: { variante: any }) {
  const [currentStock, setCurrentStock] = useState(variante.cantidad);
  const [inputValue, setInputValue] = useState<number | ''>(variante.cantidad);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChanged = inputValue !== currentStock;
  const isInvalid = typeof inputValue === 'number' && (inputValue < 0 || isNaN(inputValue)) || inputValue === '';
  const canSave = hasChanged && !isInvalid && status !== 'saving';

  const handleSave = async () => {
    if (!canSave) return;
    setStatus('saving');
    setErrorMessage('');
    
    const numericValue = inputValue as number;
    const res = await actualizarStockVariante(variante.id, numericValue);
    
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
    <div className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#0F0F12] ${isCritical ? 'border-red-500/20 bg-red-500/5' : ''}`}>
      <div className="flex flex-col">
        <span className="text-gray-300 font-bold text-sm">{variante.talle} <span className="text-gray-500 font-normal">· {variante.color}</span></span>
        <div className="mt-1">
          <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
            {currentStock} uds
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min="0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
          className="w-16 text-center !py-1.5 text-sm"
        />
        <div className="flex flex-col items-center justify-center min-w-[60px] relative">
          {status === 'success' && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> OK</span>}
          {status === 'error' && <span className="text-[10px] text-red-400 absolute -bottom-4 whitespace-nowrap bg-red-950/80 px-2 py-0.5 rounded border border-red-900/50">{errorMessage}</span>}
          {status !== 'success' && (
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave} isLoading={status === 'saving'}>
              Guardar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StockProductRow({ product, categoryMap }: { product: Producto, categoryMap: Record<string, string> }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const variants = product.variantes_stock || [];
  const totalStock = variants.reduce((sum, v) => sum + v.cantidad, 0);
  const isCritical = totalStock < 3;
  const isOutOfStockTotal = totalStock === 0;

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
        <td className="px-6 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 focus:outline-none group text-left w-full"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`p-1 rounded-md bg-white/5 text-gray-400 group-hover:text-white transition-all shrink-0 ${isExpanded ? 'rotate-90 bg-[#F400A1]/20 text-[#F400A1]' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
              <span className="font-semibold text-white">{product.nombre}</span>
            </div>
            
            {/* Mobile Category/Gender Context */}
            <div className="sm:hidden flex items-center gap-2 pl-9 text-xs text-gray-500 w-full">
               <span>{categoryMap[product.categoria_id] || 'Sin categoría'}</span>
               <span>•</span>
               <span>{product.genero || 'Unisex'}</span>
            </div>
          </button>
        </td>
        <td className="hidden sm:table-cell px-6 py-4 text-gray-400">{categoryMap[product.categoria_id] || 'Sin categoría'}</td>
        <td className="hidden sm:table-cell px-6 py-4 text-gray-400">{product.genero || 'Unisex'}</td>
        <td className="px-6 py-4 text-center">
          <Badge variant={isOutOfStockTotal ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
            {totalStock} uds
          </Badge>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={4} className="p-0 bg-black/20">
            <div className="px-4 sm:px-12 py-5 border-b border-white/5">
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">Este producto no tiene variantes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-[#1A1A20] rounded-xl border border-white/5 shadow-inner">
                    <thead>
                      <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                        <th className="px-4 py-3">Talle</th>
                        <th className="px-4 py-3">Color</th>
                        <th className="px-4 py-3 text-center">Stock Actual</th>
                        <th className="px-4 py-3 text-center w-32">Nuevo Stock</th>
                        <th className="px-4 py-3 text-center w-28">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {variants.map(v => (
                        <StockVariantRow key={v.id} variante={v} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function StockManager({ productos, categorias }: StockManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [hideOutOfStock, setHideOutOfStock] = useState(false)

  const categoryMap = React.useMemo(() => {
    return categorias.reduce((acc, cat) => {
      acc[cat.id] = cat.nombre;
      return acc;
    }, {} as Record<string, string>);
  }, [categorias]);

  const filteredProducts = React.useMemo(() => {
    let result = productos;

    if (hideOutOfStock) {
      result = result.filter(prod => {
        const totalStock = (prod.variantes_stock || []).reduce((sum, v) => sum + v.cantidad, 0);
        return totalStock > 0;
      });
    }

    if (selectedCategoryId) {
      result = result.filter(prod => prod.categoria_id === selectedCategoryId);
    }

    if (!searchTerm.trim()) return result;
    
    const term = searchTerm.toLowerCase();
    return result.filter(prod => {
      const matchProduct = 
        prod.nombre.toLowerCase().includes(term) ||
        (categoryMap[prod.categoria_id] || '').toLowerCase().includes(term) ||
        (prod.genero || '').toLowerCase().includes(term);

      const matchVariant = (prod.variantes_stock || []).some(v => 
        v.talle.toLowerCase().includes(term) ||
        v.color.toLowerCase().includes(term)
      );

      return matchProduct || matchVariant;
    });
  }, [productos, searchTerm, selectedCategoryId, categoryMap, hideOutOfStock]);

  const columns = [
    { label: 'Producto' },
    { label: 'Categoría', width: 'hidden sm:table-cell' },
    { label: 'Género', width: 'hidden sm:table-cell' },
    { label: 'Stock Total', align: 'center' as const },
  ];

  const actions = (
    <>
      <div className="flex items-center gap-2 px-1 sm:px-3 py-2.5">
        <Switch checked={hideOutOfStock} onChange={setHideOutOfStock} variant="primary" />
        <span 
          className="text-xs font-bold text-gray-400 cursor-pointer select-none" 
          onClick={() => setHideOutOfStock(!hideOutOfStock)}
        >
          Ocultar agotados
        </span>
      </div>
      <Select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className="w-full sm:w-auto"
      >
        <option value="">Todas las categorías</option>
        {categorias.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </Select>
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por producto, talle o color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 pl-10"
        />
        <span className="absolute left-3 top-3 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop View (TableShell) */}
      <div className="hidden sm:block">
        <TableShell
          title="Ajuste Rápido de Stock"
          subtitle="Expandí cada producto para modificar las existencias al instante."
          columns={columns}
          actions={actions}
          isEmpty={filteredProducts.length === 0}
          emptyMessage="No se encontraron productos que coincidan con la búsqueda."
        >
          {filteredProducts.map(prod => (
            <StockProductRow key={prod.id} product={prod} categoryMap={categoryMap} />
          ))}
        </TableShell>
      </div>

      {/* Mobile View (Cards) */}
      <div className="sm:hidden flex flex-col gap-4">
        {/* Header & Actions */}
        <div className="bg-[#1A1A20] rounded-2xl border border-white/5 shadow-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Ajuste Rápido</h3>
            <p className="text-sm text-gray-400 mt-1">Modificá existencias al instante.</p>
          </div>
          <div className="flex flex-col gap-3">
            {actions}
          </div>
        </div>

        {/* Product Cards */}
        <div className="flex flex-col gap-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron productos que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const variants = prod.variantes_stock || [];
              const totalStock = variants.reduce((sum, v) => sum + v.cantidad, 0);
              const isCritical = totalStock < 3;
              const isOutOfStockTotal = totalStock === 0;

              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className="flex items-center justify-between p-4 bg-[#1A1A20] border border-white/5 rounded-2xl shadow-lg hover:border-white/10 active:bg-white/5 transition-colors text-left"
                >
                  <span className="font-bold text-white text-sm">{prod.nombre}</span>
                  <Badge variant={isOutOfStockTotal ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
                    {totalStock} uds
                  </Badge>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Mobile BottomSheet */}
      <BottomSheet
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.nombre || ''}
      >
        <div className="flex flex-col gap-3">
          {selectedProduct?.variantes_stock?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene variantes.</p>
          ) : (
            selectedProduct?.variantes_stock?.map(v => (
              <MobileStockVariantItem key={v.id} variante={v} />
            ))
          )}
        </div>
      </BottomSheet>
    </>
  )
}
