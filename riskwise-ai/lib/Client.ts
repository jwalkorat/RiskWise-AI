import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Per-tab session isolation:
 * Using sessionStorage instead of localStorage so each browser tab
 * maintains its own independent login session.
 * → Tab 1 can be Student, Tab 2 Teacher, Tab 3 Mentor simultaneously.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})