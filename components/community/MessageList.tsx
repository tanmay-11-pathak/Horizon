import MessageItem from './MessageItem'

type Profile = {
  username: string
  avatar_url: string | null
}

type Post = {
  id: string
  content: string
  created_at: string
  user_id: string
  media_url?: string | null
  media_type?: string | null
  profiles: Profile
}

type MessageListProps = {
  posts: Post[]
  mounted: boolean
  formatTime: (iso: string) => string
}

export default function MessageList({ posts, mounted, formatTime }: MessageListProps) {
  if (!posts.length) {
    return <div className="py-16 text-center text-base text-[#8e8e93]">No messages yet. Say hello!</div>
  }

  return (
    <section className="space-y-1 pb-32 pt-4 md:pt-6">
      {[...posts].reverse().map((post, index) => (
        <div key={post.id} className="animate-[fadeIn_0.4s_ease_forwards] opacity-0">
          <MessageItem post={post} timestamp={mounted ? formatTime(post.created_at) : ''} index={index} />
        </div>
      ))}
    </section>
  )
}

