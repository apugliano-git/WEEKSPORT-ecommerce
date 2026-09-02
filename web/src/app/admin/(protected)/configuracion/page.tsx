'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subirImagenProducto } from '@/lib/inventarioService';

export type Slide = {
  id: string;
  desktop_url: string;
  mobile_url: string;
  pos_y_desktop: number;
  pos_y_mobile: number;
  pos_x_mobile: number;
};

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    envio_gratis_texto: '',
    medios_pago_texto: '',
    direccion: '',
    instagram_handle: '',
    telefono_whatsapp: '',
    email_contacto: '',
    texto_legal: '',
    copyright_anio: '',
    hero_titulo: '',
    hero_subtitulo: '',
    hero_descripcion: '',
    hero_slides: [] as Slide[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('configuracion_sitio')
          .select('*')
          .eq('id', 1)
          .single();
          
        if (error) {
          setMensaje({ tipo: 'error', texto: 'Error al cargar la configuración.' });
        } else if (data) {
          let loadedSlides = data.hero_slides || [];
          if (loadedSlides.length === 0 && data.hero_imagen_url) {
            loadedSlides = [{
              id: crypto.randomUUID(),
              desktop_url: data.hero_imagen_url,
              mobile_url: data.hero_imagen_url_mobile || data.hero_imagen_url,
              pos_y_desktop: data.hero_imagen_posicion_y_desktop ?? 50,
              pos_y_mobile: data.hero_imagen_posicion_y_mobile ?? 50,
              pos_x_mobile: data.hero_imagen_posicion_mobile ?? 50,
            }];
          }

          setConfig({
            envio_gratis_texto: data.envio_gratis_texto || '',
            medios_pago_texto: data.medios_pago_texto || '',
            direccion: data.direccion || '',
            instagram_handle: data.instagram_handle || '',
            telefono_whatsapp: data.telefono_whatsapp || '',
            email_contacto: data.email_contacto || '',
            texto_legal: data.texto_legal || '',
            copyright_anio: data.copyright_anio || '',
            hero_titulo: data.hero_titulo || '',
            hero_subtitulo: data.hero_subtitulo || '',
            hero_descripcion: data.hero_descripcion || '',
            hero_slides: loadedSlides
          });
        }
      } catch (err) {
        console.error(err);
        setMensaje({ tipo: 'error', texto: 'Error de conexión al cargar la configuración.' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSlide = () => {
    setConfig(prev => ({
      ...prev,
      hero_slides: [
        ...prev.hero_slides,
        {
          id: crypto.randomUUID(),
          desktop_url: '',
          mobile_url: '',
          pos_y_desktop: 50,
          pos_y_mobile: 50,
          pos_x_mobile: 50
        }
      ]
    }));
  };

  const handleRemoveSlide = (id: string) => {
    setConfig(prev => ({
      ...prev,
      hero_slides: prev.hero_slides.filter(slide => slide.id !== id)
    }));
  };

  const updateSlide = (id: string, field: keyof Slide, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      hero_slides: prev.hero_slides.map(slide => 
        slide.id === id ? { ...slide, [field]: value } : slide
      )
    }));
  };

  const handleSlideImageUpload = async (id: string, file: File, isMobile: boolean) => {
    const uploadKey = `${id}-${isMobile ? 'mobile' : 'desktop'}`;
    setIsUploading(prev => ({ ...prev, [uploadKey]: true }));
    setMensaje(null);
    
    const res = await subirImagenProducto(file);
    setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
    
    if (res.error) {
      setMensaje({ tipo: 'error', texto: res.error });
    } else if (res.url) {
      updateSlide(id, isMobile ? 'mobile_url' : 'desktop_url', res.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('configuracion_sitio')
        .update({
          ...config,
          // Mantener legacy fields en sincronía con el primer slide por si acaso.
          hero_imagen_url: config.hero_slides[0]?.desktop_url || '',
          hero_imagen_url_mobile: config.hero_slides[0]?.mobile_url || '',
          hero_imagen_posicion_mobile: config.hero_slides[0]?.pos_x_mobile || 50,
          hero_imagen_posicion_y_desktop: config.hero_slides[0]?.pos_y_desktop || 50,
          hero_imagen_posicion_y_mobile: config.hero_slides[0]?.pos_y_mobile || 50
        })
        .eq('id', 1);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'No se pudieron guardar los cambios: ' + error.message });
      } else {
        setMensaje({ tipo: 'success', texto: 'Configuración actualizada exitosamente.' });
      }
    } catch {
      console.error('config_save_failed');
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error inesperado al guardar.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 max-w-5xl mx-auto min-h-screen bg-zinc-950 font-sans text-white flex items-center justify-center">Cargando configuración...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-zinc-950 font-sans text-white">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Configuración del Sitio</h1>

      {mensaje && (
        <div className={`p-4 mb-6 rounded-xl font-semibold border ${
          mensaje.tipo === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
        
        {/* Footer y Contacto */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            Textos Institucionales y Contacto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Envío Gratis</label>
              <input 
                type="text" name="envio_gratis_texto" value={config.envio_gratis_texto} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Medios de Pago</label>
              <input 
                type="text" name="medios_pago_texto" value={config.medios_pago_texto} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Dirección</label>
              <input 
                type="text" name="direccion" value={config.direccion} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Instagram (usuario sin @)</label>
              <input 
                type="text" name="instagram_handle" value={config.instagram_handle} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Teléfono (WhatsApp)</label>
              <input 
                type="text" name="telefono_whatsapp" value={config.telefono_whatsapp} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
              <input 
                type="text" name="email_contacto" value={config.email_contacto} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Texto Legal</label>
              <textarea 
                name="texto_legal" value={config.texto_legal} onChange={handleChange} rows={2}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Año de Copyright</label>
              <input 
                type="text" name="copyright_anio" value={config.copyright_anio} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Hero Banner General */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            Textos del Carrusel Principal (Hero)
          </h2>
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subtítulo (Etiqueta superior)</label>
              <input 
                type="text" name="hero_subtitulo" value={config.hero_subtitulo} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="Ej: Nueva Colección"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Título Principal</label>
              <input 
                type="text" name="hero_titulo" value={config.hero_titulo} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="Ej: Rendimiento en cada movimiento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descripción</label>
              <textarea 
                name="hero_descripcion" value={config.hero_descripcion} onChange={handleChange} rows={3}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Carrusel Slides */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3 mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Imágenes del Carrusel
            </h2>
            <button 
              type="button" 
              onClick={handleAddSlide}
              className="text-sm bg-[#F400A1] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#D000A0] transition-colors"
            >
              + Agregar Slide
            </button>
          </div>

          {config.hero_slides.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No hay imágenes en el carrusel. Agregá una para empezar.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {config.hero_slides.map((slide, index) => (
                <div key={slide.id} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 relative shadow-md">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <span className="font-bold text-[#F400A1]">Slide {index + 1}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveSlide(slide.id)}
                      className="text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Desktop Upload & View */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Imagen Desktop</label>
                      {slide.desktop_url ? (
                        <div className="mb-3 relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-800 flex flex-col justify-end" style={{ backgroundImage: `url(${slide.desktop_url})`, backgroundSize: 'cover', backgroundPosition: `center ${slide.pos_y_desktop}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12]/90 via-[#0F0F12]/60 to-transparent pointer-events-none" />
                          <div className="relative z-10 p-4 sm:p-6 text-left">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[8px] sm:text-[10px] font-bold tracking-widest uppercase mb-3 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F400A1] animate-pulse" />
                              {config.hero_subtitulo || 'Nueva Colección'}
                            </div>
                            <h4 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-[0.1em] mb-2 leading-tight truncate">
                              {config.hero_titulo || 'Rendimiento en cada movimiento'}
                            </h4>
                            <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-2">
                              {config.hero_descripcion || 'Indumentaria de barrio diseñada para entrenar sin límites.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 w-full aspect-video rounded-lg bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
                          Sin imagen desktop
                        </div>
                      )}
                      
                      <input 
                        type="file" accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleSlideImageUpload(slide.id, e.target.files[0], false);
                          }
                        }}
                        disabled={isLoading || isUploading[`${slide.id}-desktop`]}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer mb-2"
                      />
                      <input 
                        type="text" value={slide.desktop_url} onChange={(e) => updateSlide(slide.id, 'desktop_url', e.target.value)}
                        placeholder="URL Desktop (Fallback)"
                        className="w-full p-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md focus:ring-1 focus:ring-[#F400A1] outline-none"
                      />
                      <div className="mt-2">
                        <label className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Ajuste Y (Vertical):</span>
                          <span>{slide.pos_y_desktop}%</span>
                        </label>
                        <input 
                          type="range" min="0" max="100" value={slide.pos_y_desktop}
                          onChange={(e) => updateSlide(slide.id, 'pos_y_desktop', Number(e.target.value))}
                          className="w-full h-1 accent-[#F400A1] bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <hr className="border-zinc-800" />

                    {/* Mobile Upload & View */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Imagen Mobile</label>
                      {slide.mobile_url ? (
                        <div className="mb-3 relative w-[220px] sm:w-[280px] mx-auto aspect-[9/16] rounded-[2rem] overflow-hidden border-[6px] border-zinc-800 flex flex-col justify-end shadow-2xl" style={{ backgroundImage: `url(${slide.mobile_url})`, backgroundSize: 'cover', backgroundPosition: `${slide.pos_x_mobile}% ${slide.pos_y_mobile}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/70 to-transparent pointer-events-none" />
                          <div className="relative z-10 p-5 text-left pb-8">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[8px] font-bold tracking-widest uppercase mb-3 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F400A1] animate-pulse" />
                              {config.hero_subtitulo || 'Nueva Colección'}
                            </div>
                            <h4 className="text-2xl font-black font-display text-white uppercase tracking-[0.1em] mb-3 leading-tight break-words">
                              {config.hero_titulo || 'Rendimiento en cada movimiento'}
                            </h4>
                            <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-3">
                              {config.hero_descripcion || 'Indumentaria de barrio diseñada para entrenar sin límites.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 w-32 mx-auto aspect-[9/16] rounded-lg bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs text-center p-2">
                          Sin imagen mobile
                        </div>
                      )}

                      <input 
                        type="file" accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleSlideImageUpload(slide.id, e.target.files[0], true);
                          }
                        }}
                        disabled={isLoading || isUploading[`${slide.id}-mobile`]}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer mb-2"
                      />
                      <input 
                        type="text" value={slide.mobile_url} onChange={(e) => updateSlide(slide.id, 'mobile_url', e.target.value)}
                        placeholder="URL Mobile (Fallback)"
                        className="w-full p-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md focus:ring-1 focus:ring-[#F400A1] outline-none"
                      />
                      
                      <div className="mt-2">
                        <label className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Ajuste X (Horizontal):</span>
                          <span>{slide.pos_x_mobile}%</span>
                        </label>
                        <input 
                          type="range" min="0" max="100" value={slide.pos_x_mobile}
                          onChange={(e) => updateSlide(slide.id, 'pos_x_mobile', Number(e.target.value))}
                          className="w-full h-1 accent-[#F400A1] bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Ajuste Y (Vertical):</span>
                          <span>{slide.pos_y_mobile}%</span>
                        </label>
                        <input 
                          type="range" min="0" max="100" value={slide.pos_y_mobile}
                          onChange={(e) => updateSlide(slide.id, 'pos_y_mobile', Number(e.target.value))}
                          className="w-full h-1 accent-[#F400A1] bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accionador */}
        <div className="flex justify-end mt-2 pt-6 border-t border-zinc-800/50">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2 ${
              isLoading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-[#F400A1] hover:bg-[#D000A0] shadow-lg shadow-[#F400A1]/20'
            }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
