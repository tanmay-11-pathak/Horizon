'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NewConversation({ userId, onCreated }: { userId: string, onCreated: (id: string) => void }) {
  const [loading, setLoading] = useState(false)

  const create = async () => {
    setLoading(true)
    const { data } = await supabase.from('conversations').insert({}).select().single()
    if (data) {
      await supabase.from('conversation_members').insert({ conversation_id: data.id, user_id: userId })
      onCreated(data.id)
    }
    setLoading(false)
  }

  return (
    <button onClick={create} disabled={loading} className="px-4 py-2 bg-black text-white rounded-xl text-sm">
      {loading ? 'Creating...' : 'New Chat'}
    </button>
  )
}
