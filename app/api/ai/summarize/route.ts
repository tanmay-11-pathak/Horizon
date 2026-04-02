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
  const { messages } = await req.json()
  if (!messages || messages.length === 0) {
    return NextResponse.json({ summary: 'No messages to summarize.' })
  }

  const transcript = messages.map((m: any) => `${m.sender_id}: ${m.content}`).join('\n')

  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that summarizes chat conversations concisely in 2-3 sentences.'
      },
      { role: 'user', content: `Summarize this conversation:\n\n${transcript}` }
    ]
  })

  const summary = readContent(result.choices?.[0]?.message?.content) || 'Could not generate summary.'
  return NextResponse.json({ summary })
}
