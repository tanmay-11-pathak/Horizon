'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  userId: string
}

export default function HorizonAI({ userId }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data as AIMessage[])
      }
      setLoadingHistory(false)
    }

    void loadHistory()
  }, [userId])

  const clearHistory = async () => {
    await supabase.from('ai_messages').delete().eq('user_id', userId)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: AIMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    await supabase.from('ai_messages').insert({
      user_id: userId,
      role: 'user',
      content: userMessage.content
    })

    const res = await fetch('/api/ai/horizon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages })
    })
    const data = await res.json()
    const assistantMessage: AIMessage = { role: 'assistant', content: data.reply }

    await supabase.from('ai_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: assistantMessage.content
    })

    setMessages((prev) => [...prev, assistantMessage])
    setLoading(false)
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #0d0520 0%, #080808 60%, #000d1a 100%)'
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{
          background: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(124,58,237,0.5)'
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>✦</span>
        </div>
        <div>
          <p style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>Horizon AI</p>
          <p style={{ color: '#22c55e', fontSize: 12, margin: 0 }}>Always online</p>
        </div>
        <button
          onClick={clearHistory}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#666',
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          Clear history
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {loadingHistory ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: '#555', fontSize: 14 }}>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
              paddingTop: 80
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(124,58,237,0.4)'
              }}
            >
              <span style={{ color: 'white', fontSize: 32 }}>✦</span>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>Horizon AI</p>
            <p style={{ color: '#555', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 300 }}>
              Ask me anything — I can help with questions, writing, coding, math, or just chat.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {['What can you do?', 'Write me a poem', 'Explain recursion', 'Tell me a joke'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 20,
                    color: '#c4b5fd',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!loadingHistory && messages.map((msg, i) => (
          <div key={i} className={`flex message-bubble ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  alignSelf: 'flex-end',
                  boxShadow: '0 0 10px rgba(124,58,237,0.4)'
                }}
              >
                <span style={{ color: 'white', fontSize: 10 }}>✦</span>
              </div>
            )}
            <div
              style={{
                maxWidth: '70%',
                padding: '10px 14px',
                borderRadius: 16,
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                ...(msg.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      boxShadow: '0 0 15px rgba(124,58,237,0.3)',
                      color: 'white',
                      borderBottomRightRadius: 4
                    }
                  : {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      borderBottomLeftRadius: 4
                    })
              }}
            >
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
                >
                  {msg.content as string}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && !loadingHistory && (
          <div className="flex justify-start">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                alignSelf: 'flex-end'
              }}
            >
              <span style={{ color: 'white', fontSize: 10 }}>✦</span>
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                gap: 4,
                alignItems: 'center'
              }}
            >
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="px-6 py-4"
        style={{
          background: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-[#666]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
            placeholder="Message Horizon AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-white text-sm disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
