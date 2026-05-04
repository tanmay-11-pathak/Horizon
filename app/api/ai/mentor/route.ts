import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

function getAttachmentUrlFromMessage(content: string): string | null {
  const match = content.match(/Attachment:\s*(https?:\/\/\S+)/i)
  return match?.[1] ?? null
}

async function tryExtractPdfTextFromUrl(url: string): Promise<string | null> {
  try {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) return null

    const res = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', document_url: url },
      }),
    })
    if (!res.ok) return null

    const result = await res.json()

    const pages = result?.pages || []
    const combined = pages
      .map((p: any) => p?.markdown || p?.text || '')
      .filter(Boolean)
      .join('\n\n')
      .trim()

    return combined ? combined.slice(0, 12000) : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { messages, personality } = await req.json()

  let attachmentContext = ''
  const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')
  const userContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : ''
  const attachmentUrl = getAttachmentUrlFromMessage(userContent)

  if (attachmentUrl && /\.pdf(\?|$)/i.test(attachmentUrl)) {
    const extracted = await tryExtractPdfTextFromUrl(attachmentUrl)
    if (extracted) {
      attachmentContext =
        `\n\nThe user attached a PDF. OCR extracted content is below:\n` +
        `---\n${extracted}\n---\nUse this extracted text to answer precisely.`
    } else {
      attachmentContext =
        '\n\nThe user attached a PDF URL, but the file text could not be extracted. ' +
        'Ask the user to share key pages/text for accurate help.'
    }
  }

  const result = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      {
        role: 'system',
        content:
          `${personality} Today's date is ${new Date().toDateString()}. ` +
          `Keep responses concise, warm and helpful. Use formatting like bullet points when helpful.` +
          attachmentContext
      },
      ...messages
    ]
  })
  const reply = result.choices?.[0]?.message?.content || 'Sorry I could not respond.'
  return NextResponse.json({ reply })
}
