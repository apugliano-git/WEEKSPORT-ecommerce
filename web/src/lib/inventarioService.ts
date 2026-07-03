import { supabase } from '@/lib/supabaseClient';

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

export interface NuevaVariante {
  sku: string;
  talle: string;
  color: string;
  stock: number;
}

export interface NuevoArticuloPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string; // O UUID/number según el schema de la BD
  variantes: NuevaVariante[];
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
      .update({ stock: nuevoStock })
      .eq('id', id);

    if (error) {
      console.error('[inventarioService] Error al actualizar stock:', error);
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Stock actualizado con éxito.' };
  } catch (err: any) {
    console.error('[inventarioService] Excepción:', err);
    return { status: 'error', message: 'Fallo de red o excepción interna.' };
  }
}

/**
 * Crea un nuevo producto y sus variantes con el stock inicial definido.
 */
export async function crearArticuloCompleto(payload: NuevoArticuloPayload): Promise<ApiResponse> {
  try {
    // 1. Insertar el artículo principal en la tabla 'productos'
    const { data: producto, error: errProd } = await supabase
      .from('productos')
      .insert({
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        precio: payload.precio,
        categoria_id: payload.categoria_id
      })
      .select('id')
      .single();

    if (errProd || !producto) {
      console.error('[inventarioService] Error creando producto:', errProd);
      return { status: 'error', message: `Fallo al registrar el artículo: ${errProd?.message}` };
    }

    const productoId = producto.id;

    // 2. Preparar la estructura de datos relacional para variantes
    const variantesParaInsertar = payload.variantes.map(v => ({
      producto_id: productoId, // Foreign Key relacional
      sku: v.sku || null,
      talle: v.talle,
      color: v.color,
      stock: v.stock
    }));

    // 3. Insertar todas las variantes en 'variantes_stock' (Batch Insert)
    const { error: errVar } = await supabase
      .from('variantes_stock')
      .insert(variantesParaInsertar);

    if (errVar) {
      console.error('[inventarioService] Error insertando variantes:', errVar);
      return { 
        status: 'error', 
        message: 'El artículo base fue creado, pero falló la inicialización física del stock y variantes.' 
      };
    }

    return { status: 'success', message: 'Artículo completo y stock inicial registrados exitosamente en el sistema.' };
  } catch (err: any) {
    console.error('[inventarioService] Excepción global:', err);
    return { status: 'error', message: 'Fallo de conexión crítico o error interno en el servidor.' };
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
      console.error('[inventarioService] Error desactivando producto:', error);
      return { status: 'error', message: `Base de datos rechazó la baja lógica: ${error.message}` };
    }

    return { status: 'success', message: 'Producto dado de baja lógica correctamente.' };
  } catch (err: any) {
    console.error('[inventarioService] Excepción al desactivar:', err);
    return { status: 'error', message: 'Error interno al intentar dar de baja el artículo.' };
  }
}
