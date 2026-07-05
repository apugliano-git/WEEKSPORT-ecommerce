'use client';

import { useState } from 'react';
import { crearArticuloCompleto, NuevaVariante, subirImagenProducto } from '@/lib/inventarioService';

export default function NuevoArticuloPage() {
  // Estado base del producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  
  // RF-09: Manejo de Medios Físicos
  const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Array de variantes a crear
  const [variantes, setVariantes] = useState<NuevaVariante[]>([]);
  
  // Estado volátil para el sub-formulario de variantes
  const [vTalle, setVTalle] = useState('');
  const [vColor, setVColor] = useState('');
  const [vCantidad, setVCantidad] = useState<number>(0);
  const [vPrecio, setVPrecio] = useState<number | ''>('');

  // Estados de interfaz y feedback
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const agregarVariante = () => {
    if (!vTalle || !vColor || vCantidad < 0 || !vPrecio || Number(vPrecio) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Completá Talle, Color, cantidad y un precio mayor a 0.' });
      return;
    }
    
    setVariantes([...variantes, { talle: vTalle, color: vColor, cantidad: vCantidad, precio: Number(vPrecio) }]);
    
    setVTalle('');
    setVColor('');
    setVCantidad(0);
    setVPrecio('');
    setMensaje(null);
  };

  const quitarVariante = (index: number) => {
    setVariantes(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivosImagenes(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !categoriaId) {
      setMensaje({ tipo: 'error', texto: 'Completá los campos obligatorios del artículo (Nombre, Categoría).' });
      return;
    }

    if (variantes.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agregá al menos una variante con stock inicial.' });
      return;
    }

    setIsLoading(true);
    setMensaje(null);

    // 1. Inyectar Medios Multimedia (RF-09)
    const urlsImagenes: string[] = [];
    if (archivosImagenes.length > 0) {
      setIsUploading(true);
      for (const file of archivosImagenes) {
        const res = await subirImagenProducto(file);
        if (res.error) {
          setMensaje({ tipo: 'error', texto: res.error });
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        if (res.url) urlsImagenes.push(res.url);
      }
      setIsUploading(false);
    }

    // 2. Transacción de Base de Datos
    const payload = {
      nombre,
      descripcion,
      categoria_id: categoriaId,
      variantes,
      imagenes: urlsImagenes
    };

    const result = await crearArticuloCompleto(payload);

    if (result.status === 'success') {
      setMensaje({ tipo: 'success', texto: result.message });
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setVariantes([]);
      setArchivosImagenes([]);
    } else {
      setMensaje({ tipo: 'error', texto: result.message });
    }

    setIsLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-zinc-950 font-sans text-white">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Alta de Inventario: Nuevo Artículo</h1>

      {mensaje && (
        <div className={`p-4 mb-6 rounded-xl font-semibold border ${
          mensaje.tipo === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Datos Principales y Multimedia */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5C00]"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            Estructura Base
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre del Artículo *</label>
              <input 
                type="text" 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] outline-none transition-colors"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Botines Tiempo Legend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoría ID (UUID) *</label>
              <input 
                type="text" 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] outline-none transition-colors"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                placeholder="ID relacional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descripción</label>
              <textarea 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] outline-none transition-colors resize-none"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Características..."
              ></textarea>
            </div>

            {/* File Input RF-09 */}
            <div className={`p-4 border rounded-xl transition-all ${
              isUploading ? 'bg-zinc-800/30 border-[#FF5C00]/50 animate-pulse' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                {isUploading ? 'Procesando Medios (CDN)...' : 'Galería (Max 5MB/img)'}
              </label>
              <input 
                type="file" 
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
              />
              {archivosImagenes.length > 0 && !isUploading && (
                <p className="text-xs text-emerald-400 mt-3 font-semibold">{archivosImagenes.length} archivo(s) listo(s) para carga</p>
              )}
            </div>
          </div>
        </div>

        {/* Lote de Variantes */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5C00]"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
            Configuración Física
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Talle *</label>
              <input type="text" className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm outline-none focus:border-zinc-600 transition-colors" value={vTalle} onChange={e => setVTalle(e.target.value)} placeholder="Ej: 42, XL" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Color *</label>
              <input type="text" className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm outline-none focus:border-zinc-600 transition-colors" value={vColor} onChange={e => setVColor(e.target.value)} placeholder="Ej: Negro" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Stock Inicial *</label>
              <input type="number" min="0" className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm outline-none focus:border-zinc-600 transition-colors" value={vCantidad} onChange={e => setVCantidad(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Precio *</label>
              <input type="number" step="0.01" className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm outline-none focus:border-zinc-600 transition-colors" value={vPrecio} onChange={e => setVPrecio(Number(e.target.value) || '')} placeholder="Ej: 35000" />
            </div>
          </div>
          
          <button type="button" onClick={agregarVariante} className="w-full bg-zinc-800 text-zinc-300 py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm font-semibold mb-6 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Añadir Variante
          </button>

          <div className="flex-1 overflow-y-auto pr-1">
            {variantes.length === 0 ? (
              <p className="text-zinc-600 text-sm italic text-center mt-4">Esperando ingreso de variantes...</p>
            ) : (
              <ul className="space-y-3">
                {variantes.map((v, i) => (
                  <li key={i} className="flex justify-between items-center bg-zinc-950 p-3 border border-zinc-800/50 rounded-xl text-sm shadow-inner">
                    <div>
                      <span className="font-bold text-zinc-200 mr-2">{v.talle} - {v.color}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md font-mono font-bold text-xs">PRECIO: ${v.precio}</span>
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md font-mono font-bold text-xs">STOCK: {v.cantidad}</span>
                      <button type="button" onClick={() => quitarVariante(i)} className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Accionador */}
        <div className="md:col-span-2 flex justify-end mt-2 pt-6 border-t border-zinc-800/50">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2 ${
              isLoading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-[#FF5C00] hover:bg-orange-600 shadow-lg shadow-[#FF5C00]/20'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Inyectando Transacción...
              </>
            ) : 'Consolidar Catálogo y Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
