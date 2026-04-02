import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content: `You are Horizon AI, a smart and friendly AI assistant built into Horizon — a real-time chat application. You are helpful, concise, and conversational. Today's date is ${new Date().toDateString()}. You can help users with anything — answering questions, summarizing text, writing, coding, math, or just chatting.`
      },
      ...messages
    ]
  })
  const reply = result.choices?.[0]?.message?.content || 'Sorry, I could not respond.'
  return NextResponse.json({ reply })
}
