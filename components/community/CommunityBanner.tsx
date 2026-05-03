type Community = {
  id: string
  slug: string
  name: string
  description: string
  emoji: string
  color: string
}

type CommunityBannerProps = {
  community: Community
  count: number
  isMember: boolean
  joining: boolean
  onJoin: () => void
}

export default function CommunityBanner({
  community,
  count,
  isMember,
  joining,
  onJoin,
}: CommunityBannerProps) {
  return (
    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(58,134,255,0.06)_0%,transparent_40%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:flex-row md:items-center">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-3xl shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          style={{ background: `linear-gradient(135deg, ${community.color}30 0%, #121216 100%)` }}
        >
          {community.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#f2f2f7] md:text-3xl">
            {community.name}
          </h1>
          <p className="mb-3 max-w-3xl text-sm leading-6 text-[#8e8e93] md:text-[0.95rem]">
            {community.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8e8e93] md:text-sm">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
              {count.toLocaleString()} Members
            </span>
            <span>•</span>
            <span>Community Chat Workspace</span>
          </div>
        </div>

        <button
          onClick={isMember ? undefined : onJoin}
          disabled={joining || isMember}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#f2f2f7] transition-all hover:bg-white/10 disabled:cursor-default disabled:opacity-100"
        >
          {joining ? 'Joining...' : isMember ? 'Joined' : 'Join Community'}
        </button>
      </div>
    </section>
  )
}


