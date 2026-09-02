import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminUser } from '@/lib/security/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Inicializar cliente del servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Actualizar request original
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Actualizar la respuesta a enviar al navegador
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Extraer usuario autenticado (refresca el JWT automáticamente si es necesario)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Blindaje perimetral: Proteger /admin/* excluyendo /admin/login
  const isAdminPath = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')
  const isLoginPath = request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname.startsWith('/admin/login/')

  if (isAdminPath && !isLoginPath && !isAdminUser(user)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    if (user) url.searchParams.set('error', 'forbidden')
    
    // Redirección HTTP 307 (Temporary Redirect)
    return NextResponse.redirect(url, 307)
  }

  return supabaseResponse
}
