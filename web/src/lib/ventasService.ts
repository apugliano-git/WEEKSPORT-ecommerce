// Ajustá el path a la instancia de tu cliente supabase si es necesario
import { supabase } from '@/lib/supabaseClient'; 

// --- Interfaces de Tipado ---
export interface VentaItem {
  variante_id: string; // O number según tu DDL
  cantidad: number;
}

export interface ProcesarVentaResponse {
  status: 'success' | 'error';
  venta_id?: string;
  message: string;
  errorCode?: string;
}

/**
 * Función centralizada (RF-10) que procesa una lista de items vendidos.
 * Invoca el RPC transaccional que asegura la integridad de los datos.
 */
export async function procesarVentaAtomicamente(items: VentaItem[]): Promise<ProcesarVentaResponse> {
  try {
    // 1. Defensas de pre-vuelo en capa de servidor
    if (!items || items.length === 0) {
      return { status: 'error', message: 'El payload de items está vacío.' };
    }

    if (items.some(item => item.cantidad <= 0)) {
      return { status: 'error', message: 'Cantidades inválidas en el payload.' };
    }

    // 2. Ejecución RPC
    // Postgres hará un rollback automático interno si se lanza alguna EXCEPTION.
    const { data, error } = await supabase
      .rpc('procesar_venta', {
        items_payload: items // Se serializa automáticamente como JSONB
      });

    // 3. Control de Excepciones (Parseo de ERRCODE de PostgreSQL)
    if (error) {
      console.error('[ventasService] DB Exception capturada:', error);
      
      switch (error.code) {
        case 'P0001': // Stock insuficiente u otro RAISE custom
          return { 
            status: 'error', 
            message: `Rechazado por reglas de negocio: ${error.message}`,
            errorCode: error.code
          };
        case 'P0002': // Registro no encontrado
          return { 
            status: 'error', 
            message: `Inconsistencia de datos: ${error.message}`,
            errorCode: error.code
          };
        case '23514': // Violación del constraint CHECK
          return { 
            status: 'error', 
            message: 'Violación de restricción de integridad de base de datos.',
            errorCode: error.code
          };
        case '22023': // Parámetros inválidos enviados al JSONB
          return { 
            status: 'error', 
            message: 'Estructura de payload no soportada por el RPC.',
            errorCode: error.code
          };
        default:
          return { 
            status: 'error', 
            message: 'Fallo crítico de base de datos durante la transacción.',
            errorCode: error.code || 'UNKNOWN_DB_ERROR'
          };
      }
    }

    // 4. Procesamiento exitoso del JSONB retornado
    if (data && data.status === 'success') {
      return {
        status: 'success',
        venta_id: data.venta_id,
        message: data.message
      };
    }

    // Fallback de seguridad
    return {
      status: 'error',
      message: 'Respuesta RPC malformada o inesperada.'
    };

  } catch (err: any) {
    console.error('[ventasService] Crash de infraestructura:', err);
    return {
      status: 'error',
      message: 'Fallo en la comunicación con el cliente de Supabase.',
      errorCode: 'NETWORK_OR_INTERNAL_EXCEPTION'
    };
  }
}
