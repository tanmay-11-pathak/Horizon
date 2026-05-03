'use client'
import { useEffect, useRef, useState } from 'react'

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width: number, height: number
    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = []
    let animId: number

    const init = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      particles = []
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(124, 58, 237, 0.4)'
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)'

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 140) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.globalAlpha = (1 - dist / 140) * 0.5
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      })
      animId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', init)
    init()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <main style={{
      background: '#050505',
      color: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden',
      minHeight: '100vh'
    }}>
      {/* Noise texture overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.03
      }}/>

      {/* Canvas background */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%', zIndex: 0, opacity: 0.5
      }}/>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%',
        padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 100,
        background: scrollY > 50 ? 'rgba(5,5,5,0.9)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          fontFamily: 'monospace', fontWeight: 800,
          fontSize: '1.4rem', letterSpacing: '-0.05em', textTransform: 'uppercase'
        }}>HORIZON</div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[['Chat', '/chat'], ['Communities', '/communities'], ['AI Mentors', '/mentors']].map(([label, href]) => (
            <a key={label} href={href} style={{
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              fontFamily: 'monospace', fontSize: '0.75rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >{label}</a>
          ))}
          <a href="/sign-in" style={{
            color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            fontFamily: 'monospace', fontSize: '0.75rem',
            letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>Sign in</a>
          <a href="/sign-up" style={{
            padding: '0.6rem 1.4rem',
            background: 'white', color: 'black',
            textDecoration: 'none', fontFamily: 'monospace',
            fontWeight: 700, fontSize: '0.7rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0% 100%)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7c3aed'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = 'black'
            e.currentTarget.style.boxShadow = 'none'
          }}
          >Get Access</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 10%', position: 'relative', zIndex: 1
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)', marginBottom: '2rem',
          textTransform: 'uppercase', letterSpacing: '0.4em'
        }}>Chat · Communities · AI Mentors</div>

        <h1 style={{
          fontSize: 'clamp(3.5rem, 10vw, 9rem)',
          fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 0.9, marginBottom: '2rem',
          background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.35) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>HORIZON</h1>

        <p style={{
          color: 'rgba(255,255,255,0.4)', fontSize: '1rem',
          maxWidth: 500, lineHeight: 1.7, marginBottom: '3rem',
          fontFamily: 'monospace'
        }}>
          Real-time messaging. Vibrant communities. AI-powered mentors.<br/>
          All in one platform built for the next generation.
        </p>

        {/* Three feature buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
          {[
            { label: 'Start Chatting', sub: 'Real-time messaging', href: '/chat', icon: '💬' },
            { label: 'Communities', sub: 'Find your people', href: '/communities', icon: '🌐' },
            { label: 'AI Mentors', sub: 'Your AI companions', href: '/mentors', icon: '✦' },
          ].map(btn => (
            <a key={btn.label} href={btn.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              padding: '1.5rem 2rem', minWidth: 160,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              textDecoration: 'none', color: 'white',
              transition: 'all 0.3s', backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.15)'
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.2)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <span style={{ fontSize: '1.8rem' }}>{btn.icon}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{btn.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{btn.sub}</span>
            </a>
          ))}
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Smart replies', 'Message translation', 'Media sharing', 'Group chats', 'AI summarization', 'Typing indicators'].map(f => (
            <span key={f} style={{
              padding: '4px 12px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'monospace', fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>{f}</span>
          ))}
        </div>

        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'monospace', fontSize: '0.6rem',
          textTransform: 'uppercase', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.3)',
          animation: 'bounce 2s infinite'
        }}>↓ Scroll to explore</div>
      </section>

      {/* Three pillars section */}
      <section style={{
        padding: '8rem 10%', position: 'relative', zIndex: 1
      }}>
        <div style={{ marginBottom: '4rem' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
            letterSpacing: '0.4em', marginBottom: '1rem'
          }}>Functionality</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>The Three Pillars.</h2>
          <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)', marginTop: '1.5rem' }}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            {
              num: '001', title: 'Direct Messaging',
              desc: 'Private 1-on-1 and group chats with smart AI replies, real-time translation, media sharing, typing indicators and read receipts.',
              label: 'Status: Active', href: '/chat',
              glowColor: 'rgba(124,58,237,0.5)'
            },
            {
              num: '002', title: 'Collective Spaces',
              desc: 'Sovereign community environments for Gaming, Study Groups, Internships, Sports, Tech and more. Discord-style real-time channels.',
              label: 'Node: Distributed', href: '/communities',
              glowColor: 'rgba(6,182,212,0.5)'
            },
            {
              num: '003', title: 'AI Mentors',
              desc: 'Specialized AI companions — Study Buddy, Career Coach, Wellness Guide, Code Mentor, Language Tutor and Finance Advisor.',
              label: 'Neural: Synced', href: '/mentors',
              glowColor: 'rgba(236,72,153,0.5)'
            },
          ].map(card => (
            <a key={card.num} href={card.href} style={{ textDecoration: 'none', color: 'white' }}>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '3rem 2rem', position: 'relative',
                overflow: 'hidden', transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
                backdropFilter: 'blur(10px)', height: '100%'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.3)'
                el.style.transform = 'translateY(-10px)'
                el.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.transform = 'translateY(0)'
                el.style.background = 'rgba(255,255,255,0.02)'
              }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>{card.num}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem' }}>{card.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '2rem' }}>{card.desc}</p>
                <div style={{
                  display: 'inline-block', fontFamily: 'monospace',
                  fontSize: '0.65rem', padding: '4px 8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'rgba(255,255,255,0.4)'
                }}>{card.label} →</div>
                <div style={{
                  position: 'absolute', bottom: -50, right: -50,
                  width: 100, height: 100,
                  background: card.glowColor, filter: 'blur(60px)', opacity: 0,
                  transition: 'opacity 0.5s'
                }} className="card-glow"/>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        padding: '8rem 10%', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          letterSpacing: '0.4em', marginBottom: '1.5rem'
        }}>Expansion</div>
        <h2 style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800,
          letterSpacing: '-0.04em', marginBottom: '1.5rem'
        }}>Beyond the Screen.</h2>
        <p style={{
          color: 'rgba(255,255,255,0.4)', maxWidth: 600,
          margin: '0 auto 3rem', lineHeight: 1.7, fontFamily: 'monospace', fontSize: '0.875rem'
        }}>
          Horizon is more than an app. It is an operating layer for human potential — combining the warmth of community with the precision of artificial intelligence.
        </p>
        <a href="/sign-up" style={{
          display: 'inline-block', padding: '1.25rem 3rem',
          background: 'white', color: 'black',
          textDecoration: 'none', fontFamily: 'monospace',
          fontWeight: 700, fontSize: '0.8rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#7c3aed'
          e.currentTarget.style.color = 'white'
          e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.color = 'black'
          e.currentTarget.style.boxShadow = 'none'
        }}
        >Initialize Connection</a>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem 10%',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'monospace', fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 1
      }}>
        <div>© 2026 HORIZON TECHNOLOGIES</div>
        <div>REAL-TIME · AI-POWERED · OPEN</div>
        <div>STAY SHARP.</div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translate(-50%, 0); }
          40% { transform: translate(-50%, -10px); }
          60% { transform: translate(-50%, -5px); }
        }
      `}</style>
    </main>
  )
}
