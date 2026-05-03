import Link from 'next/link'

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

type MessageItemProps = {
  post: Post
  timestamp: string
  index: number
}

export default function MessageItem({ post, timestamp, index }: MessageItemProps) {
  return (
    <article
      className="group mx-2 flex gap-4 rounded-lg border-l-2 border-transparent px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-l-[rgba(100,180,255,0.25)] hover:bg-white/[0.02] md:mx-0 md:px-6"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1a1a20]">
        {post.profiles?.avatar_url ? (
          <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#2a2a32] text-xs font-semibold text-white">
            {post.profiles?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Link href={`/user/${post.profiles?.username || ''}`} className="text-sm font-semibold text-[#f2f2f7] hover:underline">
            {post.profiles?.username || 'Unknown'}
          </Link>
          <span className="font-mono text-[0.72rem] text-[#8e8e93]/70">{timestamp}</span>
        </div>

        {post.content && <p className="whitespace-pre-wrap text-[0.95rem] leading-6 text-white/85">{post.content}</p>}

        {post.media_url && (
          <div className="mt-3 max-w-[400px] overflow-hidden rounded-xl border border-white/10 bg-[#121216] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:border-[rgba(100,180,255,0.2)]">
            {post.media_type === 'video' ? (
              <video src={post.media_url} controls className="max-h-[300px] w-full" />
            ) : (
              <img src={post.media_url} alt="attachment" className="max-h-[300px] w-full object-cover" />
            )}
          </div>
        )}
      </div>
    </article>
  )
}

