import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function POST(req: NextRequest) {
  const { messages, personality } = await req.json()
  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content: `${personality} Today's date is ${new Date().toDateString()}. Keep responses concise, warm and helpful. Use formatting like bullet points when helpful.`
      },
      ...messages
    ]
  })
  const reply = result.choices?.[0]?.message?.content || 'Sorry I could not respond.'
  return NextResponse.json({ reply })
}
