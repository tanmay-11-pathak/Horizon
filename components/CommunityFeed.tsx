'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  media_url?: string | null
  media_type?: string | null
  profiles: { username: string, avatar_url: string | null }
}

interface Community {
  id: string
  slug: string
  name: string
  description: string
  emoji: string
  color: string
}

interface Props {
  community: Community
  initialPosts: Post[]
  memberCount: number
  isMember: boolean
  userId: string | null
}

export default function CommunityFeed({ community, initialPosts, memberCount, isMember: initialIsMember, userId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [isMember, setIsMember] = useState(initialIsMember)
  const [joining, setJoining] = useState(false)
  const [count, setCount] = useState(memberCount)

  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    const channel = supabase
      .channel(`community-${community.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
        filter: `community_id=eq.${community.id}`
      }, async (payload) => {
        // Optimistic update handles the user's own posts
        if (payload.new.user_id === userId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
        setPosts(prev => [{ ...payload.new, profiles: profile } as Post, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [community.id, userId])

  const joinCommunity = async () => {
    if (!userId) { window.location.href = '/sign-up'; return }
    setJoining(true)
    const { error } = await supabase.from('community_members').upsert({
      community_id: community.id,
      user_id: userId
    })
    if (!error) {
      setIsMember(true)
      setCount(prev => prev + 1)
    }
    setJoining(false)
  }

  const submitPost = async () => {
    if ((!input.trim() && !mediaFile) || !userId) return
    if (!isMember) await joinCommunity()
    setPosting(true)
    
    let mediaUrl = null
    let mediaType = null
    
    if (mediaFile) {
      setUploadingMedia(true)
      const fileExt = mediaFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, mediaFile)
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath)
        mediaUrl = publicUrl
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      }
      setUploadingMedia(false)
    }

    const content = input.trim()
    setInput('')
    setMediaFile(null)
    setMediaPreview(null)

    const { data, error } = await supabase.from('community_posts').insert({
      community_id: community.id,
      user_id: userId,
      content,
      media_url: mediaUrl,
      media_type: mediaType
    }).select('*, profiles(username, avatar_url)').single()
    
    if (data) setPosts(prev => [data as Post, ...prev])
    if (error) console.error(error)
    
    setPosting(false)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#080808', fontFamily: 'Inter, -apple-system, sans-serif', color: 'white', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        flexShrink: 0,
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)',
        zIndex: 100
      }}>
        <a href="/" style={{
          background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', textDecoration: 'none'
        }}>Horizon</a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/communities" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>← All Communities</a>
          {userId ? (
            <a href="/chat" style={{
              padding: '8px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: 10, color: 'white', fontSize: 14, textDecoration: 'none', fontWeight: 600
            }}>Open chat</a>
          ) : (
            <a href="/sign-up" style={{
              padding: '8px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: 10, color: 'white', fontSize: 14, textDecoration: 'none', fontWeight: 600
            }}>Get started</a>
          )}
        </div>
      </nav>

      {/* Feed Container */}
      <div style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 48px' }}>
          
          {/* Community header */}
          <div style={{
            padding: '40px 0 32px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 24,
                background: `${community.color}30`,
                border: `2px solid ${community.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
              }}>{community.emoji}</div>
              <div>
                <h1 style={{ color: 'white', fontSize: 32, fontWeight: 700, margin: '0 0 4px' }}>Welcome to {community.name}!</h1>
                <p style={{ color: '#888', fontSize: 15, margin: 0 }}>This is the start of the {community.name} community channel.</p>
              </div>
              <button
                onClick={isMember ? undefined : joinCommunity}
                disabled={joining}
                style={{
                  marginLeft: 'auto', padding: '10px 24px',
                  background: isMember ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${community.color}, ${community.color}cc)`,
                  border: isMember ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  borderRadius: 12, color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: isMember ? 'default' : 'pointer'
                }}
              >{joining ? 'Joining...' : isMember ? '✓ Joined' : 'Join community'}</button>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', color: '#666', fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}/>
                {count.toLocaleString()} members
              </span>
              <span>•</span>
              <span>{community.description}</span>
            </div>
          </div>

          {/* Posts feed */}
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#555', fontSize: 16 }}>
              No messages yet. Say hello!
            </div>
          )}
          {[...posts].reverse().map(post => (
            <div key={post.id} style={{
              padding: '12px 0',
              display: 'flex', gap: 16,
              transition: 'background 0.2s',
              borderRadius: 8,
              marginTop: 4
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                background: 'rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>
                    {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <a href={`/user/${post.profiles?.username}`} style={{ color: 'white', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                    {post.profiles?.username || 'Unknown'}
                  </a>
                  <span style={{ color: '#666', fontSize: 12 }}>{mounted ? formatTime(post.created_at) : ''}</span>
                </div>
                {post.content && (
                  <p style={{ color: '#ddd', fontSize: 15, lineHeight: 1.5, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                )}
                {post.media_url && (
                  <div style={{ marginTop: 8 }}>
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} controls style={{ maxHeight: 300, borderRadius: 12, maxWidth: '100%' }} />
                    ) : (
                      <img src={post.media_url} alt="media" style={{ maxHeight: 300, borderRadius: 12, maxWidth: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Input Bar */}
      <div style={{ flexShrink: 0 }}>
        {mediaPreview && (
          <div style={{ padding: '8px 48px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(8,8,8,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={mediaPreview} alt="preview" style={{ height: 80, borderRadius: 8, maxWidth: 140, objectFit: 'cover' }} />
              <button onClick={() => { setMediaFile(null); setMediaPreview(null) }} style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                borderRadius: '50%', background: '#ef4444', border: 'none',
                color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>×</button>
            </div>
          </div>
        )}

        <div style={{
          padding: '16px 48px 24px',
          borderTop: mediaPreview ? 'none' : '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', color: '#888', cursor: 'pointer', fontSize: 18,
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>📎</button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPost()}
              placeholder={userId ? `Message ${community.name}...` : 'Sign up to chat in this community...'}
              disabled={!userId}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '14px 20px',
                color: 'white', fontSize: 15, outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <button
              onClick={userId ? submitPost : () => window.location.href = '/sign-up'}
              disabled={posting || uploadingMedia || (!input.trim() && !mediaFile && !!userId)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                opacity: (posting || uploadingMedia || (!input.trim() && !mediaFile)) ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >{posting || uploadingMedia ? '...' : 'Send'}</button>
          </div>
        </div>
      </div>
    </main>
  )
}
