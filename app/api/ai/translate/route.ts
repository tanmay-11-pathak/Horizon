import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

export async function POST(req: NextRequest) {
  const { text, targetLanguage } = await req.json()
  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content: `You are a translator. Translate the given text to ${targetLanguage}. Return ONLY the translated text, nothing else, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ]
  })
  const translated = result.choices?.[0]?.message?.content || text
  return NextResponse.json({ translated })
}
