import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  is_online: boolean
  last_seen: string
  created_at: string
}
