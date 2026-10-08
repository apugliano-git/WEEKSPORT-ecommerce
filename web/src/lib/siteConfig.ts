import { cache } from 'react'
import { readQuery } from '@/lib/supabase/readQuery'
import { createClient } from '@/lib/supabase/server'

export const getSiteConfig = cache(async () => {
  const supabase = await createClient()
  return readQuery('configuracion_sitio', () => supabase
    .from('configuracion_sitio')
    .select('*')
    .eq('id', 1)
    .maybeSingle().retry(false))
})
