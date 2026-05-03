'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import CommunityHeader from '@/components/community/CommunityHeader'
import CommunityBanner from '@/components/community/CommunityBanner'
import MessageList from '@/components/community/MessageList'
import ChatInput from '@/components/community/ChatInput'
import CursorGlow from '@/components/community/CursorGlow'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  media_url?: string | null
  media_type?: string | null
  profiles: { username: string; avatar_url: string | null }
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

export default function CommunityFeed({
  community,
  initialPosts,
  memberCount,
  isMember: initialIsMember,
  userId,
}: Props) {
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    const channel = supabase
      .channel(`community-${community.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${community.id}`,
        },
        async (payload) => {
          if (payload.new.user_id === userId) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          setPosts((prev) => [{ ...(payload.new as Post), profiles: profile } as Post, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [community.id, userId])

  const joinCommunity = async () => {
    if (!userId) {
      window.location.href = '/sign-up'
      return
    }
    setJoining(true)
    const { error } = await supabase.from('community_members').upsert({
      community_id: community.id,
      user_id: userId,
    })
    if (!error) {
      setIsMember(true)
      setCount((prev) => prev + 1)
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
        const {
          data: { publicUrl },
        } = supabase.storage.from('chat-media').getPublicUrl(filePath)
        mediaUrl = publicUrl
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      }
      setUploadingMedia(false)
    }

    const content = input.trim()
    setInput('')
    setMediaFile(null)
    setMediaPreview(null)

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: community.id,
        user_id: userId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
      })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (data) setPosts((prev) => [data as Post, ...prev])
    if (error) console.error(error)

    setPosting(false)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0c] font-sans text-[#f2f2f7]">
      <CursorGlow />
      <CommunityHeader userId={userId} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <CommunityBanner
          community={community}
          count={count}
          isMember={isMember}
          joining={joining}
          onJoin={joinCommunity}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl">
            <MessageList posts={posts} mounted={mounted} formatTime={formatTime} />
            <div ref={bottomRef} className="h-px" />
          </div>
        </div>

        <ChatInput
          communityName={community.name}
          userId={userId}
          input={input}
          setInput={setInput}
          posting={posting}
          uploadingMedia={uploadingMedia}
          mediaFile={mediaFile}
          mediaPreview={mediaPreview}
          setMediaFile={setMediaFile}
          setMediaPreview={setMediaPreview}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onSubmit={submitPost}
        />
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}


