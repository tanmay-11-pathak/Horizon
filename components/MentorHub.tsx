'use client'
import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Mentor {
  slug: string
  name: string
  role: string
  emoji: string
  gradient: string
  color: string
  personality: string
  suggestions: string[]
}

const MENTORS: Mentor[] = [
  {
    slug: 'study-buddy', name: 'Study Buddy', role: 'Academic Assistant',
    emoji: '📚', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#7c3aed',
    personality: 'You are Study Buddy, a friendly and patient academic assistant. You help students understand concepts, create study plans, make quizzes, explain difficult topics simply, and motivate them to learn. You are encouraging, thorough, and always break down complex ideas into easy steps.',
    suggestions: ['Explain photosynthesis simply', 'Create a study plan for me', 'Quiz me on World War 2', 'Help me understand calculus']
  },
  {
    slug: 'career-coach', name: 'Career Coach', role: 'Professional Mentor',
    emoji: '💼', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b',
    personality: 'You are Career Coach, a strategic and honest professional mentor. You help with resume writing, interview preparation, career planning, job search strategies, and professional development. You give direct, actionable advice to help students and freshers land their dream jobs.',
    suggestions: ['Review my resume', 'Help me prep for interviews', 'What career suits me?', 'How to negotiate salary?']
  },
  {
    slug: 'wellness-guide', name: 'Wellness Guide', role: 'Mental Health Support',
    emoji: '🧠', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#06b6d4',
    personality: 'You are Wellness Guide, a compassionate and empathetic mental health companion. You provide emotional support, help with stress and anxiety management, offer mindfulness techniques, and encourage healthy habits. You are warm, non-judgmental, and always remind users to seek professional help for serious concerns.',
    suggestions: ['I am feeling stressed', 'Help me with anxiety', 'Tips for better sleep', 'How to stay motivated?']
  },
  {
    slug: 'code-mentor', name: 'Code Mentor', role: 'Programming Tutor',
    emoji: '💻', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#22c55e',
    personality: 'You are Code Mentor, a technical and hands-on programming tutor. You help users learn to code, debug problems, understand algorithms, and build real projects. You support all programming languages and always explain with examples and code snippets.',
    suggestions: ['Help me learn Python', 'Explain recursion', 'Debug my code', 'What is Big O notation?']
  },
  {
    slug: 'language-tutor', name: 'Language Tutor', role: 'Communication Coach',
    emoji: '🌍', gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#f43f5e',
    personality: 'You are Language Tutor, a fun and interactive communication coach. You help users improve their English, learn new languages, build vocabulary, fix grammar, and develop confident communication skills through conversation practice.',
    suggestions: ['Improve my English', 'Fix my grammar', 'Teach me Spanish basics', 'Help me sound more professional']
  },
  {
    slug: 'finance-advisor', name: 'Finance Advisor', role: 'Money & Investment Guide',
    emoji: '💰', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)', color: '#a855f7',
    personality: 'You are Finance Advisor, a practical and trustworthy money guide. You help students and young professionals understand personal finance, budgeting, saving, investing basics, and building wealth. You explain financial concepts clearly without jargon.',
    suggestions: ['How to budget as a student?', 'Explain mutual funds', 'How to start investing?', 'Tips to save money']
  }
]

interface Props {
  userId: string
}

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback((reset?: boolean) => {
    const textarea = textareaRef.current
    if (!textarea) return
    if (reset) { textarea.style.height = `${minHeight}px`; return }
    textarea.style.height = `${minHeight}px`
    const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity))
    textarea.style.height = `${newHeight}px`
  }, [minHeight, maxHeight])

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

export default function MentorHub({ userId }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeMentor, setActiveMentor] = useState<Mentor>(MENTORS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [bgPos, setBgPos] = useState({ x: 50, y: -20 })
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 })

  useEffect(() => {
    loadHistory(activeMentor.slug)
  }, [activeMentor.slug])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setBgPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 10 - 20 })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const loadHistory = async (slug: string) => {
    setLoadingHistory(true)
    setMessages([])
    const { data } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('user_id', userId)
      .eq('mentor_slug', slug)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as Message[])
    setLoadingHistory(false)
  }

  const switchMentor = (mentor: Mentor) => {
    setActiveMentor(mentor)
    setInput('')
  }

  const sendMessage = async (content?: string) => {
    const text = content || input.trim()
    if ((!text && !mediaFile) || loading || sendingRef.current) return
    sendingRef.current = true
    try {
      let mediaUrl: string | null = null
      if (mediaFile) {
        setUploadingMedia(true)
        const fileExt = mediaFile.name.split('.').pop()
        const filePath = `mentor-files/${userId}/${activeMentor.slug}/${Date.now()}.${fileExt}`
        const { error } = await supabase.storage.from('chat-media').upload(filePath, mediaFile)
        if (!error) {
          const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath)
          mediaUrl = data.publicUrl
        }
        setUploadingMedia(false)
      }

      const finalText = mediaUrl
        ? `${text || 'Please review this uploaded file.'}\n\nAttachment: ${mediaUrl}`
        : text

      const userMessage: Message = { role: 'user', content: finalText }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setInput('')
      if (mediaPreview) URL.revokeObjectURL(mediaPreview)
      setMediaPreview(null)
      setMediaFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setLoading(true)

      await supabase.from('ai_messages').insert({ user_id: userId, role: 'user', content: finalText, mentor_slug: activeMentor.slug })

      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, personality: activeMentor.personality })
      })
      const data = await res.json()
      const assistantMessage: Message = { role: 'assistant', content: data.reply }

      await supabase.from('ai_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: assistantMessage.content,
        mentor_slug: activeMentor.slug
      })

      setMessages(prev => [...prev, assistantMessage])
      setLoading(false)
    } finally {
      sendingRef.current = false
      setLoading(false)
      setUploadingMedia(false)
    }
  }

  const clearHistory = async () => {
    await supabase.from('ai_messages').delete().eq('user_id', userId).eq('mentor_slug', activeMentor.slug)
    setMessages([])
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#050505', color: '#f2f2f2', overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: 999,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />

      <aside style={{ width: sidebarOpen ? 280 : 56, background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 10, transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}>
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          style={{
            margin: '0 12px 12px',
            alignSelf: sidebarOpen ? 'flex-end' : 'center',
            width: 32,
            height: 32,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#8c8c8c',
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '←' : '→'}
        </button>
        {sidebarOpen && (
          <>
        <div style={{ padding: '0 24px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #2a2a2a, #121212)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5e6ad2', boxShadow: '0 0 10px rgba(94,106,210,0.15)' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.5 }}>HORIZON AI</div>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#525252', marginBottom: 8, padding: '0 24px' }}>Mentors</div>

        <ul style={{ listStyle: 'none', padding: '0 12px', margin: 0 }}>
          {MENTORS.map((mentor) => {
            const isActive = activeMentor.slug === mentor.slug
            return (
              <li
                key={mentor.slug}
                onClick={() => switchMentor(mentor)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 4,
                  cursor: 'pointer',
                  transition: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  border: isActive ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 0 20px rgba(255,255,255,0.01)' : 'none',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {isActive && <span style={{ position: 'absolute', left: -12, top: '15%', height: '70%', width: 2, background: '#5e6ad2', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px rgba(94,106,210,0.15)' }} />}
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)', marginRight: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', fontSize: 18 }}>
                  <span>{mentor.emoji}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#f2f2f2' }}>{mentor.name}</span>
                  <span style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{mentor.role}</span>
                </div>
              </li>
            )
          })}
        </ul>

        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <a href="/chat" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: '#8c8c8c', fontSize: 13, textDecoration: 'none' }}>Back to Chat</a>
          <a href="/communities" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: '#8c8c8c', fontSize: 13, textDecoration: 'none' }}>Communities</a>
        </div>
          </>
        )}
      </aside>

      <main
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: `radial-gradient(circle at ${bgPos.x}% ${bgPos.y}%, rgba(94,106,210,0.08) 0%, transparent 40%), #050505`
        }}
      >
        <header style={{ padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button onClick={clearHistory} style={{ fontSize: 12, color: '#525252', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 6 }}>Clear history</button>
        </header>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: messages.length ? 'flex-start' : 'center', paddingBottom: 220, overflowY: 'auto' }}>
          {loadingHistory ? (
            <div style={{ color: '#8c8c8c', paddingTop: 80 }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeIn 0.8s ease-out' }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #1a1a1a, #080808)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', fontSize: 28 }}>{activeMentor.emoji}</div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.2, marginBottom: 6 }}>{activeMentor.name}</h1>
              <p style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 16 }}>{activeMentor.role}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8c8c8c', background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} />
                Available
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 820, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '75%', background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 18px', lineHeight: 1.7, fontSize: 14 }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown components={{
                        p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                        li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                        ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: 18 }}>{children}</ul>,
                        code: ({ children }) => <code style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 6px' }}>{children}</code>,
                      }}>{msg.content}</ReactMarkdown>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 4 }}>
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 720, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {activeMentor.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); adjustHeight() }}
                style={{ background: 'rgba(18,18,18,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: 100, fontSize: 13, color: '#8c8c8c', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>

          {mediaPreview && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, maxWidth: 340 }}>
                {mediaFile?.type.startsWith('image/') ? (
                  <img src={mediaPreview} alt="preview" style={{ maxWidth: 320, maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{mediaFile?.name}</div>
                )}
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(18,18,18,0.7)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#8c8c8c', cursor: 'pointer' }}
            >
              +
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); adjustHeight() }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                  adjustHeight(true)
                }
              }}
              placeholder={`Message ${activeMentor.name}...`}
              style={{ flex: 1, background: 'none', border: 'none', color: '#f2f2f2', padding: '10px 12px', fontSize: 15, outline: 'none', resize: 'none', lineHeight: 1.5, minHeight: 46, maxHeight: 160, overflow: 'hidden' }}
            />
            <button
              onClick={() => { void sendMessage(); adjustHeight(true) }}
              disabled={loading || uploadingMedia || (!input.trim() && !mediaFile)}
              style={{ width: 36, height: 36, borderRadius: 12, background: 'none', border: 'none', color: (input.trim() || mediaFile) ? '#5e6ad2' : '#525252', cursor: (input.trim() || mediaFile) ? 'pointer' : 'not-allowed' }}
            >
              →
            </button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
