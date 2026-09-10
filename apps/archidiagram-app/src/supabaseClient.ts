import { createClient } from '@supabase/supabase-js'

// Thay thế bằng Project URL và Anon Key lấy từ Supabase Dashboard của bạn
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
