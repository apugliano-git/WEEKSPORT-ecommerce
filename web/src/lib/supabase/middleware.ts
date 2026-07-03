import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function actualizarSesion(request: NextRequest) {
  // Inicializamos una respuesta base de Next.js
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Instanciamos el cliente de Supabase específico para servidor (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Obtener todas las cookies de la petición
        getAll() {
          return request.cookies.getAll()
        },
        // Configurar todas las cookies necesarias (incluye establecer y remover)
        setAll(cookiesToSet) {
          // Sincronizamos las cookies en la petición entrante 
          // para poder consumirlas localmente de inmediato
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Reconstruimos la respuesta para inyectar los nuevos headers
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Escribimos las cookies en la respuesta final de forma segura
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Solicitamos la sesión actual del usuario. 
  // Esto refrescará automáticamente los tokens si es necesario.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Regla de negocio: Si el usuario intenta acceder a una subruta bajo /admin
  // y no posee una sesión (JWT) activa ni está intentando iniciar sesión.
  if (!user && !pathname.startsWith('/admin/login')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    
    // Interceptamos en el Edge y redirigimos inmediatamente de forma segura (HTTP 307)
    return NextResponse.redirect(loginUrl, 307)
  }

  // Si está autenticado o en la ruta libre (/admin/login), devolvemos la respuesta
  return supabaseResponse
}
