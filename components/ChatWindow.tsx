'use client'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import AISidebar from '@/components/AISidebar'
import Sidebar from '@/components/Sidebar'
import HorizonAI from '@/components/HorizonAI'
import SettingsMenu from '@/components/SettingsMenu'
import AnoAI from '@/components/ui/animated-shader-background'

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
  const [profile, setProfile] = useState<{ username: string, avatar_url: string | null } | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [groupInfo, setGroupInfo] = useState<{ name: string, memberCount: number } | null>(null)
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
    error.message ||
    error.details ||
    error.hint ||
    `Database error (code: ${error.code || 'unknown'})`

  const ensureProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })

    if (error) {
      const message = formatDbError(error)
      console.warn('Profile ensure error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      setSendError(`Profile setup failed: ${message}`)
      return false
    }

    return true
  }

  const isRecentlyOnline = (last_seen: string | null, is_online: boolean) => {
    if (!is_online) return false
    if (!last_seen) return false
    const diff = Date.now() - new Date(last_seen).getTime()
    return diff < 2 * 60 * 1000
  }

  const updatePresence = useCallback((force = false) => {
    const now = Date.now()
    if (!force && now - lastPresenceUpdate.current < 20000) return
    lastPresenceUpdate.current = now
    void supabase
      .from('profiles')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})
  }, [userId])

  const setOffline = useCallback(() => {
    void supabase
      .from('profiles')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {})
  }, [userId])

  useEffect(() => {
    updatePresence(true)
    const heartbeat = window.setInterval(() => {
      updatePresence(true)
    }, 30000)

    const handleBeforeUnload = () => {
      setOffline()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOffline()
      } else {
        updatePresence(true)
      }
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
    const handleActivity = () => {
      updatePresence()
    }

    events.forEach((eventName) => window.addEventListener(eventName, handleActivity))

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
    }
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
        if (data) {
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
        } else {
          setOtherUser(null)
        }
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
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
        }
      )
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
        .then(() => {})
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            if (newMsg.sender_id !== userId) {
              void fetchSmartReplies(newMsg.content)
            }
            return [...prev, newMsg]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) =>
            prev.map((message) => (message.id === updated.id ? updated : message))
          )
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
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }
    setMediaFile(null)
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Maximum size is 50MB.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }

    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (conversationId && typingChannelRef.current) {
      void typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId },
      })
    }
  }

  const fetchSmartReplies = async (message: string) => {
    setLoadingReplies(true)
    setSmartReplies([])
    try {
      const res = await fetch('/api/ai/smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: message })
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
      body: JSON.stringify({ text: content, targetLanguage: 'English' })
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
      const { error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, mediaFile)

      if (!error) {
        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath)
        mediaUrl = data.publicUrl
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      } else {
        const message = formatDbError(error)
        setSendError(`Media upload failed: ${message}`)
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
      const message = formatDbError(error)
      console.warn('Send error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      setSendError(message)
      setInput(content)
      return
    }

    if (data) {
      setMessages((prev) =>
        prev.some((message) => message.id === data.id)
          ? prev
          : [...prev, data as Message]
      )
    }
  }

  return (
    <div className="flex h-full text-[#e5e5e5]" style={{ background: '#0d0d0d' }}>
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

      {showHorizonAI ? (
        <HorizonAI userId={userId} />
      ) : !conversationId ? (
        <section className="flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-[#0d0d0d]">
          <AnoAI />
          <div className="z-10 flex flex-col items-center gap-5 text-center">
             <div
               className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{
                 background: 'radial-gradient(circle at 30% 30%, rgba(0,255,214,0.16), rgba(14,24,45,0.72))',
                 border: '1px solid rgba(0,204,255,0.28)',
                 boxShadow: '0 0 28px rgba(0,153,255,0.28), 0 0 52px rgba(0,255,214,0.14)',
               }}
             >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6ff6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
             </div>
             <div>
               <h2 className="text-2xl font-bold text-[#dcf7ff] tracking-tight">Welcome to Horizon</h2>
               <p className="text-[rgba(116,223,255,0.72)] text-sm mt-1">Select a conversation to start messaging</p>
             </div>
          </div>
        </section>
      ) : (
        <section
          key={conversationId || 'empty'}
          className="flex flex-1 flex-col"
          style={{
            animation: 'fadeIn 0.25s ease forwards',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <header
            className="flex items-center justify-between px-8 py-4"
            style={{
              background: '#161616',
              borderBottom: '1px solid #2a2a2a',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
            {groupInfo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0f2030, #1e3e58)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ color: '#E2E8F0', fontSize: 16 }}>👥</span>
                </div>
                <div>
                  <p style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600, margin: 0 }}>{groupInfo.name}</p>
                  <p style={{ color: '#A0AEC0', fontSize: 12, margin: 0 }}>{groupInfo.memberCount} members</p>
                </div>
              </div>
            ) : otherUser ? (
              <>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
                    {otherUser.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {otherUser.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-[15px] font-semibold text-[#E2E8F0] truncate leading-tight">{otherUser.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${otherUser.is_online ? 'bg-[#A0AEC0] animate-pulse' : 'bg-[#4A5568]'}`} />
                      <p className={`text-[12px] leading-tight ${otherUser.is_online ? 'text-[#A0AEC0]' : 'text-[#A0AEC0]'}`}>{otherUser.is_online ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <AISidebar messages={messages} />
              <SettingsMenu
                username={profile?.username || ''}
                avatarUrl={profile?.avatar_url || null}
              />
            </div>
          </header>

          <main
            key={conversationId || 'empty'}
            className="flex-1 overflow-y-auto py-8 space-y-6"
            style={{
              animation: 'fadeIn 0.3s ease forwards',
              paddingLeft: 32,
              paddingRight: 32,
            }}
          >
            <>
                {messages.length === 0 && (
                  <p className="text-center text-[#A0AEC0] mt-10">No messages yet. Say hello!</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex message-bubble ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[60%] ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}>
                      {msg.media_url && msg.media_type === 'image' && (
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            marginBottom: msg.content ? 6 : 0,
                            maxWidth: 260,
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(msg.media_url!, '_blank')}
                        >
                          <img
                            src={msg.media_url}
                            alt="shared image"
                            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 300, objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      {msg.media_url && msg.media_type === 'video' && (
                        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: msg.content ? 6 : 0, maxWidth: 260 }}>
                          <video
                            src={msg.media_url}
                            controls
                            style={{ width: '100%', maxHeight: 300, display: 'block' }}
                          />
                        </div>
                      )}
                      {msg.content && (
                        <div
                          className="px-[18px] py-[14px] text-[14px] leading-[1.5] text-[#e5e5e5]"
                          style={
                            msg.sender_id === userId
                              ? {
                                  background: '#7c3aed',
                                  color: 'white',
                                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 8px 100%)',
                                }
                              : {
                                  background: '#222222',
                                  border: '1px solid #2a2a2a',
                                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                                }
                          }
                        >
                          {msg.content}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#71717a' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id !== userId && (
                          <button
                            onClick={() => translateMessage(msg.id, msg.content)}
                            style={{
                              background: 'none', border: 'none',
                              color: '#71717a', fontSize: 11,
                              cursor: 'pointer', padding: '0 4px'
                            }}
                          >
                            {translatingId === msg.id ? '...' : '🌐'}
                          </button>
                        )}
                        {msg.sender_id === userId && (
                          <span style={{ fontSize: 10, color: '#7c3aed', fontFamily: '"JetBrains Mono", monospace' }}>
                            {msg.is_read ? '\u2713\u2713' : '\u2713'}
                          </span>
                        )}
                      </div>
                      {translatedMessages[msg.id] && (
                        <p style={{
                          fontSize: 12, color: '#71717a',
                          margin: '4px 0 0', fontStyle: 'italic',
                          padding: '6px 10px',
                          background: '#222222',
                          border: '1px solid #2a2a2a',
                          borderRadius: 8
                        }}>
                          {translatedMessages[msg.id]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
            </>
          </main>

          {isTyping && (
            <div
              style={{
                padding: '0 32px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  background: '#2D2D2D',
                  border: '1px solid rgb(31 41 55)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '10px 14px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#A0AEC0', display: 'inline-block' }} />
                <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#A0AEC0', display: 'inline-block' }} />
                <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#A0AEC0', display: 'inline-block' }} />
              </div>
            </div>
          )}

          <footer
            className="py-6"
            style={{
              paddingLeft: 32,
              paddingRight: 32,
              background: '#161616',
              borderTop: '1px solid #2a2a2a',
            }}
          >
            {loadingReplies && smartReplies.length === 0 && (
              <div style={{ padding: '0 0 12px', color: '#71717a', fontSize: 12 }}>
                Thinking...
              </div>
            )}
            {smartReplies.length > 0 && (
              <div style={{
                padding: '0 0 12px',
                display: 'flex', gap: 8, flexWrap: 'wrap'
              }}>
                {smartReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(reply)
                      setSmartReplies([])
                    }}
                    className="hover:brightness-110 transition-all duration-200"
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid #2a2a2a',
                      borderRadius: 0, color: '#c4a67e',
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >{reply}</button>
                ))}
              </div>
            )}
            {mediaPreview && (
              <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} style={{ height: 80, borderRadius: 8, maxWidth: 140 }} />
                  ) : (
                    <img src={mediaPreview} alt="preview" style={{ height: 80, borderRadius: 8, maxWidth: 140, objectFit: 'cover' }} />
                  )}
                  <button
                    onClick={clearMediaSelection}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    x
                  </button>
                </div>
                <span style={{ color: '#666', fontSize: 12 }}>
                  {uploadingMedia ? 'Uploading...' : 'Ready to send'}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={conversationId === null}
                style={{
                  width: '46px',
                  height: '46px',
                  flexShrink: 0,
                  borderRadius: 0,
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <input
                className="flex-1 px-5 py-3.5 text-[14px] outline-none text-[#e5e5e5] placeholder-[#71717a] transition-all duration-200"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid #2a2a2a',
                }}
                placeholder="Etch a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={conversationId === null}
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 text-white font-extrabold text-[12px] uppercase tracking-[1px] transition-all duration-200 disabled:opacity-50 hover:-translate-y-0.5 flex-shrink-0"
                style={{
                  background: '#7c3aed',
                  border: 'none',
                }}
                disabled={conversationId === null || uploadingMedia}
              >
                {uploadingMedia ? 'Uploading...' : 'Send'}
              </button>
            </div>
            {sendError && <p className="pt-2 text-sm text-[#ef4444]">{sendError}</p>}
          </footer>
        </section>
      )}
    </div>
  )
}


