'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  content: string
  sender_username: string
  sender_avatar: string | null
  conversation_id: string
  created_at: string
  is_read: boolean
}

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    loadNotifications()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as {
            id: string
            content: string | null
            sender_id: string
            conversation_id: string
            created_at: string
          }
          if (msg.sender_id === userId) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', msg.sender_id)
            .single()

          const newNotif: Notification = {
            id: msg.id,
            content: msg.content || '?? Media',
            sender_username: profile?.username || 'Someone',
            sender_avatar: profile?.avatar_url || null,
            conversation_id: msg.conversation_id,
            created_at: msg.created_at,
            is_read: false,
          }

          setNotifications((prev) => [newNotif, ...prev.slice(0, 19)])

          if (permission === 'granted') {
            new Notification(`New message from ${newNotif.sender_username}`, {
              body: newNotif.content,
              icon: newNotif.sender_avatar || '/favicon.ico',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, permission])

  const loadNotifications = async () => {
    const { data: convMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!convMembers || convMembers.length === 0) return

    const convIds = convMembers.map((m) => m.conversation_id)

    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, sender_id, conversation_id, created_at, is_read')
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!messages) return

    const notifs: Notification[] = []
    for (const msg of messages) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', msg.sender_id)
        .single()
      notifs.push({
        id: msg.id,
        content: msg.content || '?? Media',
        sender_username: profile?.username || 'Someone',
        sender_avatar: profile?.avatar_url || null,
        conversation_id: msg.conversation_id,
        created_at: msg.created_at,
        is_read: msg.is_read,
      })
    }
    setNotifications(notifs)
  }

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
    }
  }

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (ids.length === 0) return
    await supabase.from('messages').update({ is_read: true }).in('id', ids)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) markAllRead()
        }}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '8px 10px',
          cursor: 'pointer',
          color: unreadCount > 0 ? '#7c3aed' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s',
          boxShadow: unreadCount > 0 ? '0 0 12px rgba(124,58,237,0.3)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          {unreadCount > 0 && <circle cx="18" cy="6" r="4" fill="#7c3aed" stroke="none" />}
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#7c3aed',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(124,58,237,0.5)',
              animation: 'pulse-dot 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 80,
            width: 340,
            maxHeight: 480,
            background: 'rgba(12,12,12,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.1)',
            zIndex: 99999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>Notifications</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 8,
                    padding: '4px 10px',
                    color: '#c4b5fd',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Enable alerts
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>??</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    background: notif.is_read ? 'transparent' : 'rgba(124,58,237,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => {
                    setOpen(false)
                    window.location.href = '/chat'
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(124,58,237,0.3)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {notif.sender_avatar ? (
                      <img
                        src={notif.sender_avatar}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                        {notif.sender_username[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
                        {notif.sender_username}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 13,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notif.content}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#7c3aed',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
