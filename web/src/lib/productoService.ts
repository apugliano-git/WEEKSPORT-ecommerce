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
  imagenes?: string[];
}

export async function actualizarProducto(productoId: string, datos: DatosProductoActualizado): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('productos')
      .update(datos)
      .eq('id', productoId)
      .select('id')
      .single();

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Producto actualizado con éxito.' };
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna al actualizar producto.' };
  }
}

export async function setPromocion(productoId: string, precio_promocional: number, promocion_sin_precio_anterior = false): Promise<ApiResponse> {
  if (!Number.isFinite(precio_promocional) || precio_promocional <= 0) {
    return { status: 'error', message: 'Ingresá un precio válido mayor a 0.' };
  }
  try {
    const { error } = await supabase
      .from('productos')
      .update({ precio_promocional, promocion_sin_precio_anterior, en_oferta: false })
      .eq('id', productoId)
      .select('id')
      .single();

    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: 'Promoción aplicada.' };
  } catch {
    return { status: 'error', message: 'Error al aplicar la promoción.' };
  }
}

export async function clearPromocion(productoId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('productos')
      .update({ precio_promocional: null, promocion_sin_precio_anterior: false })
      .eq('id', productoId)
      .select('id')
      .single();

    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: 'Promoción eliminada.' };
  } catch {
    return { status: 'error', message: 'Error al eliminar la promoción.' };
  }
}

export async function setOferta(productoId: string, activa: boolean): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('productos')
      .update(activa
        ? { en_oferta: true, precio_promocional: null, promocion_sin_precio_anterior: false }
        : { en_oferta: false })
      .eq('id', productoId)
      .select('id')
      .single();

    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: 'Oferta actualizada.' };
  } catch {
    return { status: 'error', message: 'Error al actualizar la oferta.' };
  }
}

export async function eliminarProducto(productoId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', productoId)
      .select('id')
      .single();

    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: 'Producto eliminado correctamente.' };
  } catch {
    return { status: 'error', message: 'Error al eliminar el producto.' };
  }
}
