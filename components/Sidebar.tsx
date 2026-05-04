'use client'
import { useCallback, useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CreateGroupModal from '@/components/CreateGroupModal'
import { ProfileEditDialog } from '@/components/profile-edit-dialog'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  is_online: boolean
  last_seen: string | null
}

interface Conversation {
  id: string
  is_group: boolean
  group_name: string | null
  other_user: Profile | null
  last_message: string | null
  last_message_time: string | null
  unread_count: number
}

interface MyProfile {
  username: string
  avatar_url: string | null
}

interface Props {
  userId: string
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onSelectHorizonAI: () => void
  isHorizonAIActive: boolean
}

const gradients = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-orange-500',
]

const getGradient = (name: string) => gradients[name.charCodeAt(0) % gradients.length]

export default function Sidebar({ userId, activeConversationId, onSelectConversation, onSelectHorizonAI, isHorizonAIActive }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const { signOut } = useClerk()
  const router = useRouter()

  const loadConversations = useCallback(async () => {
    const { data: members } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!members || members.length === 0) {
      setConversations([])
      return
    }

    const convIds = members.map((m) => m.conversation_id)
    const convList: Conversation[] = []

    for (const convId of convIds) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('is_group, group_name')
        .eq('id', convId)
        .single()

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (convData?.is_group) {
        convList.push({
          id: convId,
          is_group: true,
          group_name: convData.group_name,
          other_user: null,
          last_message: lastMsg?.content || null,
          last_message_time: lastMsg?.created_at || null,
          unread_count: count || 0,
        })
        continue
      }

      const { data: otherMember } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', convId)
        .neq('user_id', userId)
        .single()

      if (!otherMember) continue

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_online, last_seen')
        .eq('id', otherMember.user_id)
        .single()

      if (!otherProfile) continue

      convList.push({
        id: convId,
        is_group: false,
        group_name: null,
        other_user: otherProfile,
        last_message: lastMsg?.content || null,
        last_message_time: lastMsg?.created_at || null,
        unread_count: count || 0,
      })
    }

    convList.sort((a, b) => {
      if (!a.last_message_time) return 1
      if (!b.last_message_time) return -1
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    })

    setConversations(convList)
  }, [userId])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }) => setMyProfile((data || null) as MyProfile | null))
  }, [userId])

  useEffect(() => {
    void loadConversations()

    const channel = supabase
      .channel(`sidebar-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        void loadConversations()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        void loadConversations()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members' }, () => {
        void loadConversations()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        void loadConversations()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, loadConversations])

  const searchUsers = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)

    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_online, last_seen')
      .ilike('username', `%${query}%`)
      .neq('id', userId)
      .limit(10)

    setSearchResults(data || [])
    setSearching(false)
  }

  const startConversation = async (otherUserId: string) => {
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (myConvs) {
      for (const conv of myConvs) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)

        if (!members) continue

        const userIds = Array.from(new Set(members.map((member) => member.user_id)))
        const isExactPrivatePair = userIds.length === 2 && userIds.includes(userId) && userIds.includes(otherUserId)

        if (isExactPrivatePair) {
          onSelectConversation(conv.conversation_id)
          setSearchQuery('')
          setSearchResults([])
          return
        }
      }
    }

    const { data: newConv } = await supabase.from('conversations').insert({}).select().single()

    if (newConv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: userId },
        { conversation_id: newConv.id, user_id: otherUserId },
      ])
      onSelectConversation(newConv.id)
      setSearchQuery('')
      setSearchResults([])
      void loadConversations()
    }
  }

  const formatTime = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()
  }

  const isRecentlyOnline = (last_seen: string | null, is_online: boolean) => {
    if (!is_online || !last_seen) return false
    const diff = Date.now() - new Date(last_seen).getTime()
    return diff < 2 * 60 * 1000
  }

  const renderAvatar = (username: string, avatarUrl: string | null, sizeClass: string) => {
    if (avatarUrl) return <img src={avatarUrl} alt="" className={`${sizeClass} object-cover`} />

    return (
      <div className={`${sizeClass} bg-gradient-to-br ${getGradient(username || '?')} flex items-center justify-center`}>
        <span className="text-sm font-semibold text-white">{(username?.[0] || '?').toUpperCase()}</span>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="relative z-10 flex h-full w-[420px] shrink-0 overflow-hidden border-r border-white/[0.05] bg-[#121214]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex w-20 shrink-0 flex-col items-center justify-between border-r border-white/[0.06] py-5">
        <div className="flex flex-col items-center gap-3">
          <Link href="/chat" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg text-white transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20">💬</Link>
          <Link href="/communities" className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg text-white/70 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:text-white">🌐</Link>
          <Link href="/mentors" className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg text-white/70 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:text-white">✦</Link>
        </div>
        <Link href="/profile" className="overflow-hidden rounded-2xl border border-white/10">
          {renderAvatar(myProfile?.username || '?', myProfile?.avatar_url || null, 'h-11 w-11')}
        </Link>
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/[0.06] px-5 py-5">
          <h1 className="text-xl font-extrabold tracking-tight text-white">Horizon</h1>
          <p className="mt-1 font-mono text-[11px] uppercase text-white/35">COMMUNICATION HUB</p>
          <input
            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0f0f11] px-4 py-3 text-sm text-white outline-none transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] placeholder:text-white/35 focus:border-white/25"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
          />
          <button
            onClick={() => setShowCreateGroup(true)}
            className="mt-3 w-full rounded-2xl border border-dashed border-white/15 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/55 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-white/35 hover:text-white"
          >
            New Group
          </button>
        </div>

        {showCreateGroup && (
          <CreateGroupModal
            userId={userId}
            onClose={() => setShowCreateGroup(false)}
            onCreated={(id) => {
              setShowCreateGroup(false)
              onSelectConversation(id)
              void loadConversations()
            }}
          />
        )}

        <div className="px-3 pt-3">
          <button
            onClick={() => onSelectHorizonAI()}
            className={`flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${isHorizonAIActive ? 'border-white/20 bg-white/10' : 'border-white/8 bg-[#1c1c1f] hover:bg-white/5'}`}
          >
            <div className="relative h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-white">Horizon AI</p>
                <p className="font-mono text-[10px] uppercase text-white/35">NOW</p>
              </div>
              <p className="truncate text-xs text-white/45">How can I assist your workflow today?</p>
            </div>
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {searchQuery ? (
            <>
              {searching && <p className="px-2 py-3 text-xs text-white/45">Searching...</p>}
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user.id)}
                  className="mb-2 flex w-full items-center gap-3 rounded-[20px] border border-white/10 bg-[#1c1c1f] px-3 py-3 text-left transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10"
                >
                  <div className="relative shrink-0">
                    {renderAvatar(user.username, user.avatar_url, 'h-11 w-11 rounded-xl')}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#1c1c1f] ${isRecentlyOnline(user.last_seen, user.is_online) ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                    <p className="truncate font-mono text-[10px] uppercase text-white/35">{user.full_name || 'START CONVERSATION'}</p>
                  </div>
                </button>
              ))}
              {!searching && searchResults.length === 0 && <p className="px-2 py-3 text-xs text-white/45">No users found</p>}
            </>
          ) : (
            <>
              {conversations.length === 0 && (
                <p className="px-2 py-3 text-xs text-white/45">No conversations yet. Search for a user to start chatting.</p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${activeConversationId === conv.id ? 'border-white/20 bg-[#1c1c1f]' : 'border-white/10 bg-[#161618] hover:bg-white/5'}`}
                >
                  {conv.is_group ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2a2a2f] text-xs font-semibold text-white">GR</div>
                  ) : (
                    <div className="relative shrink-0">
                      {renderAvatar(conv.other_user?.username || '?', conv.other_user?.avatar_url || null, 'h-11 w-11 rounded-xl')}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#1c1c1f] ${conv.other_user && isRecentlyOnline(conv.other_user.last_seen, conv.other_user.is_online) ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{conv.is_group ? conv.group_name : conv.other_user?.username}</p>
                      <p className="font-mono text-[10px] uppercase text-white/35">{formatTime(conv.last_message_time)}</p>
                    </div>
                    <p className="truncate text-xs text-white/45">{conv.last_message || 'No messages yet'}</p>
                  </div>

                  {conv.unread_count > 0 && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-black">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-white/[0.06] bg-[#0f0f11] px-4 py-3">
          <div className="flex items-center gap-2">
            <ProfileEditDialog initialData={{ username: myProfile?.username || '', avatarUrl: myProfile?.avatar_url || '' }}>
              <button className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left transition-opacity hover:opacity-80">
                {renderAvatar(myProfile?.username || '?', myProfile?.avatar_url || null, 'h-9 w-9 rounded-lg')}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{myProfile?.username || 'Your profile'}</p>
                  <p className="font-mono text-[10px] uppercase text-white/35">EDIT PROFILE</p>
                </div>
              </button>
            </ProfileEditDialog>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-white/10 px-2.5 py-2 text-xs text-white/55 transition-colors hover:text-white"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
