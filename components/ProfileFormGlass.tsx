'use client'
import { useState, type ChangeEvent, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  userId: string
  initialProfile: any
  clerkEmail: string
  clerkAvatar: string
}

export default function ProfileFormGlass({ userId, initialProfile, clerkEmail, clerkAvatar }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState(initialProfile?.username || '')
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || clerkAvatar)
  const [bannerUrl, setBannerUrl] = useState(initialProfile?.banner_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
  }

  const labelStyle: CSSProperties = {
    color: '#888',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
  }

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
    }

    setUploading(false)
  }

  const uploadBanner = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `banner-${userId}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setBannerUrl(data.publicUrl)
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

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
      full_name: fullName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      email: clerkEmail,
      is_online: true,
      last_seen: new Date().toISOString(),
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      router.push('/chat')
    }

    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div style={{ position: 'relative', marginBottom: 60, borderRadius: 16, overflow: 'visible' }}>
        <div
          style={{
            width: '100%',
            height: 120,
            borderRadius: 16,
            background: bannerUrl ? 'none' : 'linear-gradient(135deg, #1a0533, #0d1a3a)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {bannerUrl && (
            <img src={bannerUrl} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <label
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              cursor: 'pointer',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0'
            }}
          >
            <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>Change banner</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadBanner} />
          </label>
        </div>

        <div
          className="transition-shadow hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]"
          style={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '3px solid rgba(124,58,237,0.5)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            boxShadow: '0 0 20px rgba(124,58,237,0.3)',
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" fill sizes="80px" className="object-cover" />
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: 'white',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {username?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <label style={{ display: 'block', textAlign: 'center', marginTop: 48, color: '#a855f7', fontSize: 13, cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Change photo'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
        </label>
      </div>

      <div className="flex flex-col">
        <label style={labelStyle}>Username *</label>
        <input
          style={inputStyle}
          className="focus:border-[rgba(124,58,237,0.5)]"
          placeholder="e.g. tanmay_pathak"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label style={labelStyle}>Full name</label>
        <input
          style={inputStyle}
          className="focus:border-[rgba(124,58,237,0.5)]"
          placeholder="e.g. Tanmay Pathak"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label style={labelStyle}>Bio</label>
        <textarea
          style={inputStyle}
          className="focus:border-[rgba(124,58,237,0.5)] resize-none"
          placeholder="Tell people a bit about yourself..."
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

      <button
        onClick={saveProfile}
        disabled={saving}
        className="w-full rounded-xl text-white text-sm font-medium py-3 transition-all disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          boxShadow: '0 0 30px rgba(124,58,237,0.4)',
        }}
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>

      <a href="/chat" style={{ color: '#666', fontSize: 13, textAlign: 'center' }}>
        ← Back to chat
      </a>
    </div>
  )
}
