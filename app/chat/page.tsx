import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', userId)
    .single()

  if (!profile?.username) {
    const user = await currentUser()
    await supabase.from('profiles').upsert({
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress || null,
      avatar_url: user?.imageUrl || null,
      is_online: true,
      last_seen: new Date().toISOString()
    }, { onConflict: 'id' })
    redirect('/profile')
  }

  return <ChatWindow userId={userId} />
}
