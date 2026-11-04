import { createClient } from '@supabase/supabase-js'

// Values come from the .env file (Vite only exposes variables starting with VITE_).
// The publishable/anon key is safe to ship to the browser: the database's
// row level security policies are what actually protect the data.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env file.')
}

// One shared client for the whole app.
export const supabase = createClient(url, key)
