'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

type Community = {
  id: string
  title: string
  members: string
  desc: string
  tags: string[]
  slug: string
  className?: string
}

const communities: Community[] = [
  {
    id: '01',
    title: 'Internships & Jobs',
    members: '12.4K MEMBERS',
    desc: 'Find internships, share opportunities and grow your career.',
    tags: ['CAREER', 'JOBS'],
    slug: 'internships',
  },
  {
    id: '02',
    title: 'Study Groups',
    members: '8.2K MEMBERS',
    desc: 'Find study partners, share notes and ace your exams together.',
    tags: ['NOTES', 'EXAMS', 'COLLAB'],
    slug: 'study',
    className: 'lg:col-span-8',
  },
  {
    id: '03',
    title: 'Gaming',
    members: '24.1K MEMBERS',
    desc: 'Gaming discussions, team finding and tournament announcements.',
    tags: ['TEAM-UP', 'ESPORTS'],
    slug: 'gaming',
    className: 'lg:col-span-4 lg:row-span-2 lg:min-h-[816px] lg:mt-16',
  },
  {
    id: '04',
    title: 'Tech & Coding',
    members: '15.3K MEMBERS',
    desc: 'Programming help, project collabs and tech news.',
    tags: ['DEV', 'PROJECTS'],
    slug: 'tech',
  },
  {
    id: '05',
    title: 'Music & Arts',
    members: '9.7K MEMBERS',
    desc: 'Share your work, find collaborators and discuss creativity.',
    tags: ['MUSIC', 'ARTS'],
    slug: 'music',
  },
]

export default function CommunityWeaveSection() {
  const nodeRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const nodes = nodeRefs.current.filter(Boolean) as HTMLElement[]

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5

      nodes.forEach((node) => {
        const speed = 20
        node.style.boxShadow = `${x * speed}px ${y * speed}px 30px rgba(0,0,0,0.5)`
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            target.style.opacity = '1'
            target.style.transform = 'translateY(0)'
            target.style.transitionDelay = `${index * 0.1}s`
          }
        })
      },
      { threshold: 0.1 }
    )

    nodes.forEach((node) => {
      node.style.opacity = '0'
      node.style.transform = 'translateY(40px)'
      observer.observe(node)
    })

    document.addEventListener('mousemove', onMouseMove)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      observer.disconnect()
    }
  }, [])

  return (
    <section className="relative overflow-x-hidden bg-[#0d0d0c] text-[#f5f5f1]">
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-20">
        <header className="mb-16 md:mb-32">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.3em] text-[#d4ff33]">
            Horizon Communities
          </span>
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
            Find your
            <br />
            people
          </h1>
          <div className="mt-6 flex justify-start md:-mt-8 md:justify-end">
            <div className="border-t border-[#1a1a18] pt-4 text-left font-mono text-xs text-[#888882] md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-right">
              <p>ACTIVE_MEMBERS: 84.9K</p>
              <p>COMMUNITIES: 120+</p>
              <p>LAST_SYNC: LIVE</p>
            </div>
          </div>
        </header>

        <section className="relative grid grid-cols-1 gap-4 lg:grid-cols-12">
          <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#1a1a18" strokeWidth="1" />
            <line x1="40%" y1="0" x2="40%" y2="100%" stroke="#1a1a18" strokeWidth="1" />
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#1a1a18" strokeWidth="1" />
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#1a1a18" strokeWidth="1" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1a1a18" strokeWidth="1" />
          </svg>

          {communities.map((community, i) => (
            <Link
              key={community.id}
              href={`/communities/${community.slug}`}
              className={`group relative col-span-1 flex min-h-[400px] flex-col justify-between overflow-hidden border border-transparent bg-[#1a1a18] p-10 no-underline transition-all duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2.5 hover:border-[rgba(212,255,51,0.3)] hover:bg-[#222220] ${community.className ?? 'lg:col-span-4'}`}
              ref={(el) => {
                nodeRefs.current[i] = el
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10">
                <div className="h-full w-full animate-none bg-[linear-gradient(45deg,transparent_48%,#d4ff33_50%,transparent_52%)] bg-[length:300%_300%] group-hover:animate-[weaveShift_4s_linear_infinite]" />
              </div>

              <div className="relative z-10 mb-8 flex items-center justify-between font-mono text-[0.7rem] text-[#888882]">
                <span>STRAND_{community.id}</span>
                <span>[ {community.members} ]</span>
              </div>

              <div className="relative z-10">
                <h2 className="mb-4 text-[2.5rem] font-extrabold tracking-[-0.02em]">
                  {community.title === 'Gaming' ? (
                    <>
                      Gaming
                      <br />
                      Arena
                    </>
                  ) : (
                    community.title
                  )}
                </h2>
                <p className="max-w-[80%] text-sm text-[#888882]">{community.desc}</p>
              </div>

              <div className="relative z-10 mt-auto pt-8">
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#333] px-2.5 py-1 font-mono text-[0.6rem] text-[#888882]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </section>

        <div className="py-20 text-center">
          <p className="font-mono text-xs text-[#888882]">MISSING A COMMUNITY?</p>
          <button
            type="button"
            className="group relative mt-8 overflow-hidden border border-[#d4ff33] px-8 py-4 font-mono text-xs text-[#d4ff33] transition-colors duration-300 hover:text-[#0d0d0c]"
          >
            <span className="relative z-10">CREATE NEW COMMUNITY</span>
            <span className="absolute inset-y-0 -left-full w-full bg-[#d4ff33] transition-all duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:left-0" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes weaveShift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
    </section>
  )
}
