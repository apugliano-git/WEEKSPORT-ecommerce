import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

export interface NuevaVariante {
  talle: string;
  color: string;
  cantidad: number;
  precio: number;
}

export interface NuevoArticuloPayload {
  nombre: string;
  descripcion: string;
  categoria_id: string; // O UUID/number según el schema de la BD
  genero: string;
  tipo_talle: string;
  precio_inicial: number;
  imagenes?: string[];
}

/**
 * Actualiza el stock absoluto de una variante específica identificada por su 'id'.
 */
export async function actualizarStockVariante(id: string, nuevoStock: number): Promise<ApiResponse> {
  try {
    if (nuevoStock < 0) {
      return { status: 'error', message: 'El stock no puede ser negativo.' };
    }

    const { error } = await supabase
      .from('variantes_stock')
      .update({ cantidad: nuevoStock })
      .eq('id', id);

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Stock actualizado con éxito.' };
  } catch (err: any) {
    return { status: 'error', message: 'Fallo de red o excepción interna.' };
  }
}

/**
 * Crea un nuevo producto y sus variantes usando la función RPC.
 */
export async function crearArticuloCompleto(payload: NuevoArticuloPayload): Promise<ApiResponse> {
  try {
    const { error } = await supabase.rpc('crear_producto_con_variantes', {
      p_nombre: payload.nombre,
      p_descripcion: payload.descripcion,
      p_categoria_id: payload.categoria_id,
      p_genero: payload.genero,
      p_tipo_talle: payload.tipo_talle,
      p_precio_inicial: payload.precio_inicial,
      p_imagenes: payload.imagenes || []
    });

    if (error) {
      return { status: 'error', message: `Fallo al registrar el artículo: ${error.message}` };
    }

    return { status: 'success', message: 'Artículo completo y stock inicial registrados exitosamente en el sistema.' };
  } catch (err: any) {
    return { status: 'error', message: err.message || 'Error desconocido' };
  }
}

/**
 * Realiza una baja lógica del producto seteando su estado 'activo' a false.
 * Esto evita que aparezca en el catálogo público sin perder su historial de ventas ni romper la integridad referencial.
 */
export async function desactivarProducto(productoId: string): Promise<ApiResponse> {
  try {
    if (!productoId) {
      return { status: 'error', message: 'El ID de producto es inválido.' };
    }

    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', productoId);

    if (error) {
      return { status: 'error', message: `Base de datos rechazó la baja lógica: ${error.message}` };
    }

    return { status: 'success', message: 'Producto dado de baja lógica correctamente.' };
  } catch (err: any) {
    return { status: 'error', message: 'Error interno al intentar dar de baja el artículo.' };
  }
}

/**
 * Sube una imagen binaria a Supabase Storage con límite de 5MB.
 * Retorna la URL pública absoluta del bucket.
 */
export async function subirImagenProducto(file: File): Promise<{ url?: string; error?: string }> {
  try {
    // Validación perimetral 5MB
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'El archivo excede el límite de 5 MB permitidos.' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('productos-imagenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { error: `Fallo al subir la imagen: ${uploadError.message}` };
    }

    const { data } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(fileName);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: 'Excepción interna al procesar la subida de medios.' };
  }
}
