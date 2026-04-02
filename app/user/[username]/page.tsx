import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { userId } = await auth()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isOwn = userId === profile.id

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', profile.id)

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 50%, #0d0520 0%, #080808 50%, #000d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%', width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px', pointerEvents: 'none'
      }} />

      {/* Profile card */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(124,58,237,0.1), 0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Banner */}
        <div style={{
          width: '100%', height: 140,
          background: profile.banner_url ? 'none' : 'linear-gradient(135deg, #1a0533, #0d1a3a)',
          position: 'relative', overflow: 'hidden'
        }}>
          {profile.banner_url && (
            <img src={profile.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)'
          }} />
        </div>

        {/* Avatar overlapping banner */}
        <div style={{ position: 'relative', padding: '0 32px' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            border: '4px solid #080808',
            overflow: 'hidden', background: 'rgba(124,58,237,0.2)',
            marginTop: -45, boxShadow: '0 0 25px rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>
                {profile.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div style={{ padding: '16px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>
              {profile.full_name || profile.username}
            </h1>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: profile.is_online ? '#22c55e' : '#555',
              boxShadow: profile.is_online ? '0 0 8px #22c55e' : 'none',
              display: 'inline-block'
            }} />
          </div>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 16px' }}>@{profile.username}</p>

          {profile.bio && (
            <p style={{
              color: '#ccc', fontSize: 14, lineHeight: 1.6,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, marginBottom: 20
            }}>{profile.bio}</p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{
              flex: 1, padding: '12px 16px', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12
            }}>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>{messageCount || 0}</p>
              <p style={{ color: '#666', fontSize: 12, margin: '4px 0 0' }}>Messages</p>
            </div>
            <div style={{
              flex: 1, padding: '12px 16px', textAlign: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12
            }}>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>
                {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <p style={{ color: '#666', fontSize: 12, margin: '4px 0 0' }}>Joined</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {isOwn ? (
              <a href="/profile" style={{
                flex: 1, padding: '12px', textAlign: 'center',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                color: 'white', borderRadius: 12, fontSize: 14,
                fontWeight: 600, textDecoration: 'none'
              }}>Edit Profile</a>
            ) : (
              <a href="/chat" style={{
                flex: 1, padding: '12px', textAlign: 'center',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                color: 'white', borderRadius: 12, fontSize: 14,
                fontWeight: 600, textDecoration: 'none'
              }}>Message</a>
            )}
            <a href="/chat" style={{
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#888', borderRadius: 12, fontSize: 14, textDecoration: 'none'
            }}>← Back</a>
          </div>
        </div>
      </div>
    </main>
  )
}
