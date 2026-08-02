import { createClient } from '@/lib/supabase/client';

// Usamos el mismo patrón de inventarioService: instancia única del cliente SSR del navegador
const supabase = createClient();

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

export interface DatosProductoActualizado {
  nombre: string;
  descripcion: string;
  categoria_id: string;
  genero?: string;
  tipo_talle: string;
  activo: boolean;
}

export async function actualizarProducto(productoId: string, datos: DatosProductoActualizado): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('productos')
      .update(datos)
      .eq('id', productoId);

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Producto actualizado con éxito.' };
  } catch (err: any) {
    return { status: 'error', message: 'Fallo de red o excepción interna al actualizar producto.' };
  }
}
