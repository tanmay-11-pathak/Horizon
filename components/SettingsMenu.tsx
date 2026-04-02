'use client'
import { useEffect, useRef, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Props {
  username: string
  avatarUrl: string | null
}

export default function SettingsMenu({ username, avatarUrl }: Props) {
  const [open, setOpen] = useState(false)
  const { signOut } = useClerk()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-white">
            {username?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute right-0 top-11 w-48 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333]">
            <p className="text-sm font-medium text-white">{username || 'Your account'}</p>
            <p className="text-xs text-gray-400">Your account</p>
          </div>
          <a
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Edit profile
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-[#2a2a2a] transition-colors w-full text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
