import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Lazy-init: avoid crashing during Next.js static prerendering (build time)
let _supabase = null

export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabase) {
      if (!supabaseUrl) {
        // During build/prerender, return a no-op stub
        console.warn('[Supabase] URL mancante — probabile fase di build/prerender.')
        return typeof prop === 'string' ? () => ({ data: null, error: null }) : undefined
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    return _supabase[prop]
  }
})
