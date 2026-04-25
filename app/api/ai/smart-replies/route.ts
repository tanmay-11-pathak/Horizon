import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function POST(req: NextRequest) {
  const { lastMessage } = await req.json()
  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content: 'You are a smart reply generator for a chat app. Given the last message in a conversation, generate exactly 3 short, natural, conversational reply suggestions. Each reply should be under 8 words. Return ONLY a JSON array of 3 strings, nothing else. Example: ["Sounds great!", "Tell me more", "I\\\'ll think about it"]'
      },
      {
        role: 'user',
        content: `Generate 3 smart reply suggestions for this message: "${lastMessage}"`
      }
    ]
  })
  const text = result.choices?.[0]?.message?.content || '[]'
  try {
    const clean = text.toString().replace(/```json|```/g, '').trim()
    const replies = JSON.parse(clean)
    return NextResponse.json({ replies })
  } catch {
    return NextResponse.json({ replies: ['👍', 'Got it!', 'Thanks!'] })
  }
}
