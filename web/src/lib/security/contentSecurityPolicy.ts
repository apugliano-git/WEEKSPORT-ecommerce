export function buildContentSecurityPolicy(isDevelopment: boolean, supabaseOrigin: string): string {
  const scriptSource = [
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ].join(' ')
  const supabaseWebSocketOrigin = supabaseOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')

  return [
    "default-src 'self'",
    `script-src ${scriptSource}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
