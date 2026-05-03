import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

export default async function CommunitiesPage() {
  const { userId } = await auth()

  const communities = [
    { name: 'Internships & Jobs', emoji: '💼', members: '12.4k', color: '#f59e0b', desc: 'Find internships, share opportunities and grow your career.', slug: 'internships' },
    { name: 'Study Groups', emoji: '📚', members: '8.2k', color: '#7c3aed', desc: 'Find study partners, share notes and ace your exams together.', slug: 'study' },
    { name: 'Gaming', emoji: '🎮', members: '24.1k', color: '#06b6d4', desc: 'Gaming discussions, team finding and tournament announcements.', slug: 'gaming' },
    { name: 'Sports & Fitness', emoji: '⚽', members: '6.8k', color: '#22c55e', desc: 'Sports talk, fitness tips and finding workout partners.', slug: 'sports' },
    { name: 'Tech & Coding', emoji: '💻', members: '15.3k', color: '#f43f5e', desc: 'Programming help, project collabs and tech news.', slug: 'tech' },
    { name: 'Music & Arts', emoji: '🎵', members: '9.7k', color: '#a855f7', desc: 'Share your work, find collaborators and discuss creativity.', slug: 'music' },
    { name: 'Entrepreneurship', emoji: '🚀', members: '5.1k', color: '#f97316', desc: 'Startup ideas, founder stories and business advice.', slug: 'entrepreneurship' },
    { name: 'Mental Health', emoji: '🧠', members: '7.3k', color: '#ec4899', desc: 'A safe space to talk, share and support each other.', slug: 'mental-health' },
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: '#080808',
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: 'white'
    }}>
      {/* Navbar */}
      <nav style={{
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <a href="/" style={{
          background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', textDecoration: 'none'
        }}>Horizon</a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/chat" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>Chat</a>
          <a href="/communities" style={{ color: 'white', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>Communities</a>
          <a href="/mentors" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>AI Mentors</a>
          {userId ? (
            <a href="/chat" style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: 10, color: 'white',
              fontSize: 14, textDecoration: 'none', fontWeight: 600
            }}>Open app</a>
          ) : (
            <a href="/sign-up" style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: 10, color: 'white',
              fontSize: 14, textDecoration: 'none', fontWeight: 600
            }}>Get started</a>
          )}
        </div>
      </nav>

      {/* Header */}
      <div style={{ padding: '80px 48px 40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(6,182,212,0.15)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 100, padding: '4px 14px', marginBottom: 24
        }}>
          <span style={{ color: '#67e8f9', fontSize: 12 }}>🌐 Communities</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700,
          letterSpacing: '-1.5px', margin: '0 0 16px',
          background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Find your people</h1>
        <p style={{ color: '#888', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Join communities built around your interests and connect with people who share your passion.
        </p>
      </div>

      {/* Community grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 48px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20
      }}>
        <style>{`
          .community-card:hover {
            background: rgba(255,255,255,0.06) !important;
            transform: translateY(-4px) !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
          }
        `}</style>
        {communities.map(c => (
          <a key={c.slug} href={`/communities/${c.slug}`} style={{ textDecoration: 'none' }}>
            <div className="community-card" style={{
              padding: 28,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              overflow: 'hidden', height: '100%'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{c.emoji}</div>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{c.name}</p>
              <p style={{ color: '#555', fontSize: 12, margin: '0 0 12px' }}>{c.members} members</p>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>{c.desc}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#ccc', fontSize: 13
              }}>Join community →</div>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                background: c.color, opacity: 0.7
              }}/>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
