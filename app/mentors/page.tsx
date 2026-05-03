import { auth } from '@clerk/nextjs/server'

export default async function MentorsPage() {
  const { userId } = await auth()

  const mentors = [
    {
      name: 'Study Buddy',
      role: 'Academic Assistant',
      desc: 'Explains concepts, helps with homework, creates study plans and quizzes. Perfect for exam prep.',
      emoji: '📚',
      gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      traits: ['Patient', 'Thorough', 'Encouraging'],
      slug: 'study-buddy'
    },
    {
      name: 'Career Coach',
      role: 'Professional Mentor',
      desc: 'Resume reviews, interview prep, career advice and job search strategies for students and freshers.',
      emoji: '💼',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      traits: ['Strategic', 'Honest', 'Motivating'],
      slug: 'career-coach'
    },
    {
      name: 'Wellness Guide',
      role: 'Mental Health Support',
      desc: 'A compassionate companion for stress, anxiety, and personal growth. Always here to listen.',
      emoji: '🧠',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      traits: ['Empathetic', 'Calm', 'Supportive'],
      slug: 'wellness-guide'
    },
    {
      name: 'Code Mentor',
      role: 'Programming Tutor',
      desc: 'Helps you learn to code, debug problems and build real projects. Supports all languages.',
      emoji: '💻',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
      traits: ['Technical', 'Clear', 'Hands-on'],
      slug: 'code-mentor'
    },
    {
      name: 'Language Tutor',
      role: 'Communication Coach',
      desc: 'Improve your English, learn new languages and build confident communication skills.',
      emoji: '🌍',
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      traits: ['Patient', 'Interactive', 'Fun'],
      slug: 'language-tutor'
    },
    {
      name: 'Finance Advisor',
      role: 'Money & Investment Guide',
      desc: 'Learn about personal finance, budgeting, investing and building wealth as a student.',
      emoji: '💰',
      gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
      traits: ['Practical', 'Clear', 'Trustworthy'],
      slug: 'finance-advisor'
    },
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
          <a href="/communities" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>Communities</a>
          <a href="/mentors" style={{ color: 'white', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>AI Mentors</a>
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
          background: 'rgba(236,72,153,0.15)',
          border: '1px solid rgba(236,72,153,0.3)',
          borderRadius: 100, padding: '4px 14px', marginBottom: 24
        }}>
          <span style={{ color: '#f9a8d4', fontSize: 12 }}>✦ AI Mentors</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700,
          letterSpacing: '-1.5px', margin: '0 0 16px',
          background: 'linear-gradient(135deg, #ffffff, #f9a8d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Your personal AI companions</h1>
        <p style={{ color: '#888', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Specialized AI mentors designed to help you grow — pick one and start a conversation right now.
        </p>
      </div>

      {/* Mentors grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 48px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 24
      }}>
        <style>{`
          .mentor-card:hover {
            background: rgba(255,255,255,0.06) !important;
            transform: translateY(-6px) !important;
            box-shadow: 0 24px 48px rgba(0,0,0,0.4) !important;
          }
        `}</style>
        {mentors.map(mentor => (
          <a key={mentor.slug} href={userId ? `/mentors/${mentor.slug}` : `/sign-up`} style={{ textDecoration: 'none' }}>
            <div className="mentor-card" style={{
              padding: 32,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 24, cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: mentor.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>{mentor.emoji}</div>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{mentor.name}</p>
              <p style={{ color: '#666', fontSize: 12, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{mentor.role}</p>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>{mentor.desc}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {mentor.traits.map(t => (
                  <span key={t} style={{
                    padding: '4px 10px', fontSize: 11,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, color: '#888'
                  }}>{t}</span>
                ))}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px',
                background: mentor.gradient,
                borderRadius: 12, color: 'white',
                fontSize: 14, fontWeight: 600
              }}>Chat with {mentor.name} →</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
