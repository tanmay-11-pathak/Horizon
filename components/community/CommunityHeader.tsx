import Link from 'next/link'

type CommunityHeaderProps = {
  userId: string | null
}

export default function CommunityHeader({ userId }: CommunityHeaderProps) {
  return (
    <header className="relative z-20 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-b from-[#0a0a0c]/80 to-[#0a0a0c]/40 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-2 font-mono text-[1.05rem] font-medium tracking-tight text-[#f2f2f7]">
        <span className="h-2 w-2 rounded-full bg-[#3a86ff] shadow-[0_0_8px_rgba(64,150,255,0.5)]" />
        HORIZON
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/communities" className="flex items-center gap-1.5 text-xs font-medium text-[#8e8e93] transition-colors hover:text-[#f2f2f7] md:text-sm">
          <span aria-hidden="true">&larr;</span>
          All Communities
        </Link>
        <Link
          href={userId ? '/chat' : '/sign-up'}
          className="rounded-md border border-white/10 bg-[#1a1a20] px-3 py-2 text-xs font-medium text-[#f2f2f7] transition-all hover:border-[rgba(100,180,255,0.15)] hover:bg-[#25252d] md:px-4 md:text-sm"
        >
          {userId ? 'Open Chat' : 'Get Started'}
        </Link>
      </div>
    </header>
  )
}


