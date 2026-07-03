import { type NextRequest } from 'next/server'
import { actualizarSesion } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Invocamos la función de refresco y verificación de sesión
  return await actualizarSesion(request)
}

export const config = {
  // Configuración del objeto matcher para interceptar exclusivamente
  // todas las rutas de administración (incluyendo subrutas y login)
  matcher: [
    '/admin/:path*',
  ],
}
