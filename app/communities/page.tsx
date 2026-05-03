import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import CommunityWeaveSection from '@/components/CommunityWeaveSection'

export default async function CommunitiesPage() {
  const { userId } = await auth()

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#080808]/90 px-6 py-4 backdrop-blur md:px-12">
        <Link href="/" className="text-[22px] font-bold tracking-tight text-white">
          Horizon
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/chat" className="text-[#888] hover:text-white">
            Chat
          </Link>
          <Link href="/communities" className="font-semibold text-white">
            Communities
          </Link>
          <Link href="/mentors" className="text-[#888] hover:text-white">
            AI Mentors
          </Link>
          <Link
            href={userId ? '/chat' : '/sign-up'}
            className="rounded-[10px] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] px-5 py-2 font-semibold text-white"
          >
            {userId ? 'Open app' : 'Get started'}
          </Link>
        </div>
      </nav>

      <CommunityWeaveSection />
    </main>
  )
}
