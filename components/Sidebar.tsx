'use client'
import { useCallback, useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        void loadConversations()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, () => {
        void loadConversations()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_members',
      }, () => {
        void loadConversations()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => {
        void loadConversations()
      })
      .subscribe((status) => {
        console.log('Sidebar realtime status:', status)
      })

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
        const isExactPrivatePair =
          userIds.length === 2 &&
          userIds.includes(userId) &&
          userIds.includes(otherUserId)

        if (isExactPrivatePair) {
          onSelectConversation(conv.conversation_id)
          setSearchQuery('')
          setSearchResults([])
          return
        }
      }
    }

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isRecentlyOnline = (last_seen: string | null, is_online: boolean) => {
    if (!is_online) return false
    if (!last_seen) return false
    const diff = Date.now() - new Date(last_seen).getTime()
    return diff < 2 * 60 * 1000
  }

  const renderAvatar = (username: string, avatarUrl: string | null, sizeClass: string) => {
    if (avatarUrl) {
      return <img src={avatarUrl} alt="" className={`${sizeClass} rounded-full object-cover`} />
    }

    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${getGradient(username || '?')} flex items-center justify-center`}>
        <span className="text-sm font-semibold text-white">{(username?.[0] || '?').toUpperCase()}</span>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside
      className="w-80 h-full flex flex-col"
      style={{
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <h1
          className="neon-text"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          Horizon
        </h1>
        <input
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#666] outline-none focus:border-purple-500"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => searchUsers(e.target.value)}
        />
        <button
          onClick={() => setShowCreateGroup(true)}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '8px',
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 10,
            color: '#c4b5fd',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <span>+</span> New Group
        </button>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          userId={userId}
          onClose={() => setShowCreateGroup(false)}
          onCreated={(id) => {
            setShowCreateGroup(false)
            onSelectConversation(id)
            loadConversations()
          }}
        />
      )}

      <div
        onClick={() => onSelectHorizonAI()}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2"
        style={{
          background: isHorizonAIActive ? 'rgba(124,58,237,0.15)' : 'transparent',
          borderLeftColor: isHorizonAIActive ? '#7c3aed' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}
        onMouseEnter={(e) => {
          if (!isHorizonAIActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }}
        onMouseLeave={(e) => {
          if (!isHorizonAIActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(124,58,237,0.4)'
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>✦</span>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>Horizon AI</p>
          <p style={{ color: '#555', fontSize: 12, margin: 0 }}>Ask me anything</p>
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 6px #22c55e'
          }}
        />
      </div>

      {searchQuery ? (
        <div className="flex-1 overflow-y-auto">
          {searching && <p className="text-xs text-[#777] p-4">Searching...</p>}
          {searchResults.map((user) => (
            <div
              key={user.id}
              onClick={() => startConversation(user.id)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <div className="relative">
                {renderAvatar(user.username, user.avatar_url, 'w-11 h-11')}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isRecentlyOnline(user.last_seen, user.is_online) ? 'bg-[#22c55e]' : 'bg-[#555]'}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`/user/${user.username}`}
                    className="text-sm font-medium text-white truncate hover:text-[#c4b5fd]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user.username}
                  </a>
                  <a
                    href={`/user/${user.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#777] hover:text-[#c4b5fd] transition-colors"
                    title="View profile"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c1.8-3.1 4.6-5 8-5s6.2 1.9 8 5" />
                    </svg>
                  </a>
                </div>
                <p className="text-xs text-[#888] truncate">{user.full_name || ''}</p>
              </div>
            </div>
          ))}
          {!searching && searchResults.length === 0 && (
            <p className="text-xs text-[#777] p-4">No users found</p>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-[#777] p-4">No conversations yet. Search for a user to start chatting!</p>
          )}

          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 ${activeConversationId === conv.id ? 'bg-[rgba(124,58,237,0.15)] border-l-[#7c3aed]' : 'border-l-transparent hover:bg-[rgba(255,255,255,0.04)]'}`}
            >
              {conv.is_group ? (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ color: 'white', fontSize: 16 }}>👥</span>
                </div>
              ) : (
                <div className="relative shrink-0">
                  {renderAvatar(conv.other_user?.username || '?', conv.other_user?.avatar_url || null, 'w-11 h-11')}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conv.other_user ? (isRecentlyOnline(conv.other_user.last_seen, conv.other_user.is_online) ? 'bg-[#22c55e]' : 'bg-[#555]') : 'bg-[#555]'}`}
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">{conv.is_group ? conv.group_name : conv.other_user?.username}</p>
                  <p className="text-[11px] text-[#555] shrink-0">{formatTime(conv.last_message_time)}</p>
                </div>
                <p className="text-xs text-[#888] truncate">{conv.last_message || 'No messages yet'}</p>
              </div>

              {conv.unread_count > 0 && (
                <span className="bg-[#22c55e] text-white text-[11px] rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#161616] border-t border-[#222] p-4 flex items-center gap-3">
        <ProfileEditDialog initialData={{ username: myProfile?.username || '', avatarUrl: myProfile?.avatar_url || '' }}>
          <button className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer outline-none">
            {renderAvatar(myProfile?.username || '?', myProfile?.avatar_url || null, 'w-9 h-9')}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{myProfile?.username || 'Your profile'}</p>
              <p className="text-xs text-[#888] hover:text-[#c4b5fd] transition-colors">Edit profile</p>
            </div>
          </button>
        </ProfileEditDialog>
        <button
          onClick={handleSignOut}
          className="ml-auto p-2 rounded-lg hover:bg-[#222] transition-colors"
          title="Sign out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
