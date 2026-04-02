import { supabase } from './supabase'

export async function syncProfile(userId: string, email?: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      email: email || null,
      is_online: true,
      last_seen: new Date().toISOString()
    })
  } else {
    await supabase.from('profiles').update({
      is_online: true,
      last_seen: new Date().toISOString()
    }).eq('id', userId)
  }
}
