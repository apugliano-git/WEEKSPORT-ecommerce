import { createClient } from '@/lib/supabase/client';
import { subirImagenProducto } from './inventarioService';

export async function guardarCategoria(id: string, nombre: string, file?: File): Promise<{
  data?: { nombre: string; imagen_url?: string | null };
  error?: string;
}> {
  nombre = nombre.trim();
  if (!nombre) return { error: 'Ingresá un nombre para la categoría.' };

  try {
    const cambios: { nombre: string; imagen_url?: string } = { nombre };
    if (file) {
      const imagen = await subirImagenProducto(file);
      if (imagen.error || !imagen.url) return { error: imagen.error || 'No se pudo subir la imagen.' };
      cambios.imagen_url = imagen.url;
    }
    const { data, error } = await createClient()
      .from('categorias')
      .update(cambios)
      .eq('id', id)
      .select('nombre, imagen_url')
      .single();

    if (error) return { error: error.message };
    if (!data) return { error: 'No se pudo confirmar el guardado.' };
    return { data };
  } catch {
    return { error: 'Error de conexión al guardar la categoría.' };
  }
}
