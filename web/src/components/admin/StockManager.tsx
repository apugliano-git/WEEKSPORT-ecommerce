'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Producto, Categoria, VarianteStock } from '@/types'
import { actualizarStockVariante, agregarColorAProducto, actualizarPrecioColor } from '@/lib/inventarioService'
import { eliminarProducto } from '@/lib/productoService'
import { TableShell, Select, Input, Badge, Button, BottomSheet, Switch } from '@/components/admin/ui'
import { groupVariantsByColor, sortVariants, type VariantColorGroup } from './variantUtils'

// Normaliza un nombre de color: primera letra mayúscula, resto minúsculas
function capitalizarColor(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const MAX_COLOR_LENGTH = 20;

interface StockManagerProps {
  productos: Producto[];
  categorias: Categoria[];
  initialSearch?: string;
}

function StockVariantRow({ variante, hideColor = false }: { variante: VarianteStock, hideColor?: boolean }) {
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
      {!hideColor && <td className="px-4 py-3 text-gray-300">{variante.color}</td>}
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

function MobileVariantAdjust({ variante, onBack }: { variante: VarianteStock, onBack: () => void }) {
  const [ajuste, setAjuste] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState(variante.cantidad);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const finalStock = Math.max(0, currentStock + ajuste);
  
  const canSave = ajuste !== 0 && status !== 'saving';

  const handleSave = async () => {
    if (!canSave) return;
    setStatus('saving');
    setErrorMessage('');
    
    const res = await actualizarStockVariante(variante.id, finalStock);
    
    if (res.status === 'success') {
      setStatus('success');
      setCurrentStock(finalStock);
      setTimeout(() => {
        onBack();
      }, 1000);
    } else {
      setStatus('error');
      setErrorMessage(res.message);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-2 pb-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold w-fit transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Volver
      </button>

      <div className="flex flex-col items-center justify-center text-center gap-1 mt-2">
        <h4 className="text-3xl font-bold text-white">{variante.talle}</h4>
        <p className="text-lg text-gray-400 font-medium">{variante.color}</p>
        <div className="mt-2">
           <Badge variant={currentStock === 0 ? 'danger' : currentStock < 3 ? 'warning' : 'success'}>
             Stock actual: {currentStock}
           </Badge>
        </div>
      </div>

      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-6 mt-2 shadow-inner">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ajustar cantidad</p>
        
        <div className="flex items-center justify-center gap-8 w-full">
          <button 
            onClick={() => setAjuste(a => a - 1)}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
          </button>
          
          <div className="flex flex-col items-center justify-center min-w-[80px]">
            <span className={`text-4xl font-black tracking-tight ${ajuste > 0 ? 'text-emerald-400' : ajuste < 0 ? 'text-red-400' : 'text-white'}`}>
              {ajuste > 0 ? `+${ajuste}` : ajuste}
            </span>
          </div>

          <button 
            onClick={() => setAjuste(a => a + 1)}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>

        <div className="w-full h-px bg-white/10"></div>

        <div className="flex items-center justify-between w-full px-2">
          <span className="text-sm font-medium text-gray-400">Stock resultante:</span>
          <span className="text-2xl font-bold text-white">{finalStock}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mt-4 relative min-h-[50px]">
        {status === 'success' && <span className="text-sm text-emerald-400 font-bold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ¡Stock actualizado!</span>}
        {status === 'error' && <span className="text-xs text-red-400 bg-red-950/80 px-4 py-2 rounded-lg border border-red-900/50 text-center w-full">{errorMessage}</span>}
        
        {status !== 'success' && (
          <Button variant="primary" className="w-full py-4 text-base font-bold shadow-lg shadow-[#F400A1]/20" onClick={handleSave} disabled={!canSave} isLoading={status === 'saving'}>
            Confirmar Ajuste
          </Button>
        )}
      </div>
    </div>
  )
}

function AgregarColorRow({
  productoId,
  precioSugerido,
  onSuccess,
  onCancel,
}: {
  productoId: string;
  precioSugerido: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [color, setColor] = useState('');
  const [precio, setPrecio] = useState(precioSugerido);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const colorFinal = capitalizarColor(color);
    if (!colorFinal || precio <= 0) {
      setStatus('error');
      setErrorMsg('Completá color y precio.');
      return;
    }
    setStatus('saving');
    setErrorMsg('');
    const res = await agregarColorAProducto(productoId, colorFinal, precio, 0);
    if (res.status === 'success') {
      onSuccess();
    } else {
      setStatus('error');
      setErrorMsg(res.message);
    }
  };

  return (
    <tr className="bg-emerald-500/5 border border-emerald-500/20">
      <td className="px-3 py-2 text-gray-500 font-mono text-xs italic text-center" colSpan={1}>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase leading-tight">Nuevo<br/>Color</span>
          <span className="text-[9px] text-gray-500 leading-tight">Todos los<br/>talles</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          placeholder="Ej: Negro"
          value={color}
          onChange={e => setColor(e.target.value.slice(0, MAX_COLOR_LENGTH))}
          onBlur={e => setColor(capitalizarColor(e.target.value))}
          maxLength={MAX_COLOR_LENGTH}
          className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
        />
      </td>
      <td className="px-3 py-2 text-center text-xs text-gray-500 italic">
        0 uds
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio"
          value={precio || ''}
          onChange={e => setPrecio(Number(e.target.value))}
          className="w-24 mx-auto bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 flex-col">
          <div className="flex gap-1.5">
            <button onClick={handleSave} disabled={status === 'saving'} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50">
              {status === 'saving' ? '...' : 'Crear'}
            </button>
            <button onClick={onCancel} disabled={status === 'saving'} className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50">
              Cancelar
            </button>
          </div>
          {status === 'error' && <span className="text-[10px] text-red-400 max-w-[120px] text-center leading-tight">{errorMsg}</span>}
        </div>
      </td>
    </tr>
  );
}

function MobileAgregarColor({
  productoId,
  precioSugerido,
  onSuccess,
  onCancel,
}: {
  productoId: string;
  precioSugerido: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [color, setColor] = useState('');
  const [precio, setPrecio] = useState(precioSugerido);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    const colorFinal = capitalizarColor(color);
    if (!colorFinal || precio <= 0) {
      setStatus('error'); setErrorMsg('Completá color y precio.'); return;
    }
    setStatus('saving'); setErrorMsg('');
    const res = await agregarColorAProducto(productoId, colorFinal, precio, 0);
    if (res.status === 'success') { onSuccess(); }
    else { setStatus('error'); setErrorMsg(res.message); }
  };

  return (
    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3">
      <div>
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Nuevo Color</p>
        <p className="text-[10px] text-gray-400">Se creará con 0 stock inicial.</p>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Color</label>
          <input type="text" placeholder="Ej: Negro" value={color} onChange={e => setColor(e.target.value.slice(0, MAX_COLOR_LENGTH))} onBlur={e => setColor(capitalizarColor(e.target.value))} maxLength={MAX_COLOR_LENGTH} className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Precio de lista</label>
          <input type="number" min="0" step="0.01" placeholder="0" value={precio || ''} onChange={e => setPrecio(Number(e.target.value))} className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
      </div>
      {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={handleSave} isLoading={status === 'saving'} disabled={status === 'saving'}>Crear</Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={status === 'saving'}>Cancelar</Button>
      </div>
    </div>
  );
}

function MobileColorGroupBlock({ productoId, grupo, onRefresh, onSelectVariant }: { productoId: string, grupo: VariantColorGroup, onRefresh: () => void, onSelectVariant: (v: VarianteStock) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(grupo.precio);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const handleSavePrice = async () => {
    setStatus('saving');
    const res = await actualizarPrecioColor(productoId, grupo.color, newPrice);
    if (res.status === 'success') {
      setStatus('idle');
      setIsEditingPrice(false);
      onRefresh();
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden p-3 shadow-sm">
      <div className={`flex flex-col pb-3 gap-2 transition-colors border-b ${isOpen ? 'border-white/5 mb-1' : 'border-transparent mb-0 pb-0'}`}>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex items-center gap-2 focus:outline-none flex-1 text-left"
          >
            <div className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90 text-white' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <span className="font-bold text-white uppercase tracking-wider">{grupo.color}</span>
          </button>
          {!isEditingPrice && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-emerald-400 font-mono text-sm">{grupo.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
              <button onClick={() => { setNewPrice(grupo.precio); setIsEditingPrice(true); }} className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            </div>
          )}
        </div>
        {isEditingPrice && (
          <div className="flex items-center gap-2 w-full mt-1">
            <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="flex-1 min-w-0 bg-[#0F0F12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={handleSavePrice} disabled={status === 'saving'} className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold transition-colors">OK</button>
            <button onClick={() => setIsEditingPrice(false)} disabled={status === 'saving'} className="px-3 py-2 bg-zinc-800 text-gray-300 rounded-lg text-sm font-bold transition-colors">X</button>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="flex flex-col gap-2 mt-1">
          {grupo.variantes.map((v) => {
            const isCritical = v.cantidad < 3;
            const isOutOfStock = v.cantidad === 0;
            return (
              <button
                key={v.id}
                onClick={() => onSelectVariant(v)}
                className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#0F0F12] hover:border-white/10 active:bg-white/5 transition-colors text-left ${isCritical ? 'border-red-500/20 bg-red-500/5' : ''}`}
              >
                <span className="text-white font-bold text-base">{v.talle}</span>
                <div className="flex items-center gap-3">
                  <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
                    {v.cantidad} uds
                  </Badge>
                  <div className="text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}

function MobileProductSheetContent({ product, onDelete }: { product: Producto, onDelete: () => void }) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<VarianteStock | null>(null);
  const [showAgregarColor, setShowAgregarColor] = useState(false);

  if (selectedVariant) {
    return <MobileVariantAdjust variante={selectedVariant} onBack={() => setSelectedVariant(null)} />;
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      {product?.variantes_stock?.length === 0 && !showAgregarColor ? (
        <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene variantes.</p>
      ) : (
        groupVariantsByColor(product?.variantes_stock || []).map(grupo => (
          <MobileColorGroupBlock 
            key={grupo.color} 
            productoId={product.id} 
            grupo={grupo} 
            onRefresh={() => router.refresh()} 
            onSelectVariant={setSelectedVariant} 
          />
        ))
      )}

      {showAgregarColor && (
        <MobileAgregarColor
          productoId={product.id}
          precioSugerido={product.variantes_stock?.[0]?.precio ?? 0}
          onSuccess={() => { setShowAgregarColor(false); router.refresh(); }}
          onCancel={() => setShowAgregarColor(false)}
        />
      )}

      <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
        {!showAgregarColor && (
          <button
            onClick={() => setShowAgregarColor(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Agregar color
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          Eliminar producto
        </button>
      </div>
    </div>
  )
}

function ColorGroupBlock({ productoId, grupo, onRefresh }: { productoId: string, grupo: VariantColorGroup, onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(grupo.precio);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const handleSavePrice = async () => {
    setStatus('saving');
    const res = await actualizarPrecioColor(productoId, grupo.color, newPrice);
    if (res.status === 'success') {
      setStatus('idle');
      setIsEditingPrice(false);
      onRefresh();
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="mb-4 bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden shadow-sm">
      <div className={`bg-[#23232A]/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b transition-colors ${isOpen ? 'border-white/5' : 'border-transparent'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex items-center gap-2 focus:outline-none group"
          >
            <div className={`text-gray-500 transition-transform group-hover:text-white ${isOpen ? 'rotate-90 text-white' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <span className="font-bold text-white uppercase tracking-wider">{grupo.color}</span>
          </button>
          <div className="hidden sm:block h-4 w-px bg-white/10" />
          {isEditingPrice ? (
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-24 bg-[#0F0F12] border border-white/10 rounded px-2 py-1 text-xs text-white" />
              <button onClick={handleSavePrice} disabled={status === 'saving'} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold hover:bg-emerald-500/30 transition-colors">Guardar</button>
              <button onClick={() => setIsEditingPrice(false)} disabled={status === 'saving'} className="px-2 py-1 text-gray-400 text-xs hover:text-white transition-colors">Cancelar</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">{grupo.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
              <button onClick={() => { setNewPrice(grupo.precio); setIsEditingPrice(true); }} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-bold underline decoration-white/20 underline-offset-2">Editar precio</button>
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                <th className="px-4 py-2">Talle</th>
                <th className="px-4 py-2 text-center">Stock Actual</th>
                <th className="px-4 py-2 text-center w-32">Nuevo Stock</th>
                <th className="px-4 py-2 text-center w-28">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {grupo.variantes.map((v) => (
                <StockVariantRow key={v.id} variante={v} hideColor={true} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StockProductRow({ product, categoryMap, onDelete }: { product: Producto, categoryMap: Record<string, string>, onDelete: () => void }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAgregarColor, setShowAgregarColor] = useState(false);
  
  const variants = sortVariants(product.variantes_stock || []);
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
              {variants.length === 0 && !showAgregarColor ? (
                <p className="text-sm text-gray-500 text-center py-2">Este producto no tiene variantes.</p>
              ) : (
                <div className="flex flex-col gap-2">
          {groupVariantsByColor(variants).map(grupo => (
                    <ColorGroupBlock key={grupo.color} productoId={product.id} grupo={grupo} onRefresh={() => router.refresh()} />
                  ))}
                  {showAgregarColor && (
                    <div className="bg-[#1A1A20] rounded-xl border border-emerald-500/20 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-white/5 text-sm">
                            <AgregarColorRow
                              productoId={product.id}
                              precioSugerido={variants[0]?.precio ?? 0}
                              onSuccess={() => { setShowAgregarColor(false); router.refresh(); }}
                              onCancel={() => setShowAgregarColor(false)}
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex items-center gap-3">
                {!showAgregarColor && (
                  <button
                    onClick={() => setShowAgregarColor(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Agregar color
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  Eliminar producto
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function StockManager({ productos, categorias, initialSearch = '' }: StockManagerProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [hideOutOfStock, setHideOutOfStock] = useState(false)

  const [deletingProduct, setDeletingProduct] = useState<Producto | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteInitiate = (product: Producto) => {
    setDeletingProduct(product);
    setDeleteStep(1);
    setDeleteStatus('idle');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleteStatus('deleting');
    setDeleteError('');
    const res = await eliminarProducto(deletingProduct.id);
    if (res.status === 'success') {
      setDeletingProduct(null);
      setSelectedProduct(null);
      router.refresh();
    } else {
      setDeleteStatus('error');
      setDeleteError(res.message);
    }
  };

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
          className="w-full sm:w-80 pl-10 pr-10"
        />
        <span className="absolute left-3 top-3 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
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
            <StockProductRow key={prod.id} product={prod} categoryMap={categoryMap} onDelete={() => handleDeleteInitiate(prod)} />
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
        {selectedProduct && <MobileProductSheetContent product={selectedProduct} onDelete={() => handleDeleteInitiate(selectedProduct)} />}
      </BottomSheet>

      {/* ─── Modal Eliminación (2-step) ───────────────────────── */}
      {deletingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] w-full max-w-md rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Eliminar Producto</h3>
                  <p className="text-sm text-red-400 mt-0.5">Acción destructiva</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/5">
                <p className="text-sm text-gray-300">
                  Estás a punto de eliminar <strong>{deletingProduct.nombre}</strong>.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Esto borrará también todas sus variantes, fotos y precios. Esta acción <span className="font-bold text-white">no se puede deshacer</span>.
                </p>
              </div>

              {deleteStep === 2 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fadeIn">
                  <p className="text-sm text-red-400 font-bold uppercase tracking-widest mb-1">Confirmación final</p>
                  <p className="text-sm text-red-300">
                    ¿Estás 100% seguro de eliminar este producto del catálogo?
                  </p>
                </div>
              )}

              {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{deleteError}</div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-between items-center gap-3 bg-[#1A1A20]">
              <button 
                onClick={() => setDeletingProduct(null)} 
                disabled={deleteStatus === 'deleting'} 
                className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              
              {deleteStep === 1 ? (
                <button
                  onClick={() => setDeleteStep(2)}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl border border-red-500/20 transition-all"
                >
                  Sí, quiero eliminarlo
                </button>
              ) : (
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteStatus === 'deleting'}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteStatus === 'deleting' ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
