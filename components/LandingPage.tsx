'use client'

import { WebGLShader } from './WebGLShader'
import { LiquidButton } from './ui/liquid-glass-button'

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <WebGLShader />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 700 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 100,
            padding: '6px 16px',
            marginBottom: 32,
            backdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#a855f7',
              display: 'inline-block',
              boxShadow: '0 0 6px #a855f7',
            }}
          />
          <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 500 }}>Real-time AI-powered chat</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(48px, 8vw, 96px)',
            fontWeight: 700,
            letterSpacing: '-2px',
            lineHeight: 1.05,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Horizon
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#888',
            lineHeight: 1.6,
            maxWidth: 500,
            margin: '0 auto 48px',
          }}
        >
          A next-generation chat platform with real-time messaging,
          AI assistance, and a beautiful interface.
        </p>

        {isLoggedIn ? (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/chat">
              <LiquidButton size="xl" className="text-white border border-white/20 rounded-full px-8">
                Start chatting
              </LiquidButton>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/sign-up">
              <LiquidButton size="xl" className="text-white border border-white/20 rounded-full px-8">
                Get started free
              </LiquidButton>
            </a>
            <a href="/sign-in">
              <LiquidButton size="xl" className="text-white/70 border border-white/10 rounded-full px-8">
                Sign in
              </LiquidButton>
            </a>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {['Real-time messaging', 'AI summarization', 'Private chats', 'Online presence'].map((feature) => (
            <span
              key={feature}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100,
                fontSize: 12,
                color: '#666',
                backdropFilter: 'blur(10px)',
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
