'use client'

/* eslint-disable @next/next/no-img-element -- Supabase public URLs are runtime-configured and cannot be safely enumerated in next/image remotePatterns. */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Producto, Categoria, VarianteStock } from '@/types'
import { actualizarProducto, setPromocion, clearPromocion } from '@/lib/productoService'
import { actualizarVariante, eliminarVariante } from '@/lib/variantesService'
import { subirImagenProducto } from '@/lib/inventarioService'
import { Switch, BottomSheet, Badge, Button } from '@/components/admin/ui'
import { groupVariantsByColor } from './variantUtils'

// Normaliza un nombre de color: primera letra mayúscula, resto minúsculas
function capitalizarColor(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const MAX_COLOR_LENGTH = 20;

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
  productoNombre,
  onRefresh,
}: {
  variante: VarianteStock;
  tallesDisponibles: string[];
  productoNombre: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [talle, setTalle] = useState(variante.talle);
  const [color, setColor] = useState(variante.color);
  const [visible, setVisible] = useState(variante.visible_en_catalogo);

  const isCritical = variante.cantidad === 1;
  const isOutOfStock = variante.cantidad === 0;

  const handleCancel = () => {
    setTalle(variante.talle);
    setColor(variante.color);
    setVisible(variante.visible_en_catalogo);
    setStatus('idle');
    setErrorMsg('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    const res = await actualizarVariante(variante.id, { talle, color, visible_en_catalogo: visible });
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
              onChange={e => setColor(e.target.value.slice(0, MAX_COLOR_LENGTH))}
              onBlur={e => setColor(capitalizarColor(e.target.value))}
              maxLength={MAX_COLOR_LENGTH}
              placeholder="Ej: Negro"
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#F400A1]"
            />
          </td>
          <td className="px-3 py-2 text-right">
            <div className="flex flex-col items-end">
              <span className="text-gray-300 text-xs">
                {variante.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
              <span className="text-[9px] text-gray-500 leading-tight mt-0.5" title="El precio se edita de a grupos de color desde la pestaña Stock">
                Editá en Stock
              </span>
            </div>
          </td>
          <td className="px-3 py-2 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
                {variante.cantidad} uds
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/stock?buscar=${encodeURIComponent(productoNombre)}`)}
                className="px-2 py-0.5 h-auto text-[10px]"
              >
                Ver en Stock
              </Button>
            </div>
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



// Sub-componente: fila de producto (expandible)
// ─────────────────────────────────────────────
function ProductRow({
  product,
  categoryMap,
  tallesPorTipo,
  onEdit,
  onPromo,
  onRefresh,
}: {
  product: Producto;
  categoryMap: Record<string, string>;
  tallesPorTipo: TallePorTipo[];
  onEdit: (p: Producto) => void;
  onPromo: (p: Producto) => void;
  onRefresh: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [coloresAbiertos, setColoresAbiertos] = useState<Set<string>>(new Set());

  const toggleColor = (color: string) => {
    setColoresAbiertos(prev => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  const tallesDisponibles = tallesPorTipo
    .filter(t => t.tipo_talle === product.tipo_talle)
    .map(t => t.talle);

  const variants: VarianteStock[] = [...(product.variantes_stock || [])].sort((a, b) => {
    const idxA = tallesDisponibles.indexOf(a.talle);
    const idxB = tallesDisponibles.indexOf(b.talle);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.talle.localeCompare(b.talle);
  });

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
        <td className="px-6 py-4 text-right font-medium text-white">
          <div className="flex flex-col items-end gap-0.5">
            {product.precio_promocional ? (
              <>
                <span className="text-[#F400A1] font-bold text-sm">
                  {product.precio_promocional.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </span>
                <span className="text-gray-500 line-through text-xs">{priceDisplay}</span>
              </>
            ) : (
              <span>{priceDisplay}</span>
            )}
          </div>
        </td>
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
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(product)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onPromo(product)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                product.precio_promocional
                  ? 'bg-[#F400A1]/10 border-[#F400A1]/30 text-[#F400A1] hover:bg-[#F400A1]/20'
                  : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              {product.precio_promocional ? '🏷 En oferta' : 'Promoción'}
            </button>
          </div>
        </td>

      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-white/5 bg-black/20">
            <div className="px-12 py-5">
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">Este producto no tiene variantes de stock.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {groupVariantsByColor(variants, tallesDisponibles).map(grupo => {
                    const isOpen = coloresAbiertos.has(grupo.color);
                    return (
                      <div key={grupo.color} className="bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden shadow-inner">
                        <button
                          onClick={() => toggleColor(grupo.color)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#0F0F12] hover:bg-white/[0.02] transition-colors border-b border-transparent data-[open=true]:border-white/5"
                          data-open={isOpen}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white uppercase tracking-wider text-sm">{grupo.color}</span>
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{grupo.variantes.length} talles</span>
                          </div>
                          <div className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90 text-white' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#15151A] text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5">
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
                                {grupo.variantes.map((v) => (
                                  <VarianteRow
                                    key={v.id}
                                    variante={v}
                                    tallesDisponibles={tallesDisponibles}
                                    productoNombre={product.nombre}
                                    onRefresh={onRefresh}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
  productoNombre,
  onRefresh,
}: {
  variante: VarianteStock;
  tallesDisponibles: string[];
  productoNombre: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [talle, setTalle] = useState(variante.talle);
  const [color, setColor] = useState(variante.color);
  const [visible, setVisible] = useState(variante.visible_en_catalogo);

  const isCritical = variante.cantidad < 3;
  const isOutOfStock = variante.cantidad === 0;

  const handleCancel = () => {
    setTalle(variante.talle); setColor(variante.color);
    setVisible(variante.visible_en_catalogo);
    setStatus('idle'); setErrorMsg(''); setIsEditing(false);
  };

  const handleSave = async () => {
    setStatus('saving'); setErrorMsg('');
    const res = await actualizarVariante(variante.id, { talle, color, visible_en_catalogo: visible });
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
            <input type="text" value={color}
              onChange={e => setColor(e.target.value.slice(0, MAX_COLOR_LENGTH))}
              onBlur={e => setColor(capitalizarColor(e.target.value))}
              maxLength={MAX_COLOR_LENGTH}
              placeholder="Ej: Negro"
              className="w-full bg-[#0F0F12] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F400A1]" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-gray-300 text-sm font-medium">
              {variante.precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </span>
            <span className="text-[10px] text-gray-500 leading-tight mt-0.5">
              Editá en Stock
            </span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Stock</label>
            <div className="flex items-center justify-between bg-[#0F0F12] border border-white/10 rounded-lg px-3 py-1.5 min-h-[38px]">
              <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'success'} pulse={isCritical}>
                {variante.cantidad} uds
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/stock?buscar=${encodeURIComponent(productoNombre)}`)}
                className="px-2 py-1 h-auto text-[10px]"
              >
                Ver en Stock
              </Button>
            </div>
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
  const variants: VarianteStock[] = product.variantes_stock || [];
  const tallesDisponibles = tallesPorTipo
    .filter(t => t.tipo_talle === product.tipo_talle)
    .map(t => t.talle);

  const [coloresAbiertos, setColoresAbiertos] = useState<Set<string>>(new Set());

  const toggleColor = (color: string) => {
    setColoresAbiertos(prev => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Variantes agrupadas por color */}
      {variants.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene variantes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groupVariantsByColor(variants).map(grupo => {
            const isOpen = coloresAbiertos.has(grupo.color);
            return (
              <div key={grupo.color} className="bg-[#1A1A20] rounded-xl border border-white/5 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleColor(grupo.color)}
                  className="w-full flex items-center justify-between p-3 bg-[#0F0F12] hover:bg-white/[0.02] transition-colors border-b border-transparent data-[open=true]:border-white/5"
                  data-open={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white uppercase tracking-wider text-sm">{grupo.color}</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{grupo.variantes.length} talles</span>
                  </div>
                  <div className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90 text-white' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
                
                {isOpen && (
                  <div className="flex flex-col gap-px bg-white/5">
                    {grupo.variantes.map((v) => (
                      <div key={v.id} className="bg-[#0F0F12] p-1">
                        <MobileVarianteItem variante={v} tallesDisponibles={tallesDisponibles} productoNombre={product.nombre} onRefresh={onRefresh} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Acciones del pie */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5 mt-2">
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
    imagenes: string[];
  } | null>(null)
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [editError, setEditError] = useState('')
  const [archivosImagenes, setArchivosImagenes] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [selectedProductSheet, setSelectedProductSheet] = useState<Producto | null>(null)
  const [promoProduct, setPromoProduct] = useState<Producto | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [promoError, setPromoError] = useState('')

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

  const filterKey = `${searchTerm}\u0000${selectedCategoryId ?? ''}\u0000${hideOutOfStock}`;
  const [pagination, setPagination] = useState({ key: '', count: 20 });
  const cantidadVisibleAdmin = pagination.key === filterKey ? pagination.count : 20;
  const showMore = () => setPagination({ key: filterKey, count: cantidadVisibleAdmin + 20 });

  const visibleProducts = filteredProducts.slice(0, cantidadVisibleAdmin);

  const handleEdit = (product: Producto) => {
    setEditingProduct({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      categoria_id: product.categoria_id,
      genero: product.genero || 'Unisex',
      tipo_talle: product.tipo_talle,
      activo: product.activo,
      imagenes: product.imagenes || [],
    });
    setArchivosImagenes([]);
    setEditStatus('idle');
    setEditError('');
  };

  const handlePromo = (product: Producto) => {
    setPromoProduct(product);
    setPromoInput(product.precio_promocional ? String(product.precio_promocional) : '');
    setPromoStatus('idle');
    setPromoError('');
  };

  const handleSavePromo = async () => {
    if (!promoProduct) return;
    const precio = parseFloat(promoInput);
    const precioBase = Math.min(...(promoProduct.variantes_stock || []).map(v => v.precio).filter(p => p > 0));
    if (isNaN(precio) || precio <= 0) {
      setPromoError('Ingresá un precio válido mayor a 0.'); return;
    }
    if (precio >= precioBase) {
      setPromoError(`El precio de oferta debe ser menor al precio base (${precioBase.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}).`); return;
    }
    setPromoStatus('saving');
    const res = await setPromocion(promoProduct.id, precio);
    if (res.status === 'success') { setPromoProduct(null); router.refresh(); }
    else { setPromoStatus('error'); setPromoError(res.message); }
  };

  const handleClearPromo = async () => {
    if (!promoProduct) return;
    setPromoStatus('saving');
    const res = await clearPromocion(promoProduct.id);
    if (res.status === 'success') { setPromoProduct(null); router.refresh(); }
    else { setPromoStatus('error'); setPromoError(res.message); }
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
                className="w-full sm:w-80 bg-[#23232A] text-white placeholder-gray-500 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow" />
              <span className="absolute left-3 top-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
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
              {visibleProducts.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No se encontraron productos que coincidan con la búsqueda.</td></tr>
              ) : (
                visibleProducts.map(prod => (
                  <ProductRow key={prod.id} product={prod} categoryMap={categoryMap} tallesPorTipo={tallesPorTipo} onEdit={handleEdit} onPromo={handlePromo} onRefresh={() => router.refresh()} />
                ))
              )}
            </tbody>
          </table>
          
          {cantidadVisibleAdmin < filteredProducts.length && (
            <div className="p-4 flex justify-center border-t border-white/5 bg-[#0F0F12]">
              <button 
                onClick={showMore}
                className="px-6 py-2.5 border border-[#F400A1]/50 text-[#F400A1] font-bold rounded-xl hover:bg-[#F400A1]/10 transition-colors text-sm"
              >
                Ver más productos
              </button>
            </div>
          )}
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
          {visibleProducts.length === 0 ? (
            <div className="bg-[#1A1A20] rounded-2xl border border-white/5 p-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron productos.</p>
            </div>
          ) : (
            <>
              {visibleProducts.map(prod => {
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
              })}
              {cantidadVisibleAdmin < filteredProducts.length && (
                <div className="flex justify-center mt-2">
                  <button 
                    onClick={showMore}
                    className="px-6 py-3 border border-[#F400A1]/50 text-[#F400A1] font-bold rounded-xl hover:bg-[#F400A1]/10 transition-colors text-sm"
                  >
                    Ver más productos
                  </button>
                </div>
              )}
            </>
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

      {/* ─── Modal Eliminación (2-step) ───────────────────────── */}
      {/* Removido hacia StockManager.tsx */}

      {/* ─── Modal Promoción ────────────────────────────────────── */}
      {promoProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Aplicar Promoción</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[280px]">{promoProduct.nombre}</p>
              </div>
              <button onClick={() => setPromoProduct(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Precio actual */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F0F12] border border-white/5">
                <span className="text-sm text-gray-400">Precio base actual</span>
                <span className="font-bold text-white text-sm">
                  {Math.min(...(promoProduct.variantes_stock || []).filter(v => v.precio > 0).map(v => v.precio))
                    .toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </span>
              </div>

              {/* Input precio promo */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Precio de oferta <span className="text-[#F400A1]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ingresá el precio promocional..."
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value); setPromoStatus('idle'); setPromoError(''); }}
                    className="w-full bg-[#23232A] text-white border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F400A1] transition-shadow"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Debe ser menor al precio base. El precio original se verá tachado en la tienda.</p>
              </div>

              {promoError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{promoError}</div>
              )}

              {promoProduct.precio_promocional && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F400A1]/5 border border-[#F400A1]/20 text-sm text-[#F400A1]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 13H11v-5h2v5Zm0-7H11V6h2v2Z"/></svg>
                  Oferta activa: {Number(promoProduct.precio_promocional).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-between items-center gap-3 bg-[#1A1A20]">
              <div>
                {promoProduct.precio_promocional && (
                  <button
                    onClick={handleClearPromo}
                    disabled={promoStatus === 'saving'}
                    className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Quitar oferta
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPromoProduct(null)} disabled={promoStatus === 'saving'} className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  onClick={handleSavePromo}
                  disabled={promoStatus === 'saving' || !promoInput}
                  className="px-5 py-2.5 bg-[#F400A1] hover:bg-[#D000A0] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#F400A1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoStatus === 'saving' ? 'Guardando...' : 'Aplicar oferta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <option value="estandar">Estándar (XS a 4XL)</option>
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

              {/* Manejo de Imágenes */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-gray-400 mb-3">Imágenes del Producto</label>
                
                {/* Imágenes Actuales */}
                {editingProduct.imagenes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Imágenes actuales ({editingProduct.imagenes.length}):</p>
                    <div className="grid grid-cols-4 gap-3">
                      {editingProduct.imagenes.map((img, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square bg-zinc-900">
                          <img src={img} alt={`Imagen ${i}`} className="w-full h-full object-cover" />
                          
                          {/* Botón Borrar */}
                          <button 
                            type="button" 
                            onClick={() => setEditingProduct({ ...editingProduct, imagenes: editingProduct.imagenes.filter((_, idx) => idx !== i) })}
                            className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                            title="Eliminar imagen"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>

                          {/* Controles de Orden (Mover Izquierda/Derecha) */}
                          <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => {
                                const newImgs = [...editingProduct.imagenes];
                                [newImgs[i - 1], newImgs[i]] = [newImgs[i], newImgs[i - 1]];
                                setEditingProduct({ ...editingProduct, imagenes: newImgs });
                              }}
                              className="bg-black/60 hover:bg-black/80 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Mover a la izquierda"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <button
                              type="button"
                              disabled={i === editingProduct.imagenes.length - 1}
                              onClick={() => {
                                const newImgs = [...editingProduct.imagenes];
                                [newImgs[i], newImgs[i + 1]] = [newImgs[i + 1], newImgs[i]];
                                setEditingProduct({ ...editingProduct, imagenes: newImgs });
                              }}
                              className="bg-black/60 hover:bg-black/80 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Mover a la derecha"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subir Nuevas */}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Añadir nuevas imágenes:</p>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setArchivosImagenes(prev => [...prev, ...newFiles]);
                      }
                    }}
                    disabled={isUploadingImages || editStatus === 'saving'}
                    className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer mb-2"
                  />
                  {archivosImagenes.length > 0 && (
                    <ul className="text-sm space-y-1">
                      {archivosImagenes.map((file, i) => (
                        <li key={i} className="flex justify-between items-center bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">
                          <span className="truncate text-zinc-300 max-w-[200px]" title={file.name}>{file.name}</span>
                          <button type="button" onClick={() => setArchivosImagenes(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 ml-2 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {editStatus === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{editError}</div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#1A1A20]">
              <button onClick={() => setEditingProduct(null)} disabled={editStatus === 'saving' || isUploadingImages}
                className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors disabled:opacity-50">Cancelar</button>
              <button
                onClick={async () => {
                  setEditStatus('saving'); 
                  setEditError('');
                  setIsUploadingImages(true);
                  
                  const newUrls: string[] = [];
                  if (archivosImagenes.length > 0) {
                    for (const file of archivosImagenes) {
                      const res = await subirImagenProducto(file);
                      if (res.error) {
                        setEditStatus('error');
                        setEditError(res.error);
                        setIsUploadingImages(false);
                        return;
                      }
                      if (res.url) newUrls.push(res.url);
                    }
                  }
                  
                  const finalImages = [...editingProduct.imagenes, ...newUrls];

                  const res = await actualizarProducto(editingProduct.id, {
                    nombre: editingProduct.nombre, 
                    descripcion: editingProduct.descripcion,
                    categoria_id: editingProduct.categoria_id, 
                    genero: editingProduct.genero,
                    tipo_talle: editingProduct.tipo_talle, 
                    activo: editingProduct.activo,
                    imagenes: finalImages,
                  });
                  
                  setIsUploadingImages(false);
                  if (res.status === 'success') { 
                    setEditStatus('success'); 
                    setEditingProduct(null); 
                    setArchivosImagenes([]);
                    router.refresh(); 
                  } else { 
                    setEditStatus('error'); 
                    setEditError(res.message); 
                  }
                }}
                disabled={editStatus === 'saving' || isUploadingImages || !editingProduct.nombre || !editingProduct.categoria_id}
                className="px-5 py-2.5 bg-[#F400A1] hover:bg-[#D000A0] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#F400A1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isUploadingImages ? 'Subiendo imágenes...' : editStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
