import { createClient } from '@/lib/supabase/client';
import { parseProductCreationRpcResponse } from './security/inventoryRpc';
import { validateImageUpload } from './security/uploads';

const supabase = createClient();
export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

export interface NuevoArticuloPayload {
  nombre: string;
  descripcion: string;
  categoria_id: string; // O UUID/number según el schema de la BD
  genero: string;
  tipo_talle: string;
  precio_inicial: number;
  imagenes?: string[];
  colores?: string[]; // Array de nombres de colores para generar variantes
  cantidades?: Record<string, number>;
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
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna.' };
  }
}

/**
 * Crea un nuevo producto y sus variantes usando la función RPC.
 */
export async function crearArticuloCompleto(payload: NuevoArticuloPayload): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase.rpc('crear_producto_con_variantes', {
      p_nombre: payload.nombre,
      p_descripcion: payload.descripcion,
      p_categoria_id: payload.categoria_id,
      p_genero: payload.genero,
      p_tipo_talle: payload.tipo_talle,
      p_precio_inicial: payload.precio_inicial,
      p_imagenes: payload.imagenes || [],
      p_colores: payload.colores || [],
      p_cantidades: payload.cantidades ?? {}
    });

    if (error) {
      return { status: 'error', message: `Fallo al registrar el artículo: ${error.message}` };
    }

    const rpcResult = parseProductCreationRpcResponse(data);
    if (rpcResult.status === 'error') {
      return { status: 'error', message: `Error en la base de datos: ${rpcResult.message}` };
    }

    return { status: 'success', message: 'Artículo completo y stock inicial registrados exitosamente en el sistema.' };
  } catch {
    return { status: 'error', message: 'Error desconocido' };
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
  } catch {
    return { status: 'error', message: 'Error interno al intentar dar de baja el artículo.' };
  }
}

/**
 * Sube una imagen binaria a Supabase Storage con límite de 5MB.
 * Retorna la URL pública absoluta del bucket.
 */
export async function subirImagenProducto(file: File): Promise<{ url?: string; error?: string }> {
  try {
    const validation = validateImageUpload(file);
    if (!validation.ok) {
      return { error: validation.error };
    }

    const fileName = `${crypto.randomUUID()}.${validation.extension}`;

    const { error: uploadError } = await supabase.storage
      .from('productos-imagenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: 'No se pudo subir la imagen.' };
    }

    const { data } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(fileName);

    return { url: data.publicUrl };
  } catch {
    return { error: 'Excepción interna al procesar la subida de medios.' };
  }
}

/**
 * Agrega un nuevo color a un producto existente (creando variantes para todos los talles).
 */
export async function agregarColorAProducto(
  productoId: string,
  color: string,
  precio: number,
  cantidadInicial: number = 0
): Promise<{ status: 'success' | 'error'; message: string }> {
  try {
    const { data, error } = await supabase.rpc('agregar_color_a_producto', {
      p_producto_id: productoId,
      p_color: color,
      p_precio: precio,
      p_cantidad_inicial: cantidadInicial,
    });

    if (error) {
      return { status: 'error', message: error.message };
    }

    if (data?.status === 'error') {
      return { status: 'error', message: data.message || 'Error al agregar el color.' };
    }

    return { status: 'success', message: 'Color agregado con éxito.' };
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna al agregar color.' };
  }
}

export async function actualizarPrecioColor(
  productoId: string,
  color: string,
  precioNuevo: number
): Promise<{ status: 'success' | 'error'; message: string }> {
  try {
    const { data, error } = await supabase.rpc('actualizar_precio_color', {
      p_producto_id: productoId,
      p_color: color,
      p_precio_nuevo: precioNuevo,
    });

    if (error) {
      return { status: 'error', message: error.message };
    }

    if (data?.status === 'error') {
      return { status: 'error', message: data.message || 'Error al actualizar el precio.' };
    }

    return { status: 'success', message: 'Precio actualizado con éxito.' };
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna al actualizar precio.' };
  }
}

export async function obtenerTallesPorTipo(tipoTalle: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('talles_por_tipo')
    .select('talle, orden')
    .eq('tipo_talle', tipoTalle)
    .order('orden', { ascending: true });

  if (error || !data) return [];
  return data.map(row => row.talle);
}
