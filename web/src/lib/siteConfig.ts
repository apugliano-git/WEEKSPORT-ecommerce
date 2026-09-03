import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getSiteConfig = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('configuracion_sitio')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  return data
})
