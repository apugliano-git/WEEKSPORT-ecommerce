import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Validar si la request viene realmente de Vercel Cron
  // A confirmar contra doc oficial de Vercel Cron Jobs: 
  // Vercel inyecta automáticamente el header Authorization con "Bearer <CRON_SECRET>"
  // si el entorno tiene definida la variable CRON_SECRET.
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Consulta mínima para generar actividad en la DB (evita pausa por 7 días de inactividad)
    const { count, error } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      rowsCount: count
    });
  } catch (error: any) {
    console.error('Error in keepalive cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
