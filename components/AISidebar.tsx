'use client'
import { useState } from 'react'

interface Message {
  id: string
  content: string
  sender_id: string
}

interface Props {
  messages: Message[]
  onOpenChange?: (open: boolean) => void
}

export default function AISidebar({ messages, onOpenChange }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [summary, setSummary] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const askAI = async () => {
    if (!input.trim()) return
    setLoadingChat(true)
    setReply('')
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    })
    const data = await res.json()
    setReply(data.reply)
    setInput('')
    setLoadingChat(false)
  }

  const summarize = async () => {
    setLoadingSummary(true)
    setSummary('')
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    })
    const data = await res.json()
    setSummary(data.summary)
    setLoadingSummary(false)
  }

  return (
    <>
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          onOpenChange?.(next)
        }}
        className="px-4 py-2 text-[12px] font-medium transition-colors uppercase tracking-wide"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          background: '#222222',
          border: '1px solid #7c3aed',
          color: '#7c3aed',
          boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
        }}
      >
        {open ? 'Close AI' : 'AI Assistant'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 16,
            width: 320,
            background: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: 0,
            padding: 20,
            zIndex: 99999,
            pointerEvents: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            color: '#e5e5e5',
          }}
        >
          <h2 className="font-semibold text-sm">AI Assistant</h2>

          <div>
            <button
              onClick={summarize}
              disabled={loadingSummary}
              className="w-full px-3 py-2 rounded-xl text-sm transition-colors"
              style={{ background: '#222222', border: '1px solid #2a2a2a' }}
            >
              {loadingSummary ? 'Summarizing...' : 'Summarize this chat'}
            </button>
            {summary && (
              <p className="mt-2 text-sm text-[#71717a] bg-[#222222] p-3">
                {summary}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              className="border px-3 py-2 text-sm outline-none text-[#e5e5e5]"
              placeholder="Ask AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              style={{
                borderColor: '#2a2a2a',
                background: '#0d0d0d',
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'auto',
              }}
            />
            <button
              onClick={askAI}
              disabled={loadingChat}
              className="px-3 py-2 text-sm transition-colors text-white"
              style={{
                background: '#7c3aed',
                border: 'none',
              }}
            >
              {loadingChat ? 'Thinking...' : 'Ask'}
            </button>
            {reply && (
              <p className="text-sm text-[#71717a] bg-[#222222] p-3">
                {reply}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
