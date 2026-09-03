import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

const DUPLICATE_KEY_CODE = '23505';
const DUPLICATE_MSG = 'Ya existe una variante con ese talle y color para este producto.';

export interface DatosVarianteActualizada {
  talle?: string;
  color?: string;
  precio?: number;
  visible_en_catalogo?: boolean;
}

export async function actualizarVariante(
  varianteId: string,
  datos: DatosVarianteActualizada
): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('variantes_stock')
      .update(datos)
      .eq('id', varianteId)
      .select('id')
      .single();

    if (error) {
      if (error.code === DUPLICATE_KEY_CODE) {
        return { status: 'error', message: DUPLICATE_MSG };
      }
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Variante actualizada con éxito.' };
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna al actualizar variante.' };
  }
}

export async function eliminarVariante(varianteId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('variantes_stock')
      .delete()
      .eq('id', varianteId)
      .select('id')
      .single();

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Variante eliminada.' };
  } catch {
    return { status: 'error', message: 'Fallo de red o excepción interna al eliminar variante.' };
  }
}
