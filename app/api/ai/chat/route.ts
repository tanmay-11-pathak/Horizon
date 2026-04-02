import { mistral } from '@/lib/mistral'
import { NextRequest, NextResponse } from 'next/server'

function readContent(content: unknown) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text
        }
        return ''
      })
      .join(' ')
      .trim()
  }
  return ''
}

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant inside a chat application called Horizon. Answer clearly and concisely.'
      },
      { role: 'user', content: message }
    ]
  })
  const reply = readContent(result.choices?.[0]?.message?.content) || 'Sorry, I could not respond.'
  return NextResponse.json({ reply })
}
