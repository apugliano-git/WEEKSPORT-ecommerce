'use client';

import { useState, useEffect, useRef } from 'react';
import { crearArticuloCompleto, subirImagenProducto, obtenerTallesPorTipo } from '@/lib/inventarioService';
import { createClient } from '@/lib/supabase/client';
import { resetSizesAfterCreate } from '@/lib/inventoryForm';

// Normaliza un nombre de color: primera letra mayúscula, resto minúsculas
function capitalizarColor(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const MAX_COLOR_LENGTH = 20;

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
  const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
  const [cantidadesPorTalle, setCantidadesPorTalle] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchTalles = async () => {
      const talles = await obtenerTallesPorTipo(tipoTalle);
      if (cancelled) return;
      setTallesDisponibles(talles);
      setCantidadesPorTalle(Object.fromEntries(talles.map(talle => [talle, 0])));
    };
    void fetchTalles();
    return () => { cancelled = true; };
  }, [tipoTalle]);

  // Estado de colores
  const [colores, setColores] = useState<string[]>([]);
  const [inputColor, setInputColor] = useState('');
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Estados de interfaz y feedback
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [errorCategorias, setErrorCategorias] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('categorias').select('id, nombre').order('nombre');
        if (error) {
          setErrorCategorias('Error al cargar categorías');
          console.error(error);
        } else {
          setCategorias(data || []);
        }
      } catch (err) {
        setErrorCategorias('Error al cargar categorías');
        console.error(err);
      }
    };
    fetchCategorias();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setArchivosImagenes(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setArchivosImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const agregarColor = () => {
    const nombre = capitalizarColor(inputColor);
    if (!nombre) return;
    if (colores.includes(nombre)) {
      setInputColor('');
      return;
    }
    setColores(prev => [...prev, nombre]);
    setInputColor('');
    colorInputRef.current?.focus();
  };

  const eliminarColor = (idx: number) => {
    setColores(prev => prev.filter((_, i) => i !== idx));
  };

  const handleColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarColor();
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
      const uploads = await Promise.all(archivosImagenes.map(subirImagenProducto));
      const uploadError = uploads.find(upload => upload.error);
      if (uploadError?.error) {
        setMensaje({ tipo: 'error', texto: uploadError.error });
        setIsLoading(false);
        setIsUploading(false);
        return;
      }
      urlsImagenes.push(...uploads.flatMap(upload => upload.url ? [upload.url] : []));
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
      imagenes: urlsImagenes,
      colores: colores.length > 0 ? colores : [],
      cantidades: cantidadesPorTalle
    };

    const result = await crearArticuloCompleto(payload);

    if (result.status === 'success') {
      setMensaje({ tipo: 'success', texto: result.message });
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setGenero('Unisex');
      const resetSizes = resetSizesAfterCreate(tipoTalle, tallesDisponibles);
      setTipoTalle('estandar');
      setTallesDisponibles(resetSizes.sizes);
      setCantidadesPorTalle(resetSizes.quantities);
      setPrecioInicial('');
      setArchivosImagenes([]);
      setColores([]);
      setInputColor('');
    } else {
      setMensaje({ tipo: 'error', texto: result.message });
    }

    setIsLoading(false);
  };

  // Preview: talles que se generarán según el esquema
  const tallesPreview = tallesDisponibles;
  const coloresEfectivos = colores.length > 0 ? colores : ['Sin color'];
  const totalVariantes = tallesPreview.length * coloresEfectivos.length;

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoría *</label>
                {errorCategorias ? (
                  <div className="text-red-400 text-sm mb-2">{errorCategorias}</div>
                ) : (
                  <select 
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors appearance-none"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                  >
                    <option value="" disabled>Seleccioná una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                )}
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
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-emerald-400 font-semibold">{archivosImagenes.length} archivo(s) seleccionado(s):</p>
                    <p className="text-[10px] text-zinc-500">El orden en el que aparecen aquí será el orden en la tienda.</p>
                    <ul className="text-sm space-y-1">
                      {archivosImagenes.map((file, i) => (
                        <li key={i} className="flex justify-between items-center bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800 group">
                          <span className="truncate text-zinc-300 max-w-[150px] md:max-w-[200px]" title={file.name}>
                            <span className="text-zinc-500 mr-2 text-xs">{i + 1}.</span>{file.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => {
                                const newFiles = [...archivosImagenes];
                                [newFiles[i - 1], newFiles[i]] = [newFiles[i], newFiles[i - 1]];
                                setArchivosImagenes(newFiles);
                              }}
                              className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="Subir"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                            </button>
                            <button
                              type="button"
                              disabled={i === archivosImagenes.length - 1}
                              onClick={() => {
                                const newFiles = [...archivosImagenes];
                                [newFiles[i], newFiles[i + 1]] = [newFiles[i + 1], newFiles[i]];
                                setArchivosImagenes(newFiles);
                              }}
                              className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="Bajar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </button>
                            <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                            <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 p-1 shrink-0" title="Eliminar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configuración Física, Colores y Precio */}
          <div className="flex flex-col gap-6">
            {/* Talles y Precio */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
              <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                Talles y Precio
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Esquema de Talles *</label>
                  <select 
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                    value={tipoTalle}
                    onChange={(e) => {
                      setTipoTalle(e.target.value);
                      setTallesDisponibles([]);
                      setCantidadesPorTalle({});
                    }}
                  >
                    <option value="estandar">Estándar (XS a 4XL)</option>
                    <option value="unico">Único (Talle Único)</option>
                    <option value="tops">Tops (85/90 a 120+)</option>
                    <option value="sin_talle">Sin talle (Accesorios)</option>
                  </select>
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

            {/* Panel de Colores */}
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50 flex-1">
              <h2 className="text-xl font-semibold mb-2 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                Colores
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Ingresá el stock inicial de cada talle para el producto. Si agregás colores, este stock inicial será igual para cada color generado.
              </p>

              {tallesDisponibles.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-3">Cantidades por Talle</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {tallesDisponibles.map(talle => (
                      <div key={talle} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800 focus-within:border-[#F400A1] focus-within:ring-1 focus-within:ring-[#F400A1] transition-colors">
                        <label className="text-sm font-bold text-zinc-300 w-12 text-center shrink-0">{talle}</label>
                        <input
                          type="number"
                          min="0"
                          value={cantidadesPorTalle[talle] ?? 0}
                          onChange={(e) => setCantidadesPorTalle(prev => ({ ...prev, [talle]: Number(e.target.value) || 0 }))}
                          className="w-full bg-transparent outline-none text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input de color */}
              <div className="flex gap-2 mb-4 overflow-hidden">
                <input
                  ref={colorInputRef}
                  type="text"
                  value={inputColor}
                  onChange={(e) => setInputColor(e.target.value.slice(0, MAX_COLOR_LENGTH))}
                  onKeyDown={handleColorKeyDown}
                  placeholder="Ej: Negro, Azul marino..."
                  maxLength={MAX_COLOR_LENGTH}
                  className="min-w-0 flex-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors text-sm placeholder-zinc-600"
                />
                <button
                  type="button"
                  onClick={agregarColor}
                  disabled={!inputColor.trim()}
                  className="shrink-0 px-4 py-3 bg-[#F400A1] hover:bg-[#D000A0] disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Agregar
                </button>
              </div>

              {/* Chips de colores */}
              {colores.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {colores.map((color, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-200"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => eliminarColor(idx)}
                        aria-label={`Eliminar color ${color}`}
                        className="text-zinc-500 hover:text-red-400 transition-colors ml-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic mb-4">Sin colores — se creará sin especificar.</p>
              )}

              {/* Preview de variantes */}
              <div className="mt-2 p-3 bg-zinc-950/60 border border-zinc-800/40 rounded-xl">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Variantes a generar</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-extrabold text-white">{totalVariantes}</span>
                  <span className="text-xs text-zinc-500">
                    variante{totalVariantes !== 1 ? 's' : ''} · {tallesPreview.length} talle{tallesPreview.length !== 1 ? 's' : ''} × {coloresEfectivos.length} color{coloresEfectivos.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                {colores.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {coloresEfectivos.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono">
                        {c}: {tallesPreview.join(', ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-zinc-600 mt-3">
                Presioná <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">Enter</kbd> para agregar
              </p>
            </div>
          </div>
        </div>

        {/* Accionador */}
        <div className="flex justify-end pt-4 border-t border-zinc-800/50">
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
            ) : `Consolidar Catálogo y Stock (${totalVariantes} variante${totalVariantes !== 1 ? 's' : ''})`}
          </button>
        </div>
      </form>
    </div>
  );
}
