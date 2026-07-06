'use client';

import { useState } from 'react';
import { crearArticuloCompleto, subirImagenProducto } from '@/lib/inventarioService';

export default function NuevoArticuloPage() {
  // Estado base del producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [genero, setGenero] = useState('Unisex');
  
  // RF-09: Manejo de Medios Físicos
  const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Estados del nuevo flujo de stock
  const [tipoTalle, setTipoTalle] = useState('estandar');
  const [precioInicial, setPrecioInicial] = useState<number | ''>('');

  // Estados de interfaz y feedback
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivosImagenes(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !categoriaId || !precioInicial || Number(precioInicial) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Completá los campos obligatorios del artículo (Nombre, Categoría, Precio).' });
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

    // 2. Transacción de Base de Datos vía RPC
    const payload = {
      nombre,
      descripcion,
      categoria_id: categoriaId,
      genero,
      tipo_talle: tipoTalle,
      precio_inicial: Number(precioInicial),
      imagenes: urlsImagenes
    };

    const result = await crearArticuloCompleto(payload);

    if (result.status === 'success') {
      setMensaje({ tipo: 'success', texto: result.message });
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setGenero('Unisex');
      setTipoTalle('estandar');
      setPrecioInicial('');
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            Estructura Base
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre del Artículo *</label>
              <input 
                type="text" 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Botines Tiempo Legend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoría ID (UUID) *</label>
              <input 
                type="text" 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                placeholder="ID relacional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Género</label>
              <select 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
              >
                <option value="Unisex">Unisex</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Niños">Niños</option>
                <option value="Niñas">Niñas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descripción</label>
              <textarea 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors resize-none"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Características..."
              ></textarea>
            </div>

            {/* File Input RF-09 */}
            <div className={`p-4 border rounded-xl transition-all ${
              isUploading ? 'bg-zinc-800/30 border-[#F400A1]/50 animate-pulse' : 'bg-zinc-950 border-zinc-800'
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

        {/* Lote de Variantes (Nuevo Flujo) */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
            Configuración Física y Variantes
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Esquema de Talles *</label>
              <select 
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                value={tipoTalle}
                onChange={(e) => setTipoTalle(e.target.value)}
              >
                <option value="estandar">Estándar (S, M, L, XL, XXL)</option>
                <option value="unico">Único (Talle Único)</option>
                <option value="tops">Tops (niñas) (8, 10, 12, 14)</option>
                <option value="sin_talle">Sin talle (Accesorios)</option>
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                El sistema generará automáticamente las variantes de stock en cantidad 0 basadas en el esquema seleccionado.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Precio Inicial *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-zinc-500">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="w-full p-3 pl-8 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                  value={precioInicial}
                  onChange={(e) => setPrecioInicial(Number(e.target.value) || '')}
                  placeholder="Ej: 35000"
                />
              </div>
            </div>
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
                : 'bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20'
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
