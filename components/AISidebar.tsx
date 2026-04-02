'use client'
import { useState } from 'react'

interface Message {
  id: string
  content: string
  sender_id: string
}

interface Props {
  messages: Message[]
}

export default function AISidebar({ messages }: Props) {
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
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors"
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
            background: 'rgba(15,15,15,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 16,
            padding: 20,
            zIndex: 99999,
            pointerEvents: 'auto',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            color: 'white',
          }}
        >
          <h2 className="font-semibold text-sm">AI Assistant</h2>

          <div>
            <button
              onClick={summarize}
              disabled={loadingSummary}
              className="w-full px-3 py-2 bg-[#1e1e1e] rounded-xl text-sm hover:bg-[#252525] transition-colors"
            >
              {loadingSummary ? 'Summarizing...' : 'Summarize this chat'}
            </button>
            {summary && (
              <p className="mt-2 text-sm text-[#ccc] bg-[#1a1a1a] p-3 rounded-xl">
                {summary}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              className="border border-[#333] bg-[#1e1e1e] text-white rounded-xl px-3 py-2 text-sm outline-none"
              placeholder="Ask AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}
            />
            <button
              onClick={askAI}
              disabled={loadingChat}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm transition-colors"
            >
              {loadingChat ? 'Thinking...' : 'Ask'}
            </button>
            {reply && (
              <p className="text-sm text-[#ccc] bg-[#1a1a1a] p-3 rounded-xl">
                {reply}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
