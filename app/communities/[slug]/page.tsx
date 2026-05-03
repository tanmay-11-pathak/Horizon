import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CommunityFeed from '@/components/CommunityFeed'

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!community) redirect('/communities')

  const { data: posts } = await supabase
    .from('community_posts')
    .select('*, profiles(username, avatar_url)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: memberCount } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id)

  const isMember = userId ? !!(await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', community.id)
    .eq('user_id', userId)
    .single()).data : false

  return (
    <CommunityFeed
      community={community}
      initialPosts={posts || []}
      memberCount={memberCount || 0}
      isMember={isMember}
      userId={userId}
    />
  )
}
