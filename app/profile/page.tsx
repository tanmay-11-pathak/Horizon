import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 50%, #0d0520 0%, #080808 50%, #000d1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 40,
        boxShadow: '0 0 60px rgba(124,58,237,0.1), 0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 100, padding: '4px 14px', marginBottom: 16
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block', boxShadow: '0 0 6px #a855f7' }} />
            <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 500 }}>Your profile</span>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', margin: 0
          }}>Edit Profile</h1>
        </div>
        <ProfileForm
          userId={userId}
          initialProfile={profile}
          clerkEmail={user?.emailAddresses[0]?.emailAddress || ''}
          clerkAvatar={user?.imageUrl || ''}
        />
      </div>
    </main>
  )
}
