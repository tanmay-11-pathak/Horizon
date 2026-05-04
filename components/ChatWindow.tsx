'use client'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AISidebar from '@/components/AISidebar'
import Sidebar from '@/components/Sidebar'
import HorizonAI from '@/components/HorizonAI'
import SettingsMenu from '@/components/SettingsMenu'
import NotificationBell from '@/components/NotificationBell'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  media_url: string | null
  media_type: string | null
}

interface Props {
  userId: string
}

interface OtherUser {
  id: string
  username: string
  avatar_url: string | null
  is_online: boolean
  last_seen: string | null
}

export default function ChatWindow({ userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [smartReplies, setSmartReplies] = useState<string[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({})
  const [translatingId, setTranslatingId] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showHorizonAI, setShowHorizonAI] = useState(false)
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [groupInfo, setGroupInfo] = useState<{ name: string; memberCount: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastPresenceUpdate = useRef<number>(0)
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const formatDbError = (error: {
    message?: string | null
    details?: string | null
    hint?: string | null
    code?: string | null
  }) =>
    error.message || error.details || error.hint || `Database error (code: ${error.code || 'unknown'})`

  const ensureProfile = async () => {
    const { error } = await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' })
    if (error) {
      setSendError(`Profile setup failed: ${formatDbError(error)}`)
      return false
    }
    return true
  }

  const isRecentlyOnline = (last_seen: string | null, is_online: boolean) => {
    if (!is_online || !last_seen) return false
    const diff = Date.now() - new Date(last_seen).getTime()
    return diff < 2 * 60 * 1000
  }

  const updatePresence = useCallback(
    (force = false) => {
      const now = Date.now()
      if (!force && now - lastPresenceUpdate.current < 20000) return
      lastPresenceUpdate.current = now
      void supabase
        .from('profiles')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', userId)
    },
    [userId]
  )

  const setOffline = useCallback(() => {
    void supabase
      .from('profiles')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('id', userId)
  }, [userId])

  useEffect(() => {
    updatePresence(true)
    const heartbeat = window.setInterval(() => updatePresence(true), 30000)

    const handleBeforeUnload = () => setOffline()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') setOffline()
      else updatePresence(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setOffline()
    }
  }, [setOffline, updatePresence])

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => updatePresence()
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity))
    return () => events.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
  }, [updatePresence])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data))
  }, [userId])

  useEffect(() => {
    if (!conversationId) {
      setOtherUser(null)
      return
    }

    supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (!data) {
          setOtherUser(null)
          return
        }

        supabase
          .from('profiles')
          .select('id, username, avatar_url, is_online, last_seen')
          .eq('id', data.user_id)
          .single()
          .then(({ data: userProfile }) => {
            if (!userProfile) {
              setOtherUser(null)
              return
            }

            setOtherUser({
              ...userProfile,
              is_online: isRecentlyOnline(userProfile.last_seen, userProfile.is_online),
            } as OtherUser)
          })
      })
  }, [conversationId, userId])

  useEffect(() => {
    if (!conversationId) return

    supabase
      .from('conversations')
      .select('is_group, group_name')
      .eq('id', conversationId)
      .single()
      .then(({ data }) => {
        if (data?.is_group) {
          supabase
            .from('conversation_members')
            .select('user_id', { count: 'exact' })
            .eq('conversation_id', conversationId)
            .then(({ count }) => {
              setGroupInfo({ name: data.group_name || 'Group', memberCount: count || 0 })
              setOtherUser(null)
            })
        } else {
          setGroupInfo(null)
        }
      })
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`presence-${conversationId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (!otherUser) return
        const updated = payload.new as { id?: string; is_online?: boolean; last_seen?: string | null }
        if (!updated.id || updated.id === userId || updated.id !== otherUser.id) return

        const online = isRecentlyOnline(updated.last_seen ?? null, Boolean(updated.is_online))
        setOtherUser((prev) =>
          prev
            ? {
                ...prev,
                is_online: online,
                last_seen: updated.last_seen ?? prev.last_seen,
              }
            : prev
        )
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, otherUser, userId])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    void (async () => {
      const hasProfile = await ensureProfile()
      if (!hasProfile) return

      await supabase.from('conversation_members').upsert({
        conversation_id: conversationId,
        user_id: userId,
      })

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)
    })()

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data || []) as Message[]))

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            if (newMsg.sender_id !== userId) void fetchSmartReplies(newMsg.content)
            return [...prev, newMsg]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((message) => (message.id === updated.id ? updated : message)))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, userId])

  useEffect(() => {
    if (!conversationId) {
      typingChannelRef.current = null
      setIsTyping(false)
      return
    }

    let timeout: ReturnType<typeof setTimeout>
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const typingUserId = (payload.payload as { userId?: string })?.userId
        if (typingUserId && typingUserId !== userId) {
          setIsTyping(true)
          clearTimeout(timeout)
          timeout = setTimeout(() => setIsTyping(false), 2000)
        }
      })
      .subscribe()

    typingChannelRef.current = channel

    return () => {
      typingChannelRef.current = null
      clearTimeout(timeout)
      void supabase.removeChannel(channel)
    }
  }, [conversationId, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const clearMediaSelection = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(null)
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Maximum size is 50MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (conversationId && typingChannelRef.current) {
      void typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId } })
    }
  }

  const fetchSmartReplies = async (message: string) => {
    setLoadingReplies(true)
    setSmartReplies([])
    try {
      const res = await fetch('/api/ai/smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: message }),
      })
      const data = await res.json()
      setSmartReplies(data.replies || [])
    } catch {
      setSmartReplies([])
    }
    setLoadingReplies(false)
  }

  const translateMessage = async (msgId: string, content: string) => {
    setTranslatingId(msgId)
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, targetLanguage: 'English' }),
    })
    const data = await res.json()
    setTranslatedMessages((prev) => ({ ...prev, [msgId]: data.translated }))
    setTranslatingId(null)
  }

  const sendMessage = async () => {
    if ((!input.trim() && !mediaFile) || !conversationId) return

    const content = input.trim()
    setInput('')
    setSendError(null)

    let mediaUrl: string | null = null
    let mediaType: string | null = null

    if (mediaFile) {
      setUploadingMedia(true)
      const fileExt = mediaFile.name.split('.').pop()
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('chat-media').upload(filePath, mediaFile)

      if (!error) {
        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath)
        mediaUrl = data.publicUrl
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      } else {
        setSendError(`Media upload failed: ${formatDbError(error)}`)
      }

      setUploadingMedia(false)
      clearMediaSelection()
    }

    const hasProfile = await ensureProfile()
    if (!hasProfile) {
      setInput(content)
      return
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content || '',
        media_url: mediaUrl,
        media_type: mediaType,
      })
      .select()
      .single()

    if (error) {
      setSendError(formatDbError(error))
      setInput(content)
      return
    }

    if (data) {
      setMessages((prev) => (prev.some((message) => message.id === data.id) ? prev : [...prev, data as Message]))
    }
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', userId)
    if (error) {
      setSendError(`Delete failed: ${formatDbError(error)}`)
      return
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const statusText = groupInfo
    ? `${groupInfo.memberCount} MEMBERS`
    : otherUser
      ? otherUser.is_online
        ? 'ONLINE'
        : 'OFFLINE'
      : 'NO ACTIVE CHAT'

  return (
    <div className="h-full bg-[#080809] p-4 text-white md:p-6">
      <div className="relative flex h-full overflow-hidden rounded-[32px] border border-white/[0.05] bg-[#121214] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />

        <Sidebar
          userId={userId}
          activeConversationId={conversationId}
          onSelectConversation={(id) => {
            setConversationId(id)
            setShowHorizonAI(false)
          }}
          onSelectHorizonAI={() => setShowHorizonAI(true)}
          isHorizonAIActive={showHorizonAI}
        />

        <section className="relative z-10 flex min-w-0 flex-1 flex-col bg-[#121214]">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{groupInfo ? groupInfo.name : otherUser?.username || 'Horizon Chat'}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-white/40">{statusText}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60 transition-all hover:text-white">
                Home
              </Link>
              <AISidebar messages={messages} />
              <NotificationBell userId={userId} />
              <SettingsMenu username={profile?.username || ''} avatarUrl={profile?.avatar_url || null} />
            </div>
          </header>

          {showHorizonAI ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <HorizonAI userId={userId} />
            </div>
          ) : !conversationId ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">Welcome to Horizon</p>
                <p className="mt-2 font-mono text-xs uppercase text-white/40">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {messages.length === 0 && <p className="mt-10 text-center text-sm text-white/40">No messages yet. Say hello!</p>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}>
                      {msg.media_url && msg.media_type === 'image' && (
                        <div className="mb-2 max-w-[260px] cursor-pointer overflow-hidden rounded-xl" onClick={() => window.open(msg.media_url!, '_blank')}>
                          <img src={msg.media_url} alt="shared" className="block max-h-[300px] w-full object-cover" />
                        </div>
                      )}
                      {msg.media_url && msg.media_type === 'video' && (
                        <div className="mb-2 max-w-[260px] overflow-hidden rounded-xl">
                          <video src={msg.media_url} controls className="block max-h-[300px] w-full" />
                        </div>
                      )}

                      {msg.content && (
                        <div
                          className="px-4 py-3 text-sm leading-relaxed"
                          style={
                            msg.sender_id === userId
                              ? {
                                  background: '#ffffff',
                                  color: '#000000',
                                  borderRadius: 16,
                                  borderBottomRightRadius: 4,
                                }
                              : {
                                  background: '#1c1c1f',
                                  color: '#f5f5f5',
                                  borderRadius: 16,
                                  borderBottomLeftRadius: 4,
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }
                          }
                        >
                          {msg.content}
                        </div>
                      )}

                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                        </span>
                        {msg.sender_id === userId && (
                          <button onClick={() => deleteMessage(msg.id)} className="text-[11px] text-white/35 hover:text-white/70">
                            Delete
                          </button>
                        )}
                        {msg.sender_id !== userId && (
                          <button
                            onClick={() => translateMessage(msg.id, msg.content)}
                            className="text-[11px] text-white/35 hover:text-white/70"
                          >
                            {translatingId === msg.id ? '...' : 'Translate'}
                          </button>
                        )}
                        {msg.sender_id === userId && (
                          <span className="font-mono text-[10px] uppercase text-white/35">{msg.is_read ? 'SEEN' : 'SENT'}</span>
                        )}
                      </div>

                      {translatedMessages[msg.id] && (
                        <p className="mt-1 rounded-lg border border-white/10 bg-[#1c1c1f] px-3 py-2 text-xs italic text-white/55">
                          {translatedMessages[msg.id]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </main>

              {isTyping && (
                <div className="px-6 pb-3">
                  <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-[#1c1c1f] px-4 py-2">
                    <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white/50" />
                  </div>
                </div>
              )}

              <footer className="border-t border-white/[0.06] bg-[#121214] px-6 py-4">
                {loadingReplies && smartReplies.length === 0 && <div className="pb-3 text-xs text-white/35">Thinking...</div>}

                {smartReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-3">
                    {smartReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(reply)
                          setSmartReplies([])
                        }}
                        className="rounded-xl border border-white/10 bg-[#1c1c1f] px-3 py-1.5 text-xs text-white/75 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {mediaPreview && (
                  <div className="mb-3 flex items-center gap-3">
                    <div className="relative inline-block">
                      {mediaFile?.type.startsWith('video/') ? (
                        <video src={mediaPreview} className="h-20 max-w-[140px] rounded-lg" />
                      ) : (
                        <img src={mediaPreview} alt="preview" className="h-20 max-w-[140px] rounded-lg object-cover" />
                      )}
                      <button
                        onClick={clearMediaSelection}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      >
                        x
                      </button>
                    </div>
                    <span className="text-xs text-white/35">{uploadingMedia ? 'Uploading...' : 'Ready to send'}</span>
                  </div>
                )}

                <div
                  className="flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] focus-within:border-white/30"
                >
                  <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={conversationId === null}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                  <input
                    className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/30"
                    placeholder="Message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={conversationId === null}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={conversationId === null || uploadingMedia}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
                {sendError && <p className="pt-2 text-sm text-red-400">{sendError}</p>}
              </footer>
            </>
          )}
        </section>

      </div>
    </div>
  )
}
