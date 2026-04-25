'use client'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import AISidebar from '@/components/AISidebar'
import Sidebar from '@/components/Sidebar'
import HorizonAI from '@/components/HorizonAI'
import SettingsMenu from '@/components/SettingsMenu'

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
    <div
      className="flex h-full text-white"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, #0d0520 0%, #080808 60%, #000d1a 100%)' }}
    >
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
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: 'rgba(10,10,10,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ color: 'white', fontSize: 16 }}>👥</span>
                </div>
                <div>
                  <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>{groupInfo.name}</p>
                  <p style={{ color: '#555', fontSize: 12, margin: 0 }}>{groupInfo.memberCount} members</p>
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
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${otherUser.is_online ? 'bg-[#22c55e]' : 'bg-[#555]'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{otherUser.username}</p>
                    <p className="text-xs text-[#666]">{otherUser.is_online ? 'Online' : 'Offline'}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-[#666]">No conversation selected</p>
              )}
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
            className="flex-1 overflow-y-auto px-6 py-5 space-y-3"
            style={{ animation: 'fadeIn 0.3s ease forwards' }}
          >
            {conversationId === null ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium">Welcome to Horizon</p>
                <p className="text-[#666] text-sm">Search for a user in the sidebar to start chatting</p>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <p className="text-center text-[#666] mt-10">No messages yet. Say hello!</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex message-bubble ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-xs ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}>
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
                          className={`px-4 py-2 rounded-2xl text-sm text-white ${msg.sender_id === userId ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          style={
                            msg.sender_id === userId
                              ? {
                                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                  boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                }
                          }
                        >
                          {msg.content}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: '#555' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id !== userId && (
                          <button
                            onClick={() => translateMessage(msg.id, msg.content)}
                            style={{
                              background: 'none', border: 'none',
                              color: '#555', fontSize: 11,
                              cursor: 'pointer', padding: '0 4px'
                            }}
                          >
                            {translatingId === msg.id ? '...' : '🌐'}
                          </button>
                        )}
                        {msg.sender_id === userId && (
                          <span style={{ fontSize: 11, color: msg.is_read ? '#7c3aed' : '#555' }}>
                            {msg.is_read ? '\u2713\u2713' : '\u2713'}
                          </span>
                        )}
                      </div>
                      {translatedMessages[msg.id] && (
                        <p style={{
                          fontSize: 12, color: '#888',
                          margin: '4px 0 0', fontStyle: 'italic',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.04)',
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
            )}
          </main>

          {isTyping && (
            <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '8px 14px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>{otherUser?.username} is typing...</span>
            </div>
          )}

          <footer
            className="px-6 py-4"
            style={{
              background: 'rgba(10,10,10,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {loadingReplies && smartReplies.length === 0 && (
              <div style={{ padding: '8px 24px', color: '#666', fontSize: 12 }}>
                Thinking...
              </div>
            )}
            {smartReplies.length > 0 && (
              <div style={{
                padding: '8px 24px',
                display: 'flex', gap: 8, flexWrap: 'wrap'
              }}>
                {smartReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(reply)
                      setSmartReplies([])
                    }}
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 20, color: '#c4b5fd',
                      fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.15)'
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
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\uD83D\uDCCE'}
              </button>
              <input
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-[#666] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:border-[rgba(124,58,237,0.5)]"
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={conversationId === null}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2.5 rounded-xl text-white text-sm transition-colors disabled:opacity-50 neon-purple hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                }}
                disabled={conversationId === null || uploadingMedia}
              >
                {uploadingMedia ? 'Uploading...' : 'Send'}
              </button>
            </div>
            {sendError && <p className="pt-2 text-sm text-red-400">{sendError}</p>}
          </footer>
        </section>
      )}
    </div>
  )
}
