'use client'
export { default } from './ProfileFormGlass'
// Banner-enabled profile editor is implemented in ProfileFormGlass.
import { useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  userId: string
  initialProfile: any
  clerkEmail: string
  clerkAvatar: string
}

function ProfileFormLegacy({ userId, initialProfile, clerkEmail, clerkAvatar }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState(initialProfile?.username || '')
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || clerkAvatar)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
    }

    setUploading(false)
  }

  const saveProfile = async () => {
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    setSaving(true)
    setError('')

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
      full_name: fullName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      email: clerkEmail,
      is_online: true,
      last_seen: new Date().toISOString(),
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/chat')
    }

    setSaving(false)
  }

  return (
    <div className="bg-[#111111] flex flex-col gap-5 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#1e1e1e] border border-[#333]">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-[#888]">
              No photo
            </div>
          )}
        </div>
        <label className="text-sm text-purple-400 cursor-pointer">
          {uploading ? 'Uploading...' : 'Change photo'}
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#aaa]">Username *</label>
        <input
          className="border border-[#333] bg-[#1e1e1e] text-white rounded-xl px-4 py-2 text-sm outline-none"
          placeholder="e.g. tanmay_pathak"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#aaa]">Full name</label>
        <input
          className="border border-[#333] bg-[#1e1e1e] text-white rounded-xl px-4 py-2 text-sm outline-none"
          placeholder="e.g. Tanmay Pathak"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#aaa]">Bio</label>
        <textarea
          className="border border-[#333] bg-[#1e1e1e] text-white rounded-xl px-4 py-2 text-sm outline-none resize-none"
          placeholder="Tell people a bit about yourself..."
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={saveProfile}
        disabled={saving}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  )
}
