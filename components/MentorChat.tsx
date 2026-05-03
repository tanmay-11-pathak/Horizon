'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Mentor {
  name: string
  role: string
  emoji: string
  gradient: string
  personality: string
  slug: string
}

interface Props {
  mentor: Mentor
  userId: string
}

export default function MentorChat({ mentor, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('user_id', userId)
        .eq('mentor_slug', mentor.slug)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as Message[])
      setLoadingHistory(false)
    }
    loadHistory()
  }, [userId, mentor.slug])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    await supabase.from('ai_messages').insert({
      user_id: userId,
      role: 'user',
      content: userMessage.content,
      mentor_slug: mentor.slug
    })

    const res = await fetch('/api/ai/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages, personality: mentor.personality })
    })
    const data = await res.json()
    const assistantMessage: Message = { role: 'assistant', content: data.reply }

    await supabase.from('ai_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: assistantMessage.content,
      mentor_slug: mentor.slug
    })

    setMessages(prev => [...prev, assistantMessage])
    setLoading(false)
  }

  const clearHistory = async () => {
    await supabase.from('ai_messages')
      .delete()
      .eq('user_id', userId)
      .eq('mentor_slug', mentor.slug)
    setMessages([])
  }

  return (
    <main style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#080808', fontFamily: 'Inter, -apple-system, sans-serif', color: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)'
      }}>
        <a href="/mentors" style={{ color: '#666', fontSize: 14, textDecoration: 'none' }}>← Back</a>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: mentor.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 0 20px rgba(124,58,237,0.3)'
        }}>{mentor.emoji}</div>
        <div>
          <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{mentor.name}</p>
          <p style={{ color: '#22c55e', fontSize: 12, margin: 0 }}>● Always available</p>
        </div>
        <button onClick={clearHistory} style={{
          marginLeft: 'auto', padding: '6px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#666', fontSize: 12, cursor: 'pointer'
        }}>Clear history</button>
        <a href="/chat" style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          borderRadius: 10, color: 'white', fontSize: 13,
          textDecoration: 'none', fontWeight: 600
        }}>Open chat</a>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {loadingHistory ? (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 60 }}>Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, paddingTop: 60 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: mentor.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, boxShadow: '0 0 40px rgba(124,58,237,0.3)'
            }}>{mentor.emoji}</div>
            <p style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>Chat with {mentor.name}</p>
            <p style={{ color: '#555', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 340 }}>
              Your {mentor.role}. Ask me anything — I'm here to help!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {mentor.slug === 'study-buddy' && ['Explain photosynthesis', 'Help me study for exams', 'Make me a quiz on history'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  padding: '8px 14px', background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 20, color: '#c4b5fd', fontSize: 13, cursor: 'pointer'
                }}>{s}</button>
              ))}
              {mentor.slug === 'career-coach' && ['Review my resume', 'Help me prep for interview', 'What career suits me?'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  padding: '8px 14px', background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 20, color: '#fcd34d', fontSize: 13, cursor: 'pointer'
                }}>{s}</button>
              ))}
              {mentor.slug === 'code-mentor' && ['Help me learn Python', 'Debug my code', 'Explain recursion'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  padding: '8px 14px', background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 20, color: '#86efac', fontSize: 13, cursor: 'pointer'
                }}>{s}</button>
              ))}
              {['Tell me about yourself', 'How can you help me?'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  padding: '8px 14px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, color: '#aaa', fontSize: 13, cursor: 'pointer'
                }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {messages.map((msg, i) => (
              <div key={i} className="message-bubble" style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16, gap: 12, alignItems: 'flex-end'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: mentor.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                  }}>{mentor.emoji}</div>
                )}
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.6,
                  whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                  ...(msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                    color: 'white', borderBottomRightRadius: 4
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white', borderBottomLeftRadius: 4
                  })
                }}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p style={{ margin: '0 0 8px 0', lineHeight: 1.7 }}>{children}</p>,
                        h3: ({children}) => <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '12px 0 6px' }}>{children}</h3>,
                        ul: ({children}) => <ul style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ul>,
                        li: ({children}) => <li style={{ marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>{children}</li>,
                        strong: ({children}) => <strong style={{ color: 'white', fontWeight: 700 }}>{children}</strong>,
                        table: ({children}) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: 13 }}>{children}</table>,
                        th: ({children}) => <th style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{children}</th>,
                        td: ({children}) => <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{children}</td>,
                        code: ({children}) => <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>{children}</code>,
                        hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />,
                      }}
                    >{msg.content as string}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: mentor.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                }}>{mentor.emoji}</div>
                <div style={{
                  padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: 4, alignItems: 'center'
                }}>
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }}/>
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }}/>
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }}/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 12 }}>
          <input
            className="flex-1"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 16px',
              color: 'white', fontSize: 14, outline: 'none',
              fontFamily: 'Inter, sans-serif'
            }}
            placeholder={`Message ${mentor.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none',
              background: mentor.gradient,
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >{loading ? '...' : 'Send'}</button>
        </div>
      </div>
    </main>
  )
}
