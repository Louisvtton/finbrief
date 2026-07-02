import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// CLIENT-SIDE: uses cookies (not localStorage) so the server can read the session
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// SERVER-SIDE: service role client — bypasses RLS, use only in API routes
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
