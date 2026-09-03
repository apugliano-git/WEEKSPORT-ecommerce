import { createClient } from '@/lib/supabase/server';

export interface MetricasInventario {
  productosActivos: number;
  productosSinStock: number;
  variantesCriticas: number;
  ventasDelMes: number;
}

interface StockCountRow {
  cantidad: number;
}

interface ProductStockRow {
  variantes_stock: StockCountRow[] | null;
}

export async function obtenerMetricasInventario(): Promise<MetricasInventario> {
  const supabase = await createClient();
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: productosActivos }, { data: productos }, { count: ventasDelMes }] = await Promise.all([
    supabase.from('productos').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('productos').select('id, variantes_stock (cantidad)'),
    supabase.from('ventas_historico').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
  ]);

  let productosSinStock = 0;
  let variantesCriticas = 0;

  if (productos) {
    const productRows = productos as ProductStockRow[];
    productRows.forEach(prod => {
      const variantes = prod.variantes_stock || [];
      const totalStock = variantes.reduce((sum: number, v: StockCountRow) => sum + v.cantidad, 0);
      if (totalStock === 0) {
        productosSinStock++;
      }
      
      variantes.forEach((v: StockCountRow) => {
        if (v.cantidad === 1) {
          variantesCriticas++;
        }
      });
    });
  }

  return {
    productosActivos: productosActivos || 0,
    productosSinStock,
    variantesCriticas,
    ventasDelMes: ventasDelMes || 0,
  };
}

export async function obtenerVentasRecientes(limit: number = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ventas_historico')
    .select('id, created_at, items, detalles')
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
