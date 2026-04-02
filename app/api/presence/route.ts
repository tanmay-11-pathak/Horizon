import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, is_online } = await req.json()
  await supabase
    .from('profiles')
    .update({ is_online, last_seen: new Date().toISOString() })
    .eq('id', userId)
  return NextResponse.json({ ok: true })
}
