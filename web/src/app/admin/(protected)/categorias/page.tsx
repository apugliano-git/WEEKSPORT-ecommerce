'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subirImagenProducto } from '@/lib/inventarioService';

type CategoriaConImagen = {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
  imagen_url?: string | null;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaConImagen[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCategorias = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre');

        if (cancelled) return;
        if (error) {
          setMensaje({ tipo: 'error', texto: 'Error al cargar categorías.' });
        } else if (data) {
          setCategorias(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setMensaje({ tipo: 'error', texto: 'Error de conexión al cargar categorías.' });
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    void loadCategorias();
    return () => { cancelled = true; };
  }, []);

  const handleFileSelect = (categoryId: string, file: File) => {
    const previousUrl = previewUrlsRef.current[categoryId];
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    setSelectedFiles(prev => ({ ...prev, [categoryId]: file }));
    setPreviewUrls(prev => ({ ...prev, [categoryId]: URL.createObjectURL(file) }));
    setMensaje(null);
  };

  const handleSave = async (categoryId: string) => {
    const file = selectedFiles[categoryId];
    if (!file) return;

    setUploadingId(categoryId);
    setMensaje(null);
    
    // Subir la imagen usando el servicio existente (que la sube al bucket 'productos-imagenes')
    const res = await subirImagenProducto(file);
    
    if (res.error || !res.url) {
      setMensaje({ tipo: 'error', texto: res.error || 'Error al subir la imagen' });
      setUploadingId(null);
      return;
    }

    // Actualizar la categoría en Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from('categorias')
      .update({ imagen_url: res.url })
      .eq('id', categoryId)
      .select('id')
      .single();

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar la URL en la base de datos: ' + error.message });
    } else {
      setMensaje({ tipo: 'success', texto: 'Imagen de categoría actualizada correctamente.' });
      const previewUrl = previewUrlsRef.current[categoryId];
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      // Actualizar el estado local
      setCategorias(prev => prev.map(c => c.id === categoryId ? { ...c, imagen_url: res.url } : c));
      
      // Limpiar archivo seleccionado
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
      setPreviewUrls(prev => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    }
    
    setUploadingId(null);
  };

  if (isFetching) {
    return <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[#0F0F12] font-sans text-white flex items-center justify-center">Cargando categorías...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen bg-[#0F0F12] font-sans text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Categorías</h1>
        <p className="text-gray-400 text-sm">Gestioná las imágenes de portada de cada categoría que se muestran en la página principal.</p>
      </div>

      {mensaje && (
        <div className={`p-4 mb-6 rounded-xl font-semibold border ${
          mensaje.tipo === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categorias.map(categoria => (
          <div key={categoria.id} className="bg-[#1A1A20] rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#23232A]/30">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">{categoria.nombre}</h3>
            </div>
            
            <div className="p-5 flex gap-5 items-center flex-col sm:flex-row">
              {/* Vista Previa de la Tarjeta */}
              <div 
                className="relative w-full sm:w-40 aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0"
                style={{ 
                  backgroundImage: `url(${previewUrls[categoria.id] || categoria.imagen_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 p-3 flex items-end">
                  <span className="font-display font-bold text-white uppercase tracking-wide text-xs">
                    {categoria.nombre}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="flex-1 w-full flex flex-col gap-3 justify-center">
                <div className={`p-3 border rounded-xl transition-all ${
                  uploadingId === categoria.id ? 'bg-zinc-800/30 border-[#F400A1]/50 animate-pulse' : 'bg-[#0F0F12] border-white/10'
                }`}>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    {uploadingId === categoria.id ? 'Subiendo imagen...' : 'Seleccionar Imagen (Max 5MB)'}
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(categoria.id, e.target.files[0]);
                      }
                    }}
                    disabled={uploadingId !== null}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all disabled:opacity-50 cursor-pointer"
                  />
                </div>

                {selectedFiles[categoria.id] && (
                  <button
                    onClick={() => handleSave(categoria.id)}
                    disabled={uploadingId === categoria.id}
                    className="w-full py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {uploadingId === categoria.id ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                )}

                {!categoria.imagen_url && !selectedFiles[categoria.id] && (
                  <p className="text-[10px] text-amber-400 font-medium">Usando imagen placeholder genérica.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
