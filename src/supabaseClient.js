import { createClient } from '@supabase/supabase-js'

// هذه القيم تُقرأ من متغيرات البيئة في Netlify
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ تأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
