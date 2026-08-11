'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subirImagenProducto } from '@/lib/inventarioService';

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
    hero_imagen_url: '',
    hero_imagen_url_mobile: '',
    hero_imagen_posicion_mobile: 50
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingHeroMobile, setIsUploadingHeroMobile] = useState(false);
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
            hero_imagen_url: data.hero_imagen_url || '',
            hero_imagen_url_mobile: data.hero_imagen_url_mobile || '',
            hero_imagen_posicion_mobile: data.hero_imagen_posicion_mobile ?? 50
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

  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploadingHero(true);
      setMensaje(null);
      
      const res = await subirImagenProducto(file);
      setIsUploadingHero(false);
      
      if (res.error) {
        setMensaje({ tipo: 'error', texto: res.error });
      } else if (res.url) {
        setConfig(prev => ({ ...prev, hero_imagen_url: res.url as string }));
      }
    }
  };

  const handleHeroMobileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploadingHeroMobile(true);
      setMensaje(null);
      
      const res = await subirImagenProducto(file);
      setIsUploadingHeroMobile(false);
      
      if (res.error) {
        setMensaje({ tipo: 'error', texto: res.error });
      } else if (res.url) {
        setConfig(prev => ({ ...prev, hero_imagen_url_mobile: res.url as string }));
      }
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
        .update(config)
        .eq('id', 1);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'No se pudieron guardar los cambios: ' + error.message });
      } else {
        setMensaje({ tipo: 'success', texto: 'Configuración actualizada exitosamente.' });
      }
    } catch (err: any) {
      console.error(err);
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Textos Institucionales y Contacto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Envío Gratis</label>
              <input 
                type="text" name="envio_gratis_texto" value={config.envio_gratis_texto} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="Ej: Envío gratis hasta 3km"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Medios de Pago</label>
              <input 
                type="text" name="medios_pago_texto" value={config.medios_pago_texto} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="Ej: Efectivo, transferencia..."
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
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Teléfono (WhatsApp, con código)</label>
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

        {/* Hero Banner */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800/50 shadow-lg shadow-black/50">
          <h2 className="text-xl font-semibold mb-6 border-b border-zinc-800/50 pb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F400A1]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            Banner Principal (Hero)
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
            {/* File Input RF-09 PATTERN */}
            <div className={`p-4 border rounded-xl transition-all ${
              isUploadingHero ? 'bg-zinc-800/30 border-[#F400A1]/50 animate-pulse' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                {isUploadingHero ? 'Procesando Medios (CDN)...' : 'Subir Nueva Imagen de Fondo Desktop (Max 5MB)'}
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleHeroImageChange}
                disabled={isLoading || isUploadingHero}
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">URL de la Imagen de Fondo Desktop (Fallback manual)</label>
              <input 
                type="text" name="hero_imagen_url" value={config.hero_imagen_url} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="https://..."
              />
            </div>

            <div className={`p-4 border rounded-xl transition-all mt-4 ${
              isUploadingHeroMobile ? 'bg-zinc-800/30 border-[#F400A1]/50 animate-pulse' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
                {isUploadingHeroMobile ? 'Procesando Medios (CDN)...' : 'Subir Nueva Imagen de Fondo Mobile (Max 5MB)'}
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleHeroMobileImageChange}
                disabled={isLoading || isUploadingHeroMobile}
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 transition-all disabled:opacity-50 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">URL de la Imagen de Fondo Mobile (Fallback manual)</label>
              <input 
                type="text" name="hero_imagen_url_mobile" value={config.hero_imagen_url_mobile} onChange={handleChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-[#F400A1] focus:border-[#F400A1] outline-none transition-colors"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex justify-between">
                <span>Posición Horizontal Mobile (X-Axis)</span>
                <span className="text-[#F400A1] font-bold">{config.hero_imagen_posicion_mobile}%</span>
              </label>
              <input 
                type="range" name="hero_imagen_posicion_mobile" min="0" max="100" 
                value={config.hero_imagen_posicion_mobile} 
                onChange={(e) => setConfig(prev => ({ ...prev, hero_imagen_posicion_mobile: Number(e.target.value) }))}
                className="w-full accent-[#F400A1] h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                <span>Izquierda (0%)</span>
                <span>Centro (50%)</span>
                <span>Derecha (100%)</span>
              </div>
            </div>

            {/* PREVIEW SECTIONS */}
            <div className="mt-6 border-t border-zinc-800/50 pt-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Vista Previa en Vivo
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Desktop Preview */}
                <div>
                  <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-bold">Vista Desktop (16:9)</div>
                  <div 
                    className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex flex-col justify-end"
                    style={{ 
                      backgroundImage: `url(${config.hero_imagen_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12]/90 via-[#0F0F12]/60 to-transparent pointer-events-none" />
                    <div className="relative z-10 p-4 sm:p-6 text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[#F400A1] text-[8px] sm:text-[10px] font-bold tracking-widest uppercase mb-3 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F400A1] animate-pulse" />
                        {config.hero_subtitulo || 'Nueva Colección'}
                      </div>
                      <h4 className="text-xl sm:text-3xl font-black font-display text-white uppercase tracking-[0.1em] mb-2 leading-tight truncate">
                        {config.hero_titulo || 'Rendimiento en cada movimiento'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed line-clamp-2">
                        {config.hero_descripcion || 'Indumentaria de barrio diseñada para entrenar sin límites.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div>
                  <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-bold">Vista Mobile (9:16)</div>
                  <div className="flex justify-center">
                    <div 
                      className="relative w-[220px] sm:w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden bg-zinc-950 border-[6px] border-zinc-800 flex flex-col justify-end shadow-2xl"
                      style={{ 
                        backgroundImage: `url(${config.hero_imagen_url_mobile || config.hero_imagen_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: `${config.hero_imagen_posicion_mobile}% center`
                      }}
                    >
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
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Guardando...
              </>
            ) : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
