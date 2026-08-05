'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Producto, Categoria, VarianteStock } from '@/types'
import { actualizarProducto } from '@/lib/productoService'
import { crearVariante, actualizarVariante, eliminarVariante } from '@/lib/variantesService'
import { Switch, BottomSheet, Badge, Button } from '@/components/admin/ui'

interface TallePorTipo {
  tipo_talle: string;
  talle: string;
  orden: number;
}

interface ProductTableProps {
  productos: Producto[];
  categorias: Categoria[];
  tallesPorTipo: TallePorTipo[];
}

// ─────────────────────────────────────────────
// Sub-componente: fila de variante (editable)
// ─────────────────────────────────────────────
function VarianteRow({
  variante,
  tallesDisponibles,
  onRefresh,
}: {
  variante: VarianteStock;
  tallesDisponibles: string[];
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [talle, setTalle] = useState(variante.talle);
  const [color, setColor] = useState(variante.color);
  const [cantidad, setCantidad] = useState(variante.cantidad);
  const [precio, setPrecio] = useState(variante.precio);
  const [visible, setVisible] = useState(variante.visible_en_catalogo);

  const isCritical = variante.cantidad < 3;
  const isOutOfStock = variante.cantidad === 0;

  const handleCancel = () => {
    setTalle(variante.talle);
    setColor(variante.color);
    setCantidad(variante.cantidad);
    setPrecio(variante.precio);
    setVisible(variante.visible_en_catalogo);
    setStatus('idle');
    setErrorMsg('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    const res = await actualizarVariante(variante.id, { talle, color, cantidad, precio, visible_en_catalogo: visible });
    if (res.status === 'success') {
      setIsEditing(false);
      setStatus('idle');
      onRefresh();
    } else {
      setStatus('error');
      setErrorMsg(res.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que querés eliminar esta variante? Esta acción no se puede deshacer.')) return;
    const res = await eliminarVariante(variante.id);
    if (res.status === 'success') {
      onRefresh();
    } else {
      alert(`Error al eliminar: ${res.message}`);
    }
  };

  if (isEditing) {
    return (
      <>
        <tr className="bg-[#F400A1]/5 border border-[#F400A1]/20">
          <td className="px-3 py-2 text-gray-500 font-mono text-xs">{variante.id.split('-')[0]}...</td>
          <td className="px-3 py-2">
            <select
              value={talle}
              onChange={e => setTalle(e.target.value)}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#F400A1]"
            >
              {tallesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
              {/* Siempre incluir el talle actual aunque no esté en la lista */}
              {!tallesDisponibles.includes(talle) && <option value={talle}>{talle} (actual)</option>}
            </select>
          </td>
          <td className="px-3 py-2">
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#F400A1]"
            />
          </td>
          <td className="px-3 py-2 text-right">
            <input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={e => setPrecio(Number(e.target.value))}
              className="w-24 bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#F400A1]"
            />
          </td>
          <td className="px-3 py-2 text-center">
            <input
              type="number"
              min="0"
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="w-16 bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#F400A1]"
            />
          </td>
          <td className="px-3 py-2 text-center">
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${visible ? 'bg-[#F400A1]' : 'bg-zinc-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${visible ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </td>
          <td className="px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5 flex-col">
              <div className="flex gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  className="px-2.5 py-1 bg-[#F400A1] hover:bg-[#D000A0] text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {status === 'saving' ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={status === 'saving'}
                  className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
              {status === 'error' && (
                <span className="text-[10px] text-red-400 max-w-[120px] text-center leading-tight">{errorMsg}</span>
              )}
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <tr className={`${isCritical ? 'bg-red-500/[0.02]' : 'hover:bg-white/[0.02]'} transition-colors`}>
      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{variante.id.split('-')[0]}...</td>
      <td className="px-4 py-3 text-gray-300 font-semibold">{variante.talle}</td>
      <td className="px-4 py-3 text-gray-300">{variante.color}</td>
      <td className="px-4 py-3 text-right text-gray-300">
        {variante.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] ${
          isOutOfStock
            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
            : isCritical
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-extrabold'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {variante.cantidad} uds
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-[11px] font-semibold ${variante.visible_en_catalogo ? 'text-emerald-400' : 'text-gray-500'}`}>
          {variante.visible_en_catalogo ? 'Visible' : 'Oculta'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold rounded-lg border border-red-500/20 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Sub-componente: fila nueva variante (inline)
// ─────────────────────────────────────────────
function NuevaVarianteRow({
  productoId,
  tallesDisponibles,
  onSuccess,
  onCancel,
}: {
  productoId: string;
  tallesDisponibles: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [talle, setTalle] = useState(tallesDisponibles[0] || '');
  const [color, setColor] = useState('');
  const [cantidad, setCantidad] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    if (!talle || !color || precio <= 0) {
      setStatus('error');
      setErrorMsg('Completá talle, color y precio antes de guardar.');
      return;
    }
    setStatus('saving');
    setErrorMsg('');
    const res = await crearVariante(productoId, talle, color, cantidad, precio, visible);
    if (res.status === 'success') {
      onSuccess();
    } else {
      setStatus('error');
      setErrorMsg(res.message);
    }
  };

  return (
    <tr className="bg-emerald-500/5 border border-emerald-500/20">
      <td className="px-3 py-2 text-gray-500 font-mono text-xs italic">nueva</td>
      <td className="px-3 py-2">
        <select
          value={talle}
          onChange={e => setTalle(e.target.value)}
          className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {tallesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          placeholder="Ej: Negro"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={precio || ''}
          onChange={e => setPrecio(Number(e.target.value))}
          className="w-24 bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs text-right placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="number"
          min="0"
          placeholder="0"
          value={cantidad || ''}
          onChange={e => setCantidad(Number(e.target.value))}
          className="w-16 bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs text-center placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${visible ? 'bg-emerald-500' : 'bg-zinc-600'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${visible ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 flex-col">
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'saving' ? '...' : 'Crear'}
            </button>
            <button
              onClick={onCancel}
              disabled={status === 'saving'}
              className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          {status === 'error' && (
            <span className="text-[10px] text-red-400 max-w-[120px] text-center leading-tight">{errorMsg}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Sub-componente: fila de producto (expandible)
// ─────────────────────────────────────────────
function ProductRow({
  product,
  categoryMap,
  tallesPorTipo,
  onEdit,
  onRefresh,
}: {
  product: Producto;
  categoryMap: Record<string, string>;
  tallesPorTipo: TallePorTipo[];
  onEdit: (p: Producto) => void;
  onRefresh: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNuevaVariante, setShowNuevaVariante] = useState(false);

  const variants: VarianteStock[] = product.variantes_stock || [];

  const tallesDisponibles = tallesPorTipo
    .filter(t => t.tipo_talle === product.tipo_talle)
    .map(t => t.talle);

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
            <div className="px-12 py-5">
              {variants.length === 0 && !showNuevaVariante ? (
                <p className="text-sm text-gray-500 text-center py-2">Este producto no tiene variantes de stock.</p>
              ) : (
                <table className="w-full text-left border-collapse bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden shadow-inner">
                  <thead>
                    <tr className="bg-[#0F0F12] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Talle</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Stock</th>
                      <th className="px-4 py-3 text-center">Visible</th>
                      <th className="px-4 py-3 text-center w-36">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {variants.map(v => (
                      <VarianteRow
                        key={v.id}
                        variante={v}
                        tallesDisponibles={tallesDisponibles}
                        onRefresh={onRefresh}
                      />
                    ))}
                    {showNuevaVariante && (
                      <NuevaVarianteRow
                        productoId={product.id}
                        tallesDisponibles={tallesDisponibles}
                        onSuccess={() => { setShowNuevaVariante(false); onRefresh(); }}
                        onCancel={() => setShowNuevaVariante(false)}
                      />
                    )}
                  </tbody>
                </table>
              )}

              {!showNuevaVariante && (
                <button
                  onClick={() => setShowNuevaVariante(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Agregar variante
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Sub-componente MOBILE: variante editable (apilada, sin tabla)
// ─────────────────────────────────────────────
function MobileVarianteItem({
  variante,
  tallesDisponibles,
  onRefresh,
}: {
  variante: VarianteStock;
  tallesDisponibles: string[];
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [talle, setTalle] = useState(variante.talle);
  const [color, setColor] = useState(variante.color);
  const [cantidad, setCantidad] = useState(variante.cantidad);
  const [precio, setPrecio] = useState(variante.precio);
  const [visible, setVisible] = useState(variante.visible_en_catalogo);

  const isCritical = variante.cantidad < 3;
  const isOutOfStock = variante.cantidad === 0;

  const handleCancel = () => {
    setTalle(variante.talle); setColor(variante.color);
    setCantidad(variante.cantidad); setPrecio(variante.precio);
    setVisible(variante.visible_en_catalogo);
    setStatus('idle'); setErrorMsg(''); setIsEditing(false);
  };

  const handleSave = async () => {
    setStatus('saving'); setErrorMsg('');
    const res = await actualizarVariante(variante.id, { talle, color, cantidad, precio, visible_en_catalogo: visible });
    if (res.status === 'success') { setIsEditing(false); setStatus('idle'); onRefresh(); }
    else { setStatus('error'); setErrorMsg(res.message); }
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border border-[#F400A1]/20 bg-[#F400A1]/5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Talle</label>
            <select value={talle} onChange={e => setTalle(e.target.value)}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F400A1]">
              {tallesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
              {!tallesDisponibles.includes(talle) && <option value={talle}>{talle} (actual)</option>}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Color</label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F400A1]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Precio</label>
            <input type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(Number(e.target.value))}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F400A1]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Stock</label>
            <input type="number" min="0" value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F400A1]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={visible} onChange={setVisible} variant="primary" />
          <span className="text-xs text-gray-400">Visible en catálogo</span>
        </div>
        {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={status === 'saving'} disabled={status === 'saving'}>Guardar</Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={status === 'saving'}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setIsEditing(true)}
      className={`w-full text-left p-3 rounded-xl border border-white/5 bg-[#0F0F12] hover:border-white/10 active:bg-white/5 transition-colors ${ isCritical ? 'border-red-500/20 bg-red-500/5' : '' }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-300">{variante.talle} <span className="text-gray-500 font-normal">· {variante.color}</span></span>
        <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>{variante.cantidad} uds</Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{variante.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
        <span className={`text-[10px] font-semibold ${variante.visible_en_catalogo ? 'text-emerald-400' : 'text-gray-500'}`}>
          {variante.visible_en_catalogo ? 'Visible' : 'Oculta'}
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Sub-componente MOBILE: form nueva variante (apilado)
// ─────────────────────────────────────────────
function MobileNuevaVariante({
  productoId,
  tallesDisponibles,
  onSuccess,
  onCancel,
}: {
  productoId: string;
  tallesDisponibles: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [talle, setTalle] = useState(tallesDisponibles[0] || '');
  const [color, setColor] = useState('');
  const [cantidad, setCantidad] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    if (!talle || !color || precio <= 0) {
      setStatus('error'); setErrorMsg('Completá talle, color y precio antes de guardar.'); return;
    }
    setStatus('saving'); setErrorMsg('');
    const res = await crearVariante(productoId, talle, color, cantidad, precio, visible);
    if (res.status === 'success') { onSuccess(); }
    else { setStatus('error'); setErrorMsg(res.message); }
  };

  return (
    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3">
      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Nueva variante</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Talle</label>
          <select value={talle} onChange={e => setTalle(e.target.value)}
            className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
            {tallesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Color</label>
          <input type="text" placeholder="Ej: Negro" value={color} onChange={e => setColor(e.target.value)}
            className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Precio</label>
          <input type="number" min="0" step="0.01" placeholder="0" value={precio || ''} onChange={e => setPrecio(Number(e.target.value))}
            className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Stock</label>
          <input type="number" min="0" placeholder="0" value={cantidad || ''} onChange={e => setCantidad(Number(e.target.value))}
            className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={visible} onChange={setVisible} variant="success" />
        <span className="text-xs text-gray-400">Visible en catálogo</span>
      </div>
      {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={handleSave} isLoading={status === 'saving'} disabled={status === 'saving'}>Crear</Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={status === 'saving'}>Cancelar</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-componente MOBILE: sheet de variantes de un producto
// ─────────────────────────────────────────────
function MobileProductSheet({
  product,
  tallesPorTipo,
  onEditProduct,
  onClose,
  onRefresh,
}: {
  product: Producto;
  tallesPorTipo: TallePorTipo[];
  onEditProduct: () => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [showNuevaVariante, setShowNuevaVariante] = useState(false);
  const variants: VarianteStock[] = product.variantes_stock || [];
  const tallesDisponibles = tallesPorTipo
    .filter(t => t.tipo_talle === product.tipo_talle)
    .map(t => t.talle);

  return (
    <div className="flex flex-col gap-3">
      {/* Variantes */}
      {variants.length === 0 && !showNuevaVariante ? (
        <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene variantes.</p>
      ) : (
        variants.map(v => (
          <MobileVarianteItem key={v.id} variante={v} tallesDisponibles={tallesDisponibles} onRefresh={onRefresh} />
        ))
      )}

      {/* Form nueva variante */}
      {showNuevaVariante && (
        <MobileNuevaVariante
          productoId={product.id}
          tallesDisponibles={tallesDisponibles}
          onSuccess={() => { setShowNuevaVariante(false); onRefresh(); }}
          onCancel={() => setShowNuevaVariante(false)}
        />
      )}

      {/* Acciones del pie */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
        {!showNuevaVariante && (
          <button
            onClick={() => setShowNuevaVariante(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Agregar variante
          </button>
        )}
        <button
          onClick={() => { onClose(); onEditProduct(); }}
          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          Editar producto
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export function ProductTable({ productos, categorias, tallesPorTipo }: ProductTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{
    id: string;
    nombre: string;
    descripcion: string;
    categoria_id: string;
    genero: string;
    tipo_talle: string;
    activo: boolean;
  } | null>(null)
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [editError, setEditError] = useState('')
  const [selectedProductSheet, setSelectedProductSheet] = useState<Producto | null>(null)

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

  const handleEdit = (product: Producto) => {
    setEditingProduct({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      categoria_id: product.categoria_id,
      genero: product.genero || 'Unisex',
      tipo_talle: product.tipo_talle,
      activo: product.activo,
    });
    setEditStatus('idle');
    setEditError('');
  };

  return (
    <>
      {/* ─── Desktop View ─────────────────────────────────────── */}
      <div className="hidden sm:block bg-[#1A1A20] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
        {/* Cabecera y filtros */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Inventario de Productos</h3>
            <p className="text-sm text-gray-400 mt-1">Catálogo agrupado por producto. Expandí cada fila para gestionar sus variantes.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 px-1 sm:px-3 sm:py-2.5">
              <Switch checked={hideOutOfStock} onChange={setHideOutOfStock} variant="primary" />
              <span className="text-xs font-bold text-gray-400 cursor-pointer select-none" onClick={() => setHideOutOfStock(!hideOutOfStock)}>Ocultar agotados</span>
            </div>
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full sm:w-auto bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow cursor-pointer appearance-none">
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
            </select>
            <div className="relative">
              <input type="text" placeholder="Buscar por nombre, talle o color..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow" />
              <span className="absolute left-3 top-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
            </div>
          </div>
        </div>

        {/* Tabla principal */}
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
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No se encontraron productos que coincidan con la búsqueda.</td></tr>
              ) : (
                filteredProducts.map(prod => (
                  <ProductRow key={prod.id} product={prod} categoryMap={categoryMap} tallesPorTipo={tallesPorTipo} onEdit={handleEdit} onRefresh={() => router.refresh()} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Mobile View ──────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col gap-4">
        {/* Header & filtros */}
        <div className="bg-[#1A1A20] rounded-2xl border border-white/5 shadow-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Inventario</h3>
            <p className="text-sm text-gray-400 mt-1">Tocá un producto para ver y editar sus variantes.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={hideOutOfStock} onChange={setHideOutOfStock} variant="primary" />
              <span className="text-xs font-bold text-gray-400 cursor-pointer select-none" onClick={() => setHideOutOfStock(!hideOutOfStock)}>Ocultar agotados</span>
            </div>
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow cursor-pointer appearance-none">
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
            </select>
            <div className="relative">
              <input type="text" placeholder="Buscar por nombre, talle o color..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow" />
              <span className="absolute left-3 top-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
            </div>
          </div>
        </div>

        {/* Tarjetas de productos */}
        <div className="flex flex-col gap-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron productos.</p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const totalStock = (prod.variantes_stock || []).reduce((sum, v) => sum + v.cantidad, 0);
              const isCritical = totalStock < 3;
              const isOutOfStockTotal = totalStock === 0;
              return (
                <button key={prod.id} onClick={() => setSelectedProductSheet(prod)}
                  className="flex items-center justify-between gap-3 p-4 bg-[#1A1A20] border border-white/5 rounded-2xl shadow-lg hover:border-white/10 active:bg-white/5 transition-colors text-left">
                  <span className="font-bold text-white text-sm flex-1 leading-snug">{prod.nombre}</span>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={isOutOfStockTotal ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
                      {totalStock} uds
                    </Badge>
                    <Badge variant={prod.activo ? 'success' : 'neutral'}>
                      {prod.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Mobile BottomSheet ────────────────────────────────── */}
      <BottomSheet
        isOpen={!!selectedProductSheet}
        onClose={() => setSelectedProductSheet(null)}
        title={selectedProductSheet?.nombre || ''}
      >
        {selectedProductSheet && (
          <MobileProductSheet
            product={selectedProductSheet}
            tallesPorTipo={tallesPorTipo}
            onClose={() => setSelectedProductSheet(null)}
            onEditProduct={() => handleEdit(selectedProductSheet)}
            onRefresh={() => router.refresh()}
          />
        )}
      </BottomSheet>

      {/* ─── Modal edición de producto (desktop + mobile) ─────── */}
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
                <input type="text" value={editingProduct.nombre} onChange={e => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Descripción</label>
                <textarea value={editingProduct.descripcion} onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })}
                  rows={3} className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoría</label>
                <select value={editingProduct.categoria_id} onChange={e => setEditingProduct({ ...editingProduct, categoria_id: e.target.value })}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]">
                  {categorias.map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Género</label>
                <select value={editingProduct.genero} onChange={e => setEditingProduct({ ...editingProduct, genero: e.target.value })}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]">
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Niños">Niños</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tipo de Talle</label>
                <select value={editingProduct.tipo_talle} onChange={e => setEditingProduct({ ...editingProduct, tipo_talle: e.target.value })}
                  className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1]">
                  <option value="unico">Talle Único</option>
                  <option value="sin_talle">Sin Talle</option>
                  <option value="tops">Tops (85/90, etc.)</option>
                  <option value="estandar">Estándar (XS a XXL)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">Cambiar el tipo de talle no modifica las variantes ya creadas, solo afecta las opciones disponibles al agregar nuevas variantes.</p>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button type="button" onClick={() => setEditingProduct({ ...editingProduct, activo: !editingProduct.activo })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingProduct.activo ? 'bg-[#F400A1]' : 'bg-zinc-600'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingProduct.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-300">{editingProduct.activo ? 'Producto visible en catálogo' : 'Producto oculto'}</span>
              </div>
              {editStatus === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{editError}</div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#1A1A20]">
              <button onClick={() => setEditingProduct(null)} disabled={editStatus === 'saving'}
                className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors disabled:opacity-50">Cancelar</button>
              <button
                onClick={async () => {
                  setEditStatus('saving'); setEditError('');
                  const res = await actualizarProducto(editingProduct.id, {
                    nombre: editingProduct.nombre, descripcion: editingProduct.descripcion,
                    categoria_id: editingProduct.categoria_id, genero: editingProduct.genero,
                    tipo_talle: editingProduct.tipo_talle, activo: editingProduct.activo,
                  });
                  if (res.status === 'success') { setEditStatus('success'); setEditingProduct(null); router.refresh(); }
                  else { setEditStatus('error'); setEditError(res.message); }
                }}
                disabled={editStatus === 'saving' || !editingProduct.nombre || !editingProduct.categoria_id}
                className="px-5 py-2.5 bg-[#F400A1] hover:bg-[#D000A0] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#F400A1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {editStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
