'use client'

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, #1a0533 0%, #0a0a0a 50%, #000d1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 10s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '50%', right: '20%',
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 12s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 700 }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 100, padding: '6px 16px',
          marginBottom: 32, backdropFilter: 'blur(10px)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block', boxShadow: '0 0 6px #a855f7' }} />
          <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 500 }}>Real-time AI-powered chat</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 700,
          letterSpacing: '-2px',
          lineHeight: 1.05,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Horizon
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: '#888',
          marginBottom: 48,
          lineHeight: 1.6,
          maxWidth: 500,
          margin: '0 auto 48px'
        }}>
          A next-generation chat platform with real-time messaging,
          AI assistance, and a beautiful interface.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/sign-up" style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: 'white',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            Get started free
          </a>
          <a href="/sign-in" style={{
            padding: '14px 32px',
            background: 'rgba(255,255,255,0.05)',
            color: '#ccc',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}>
            Sign in
          </a>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {['Real-time messaging', 'AI summarization', 'Private chats', 'Online presence'].map(f => (
            <span key={f} style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 100,
              fontSize: 12,
              color: '#666',
              backdropFilter: 'blur(10px)'
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        main > div:last-child { animation: fadeUp 0.8s ease forwards; }
      `}</style>
    </main>
  )
}
