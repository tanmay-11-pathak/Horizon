'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
}

interface Props {
  userId: string
  onClose: () => void
  onCreated: (conversationId: string) => void
}

export default function CreateGroupModal({ userId, onClose, onCreated }: Props) {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const searchUsers = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', userId)
      .limit(8)
    setSearchResults(data || [])
  }

  const toggleUser = (user: Profile) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )
  }

  const createGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name')
      return
    }
    if (selectedUsers.length < 1) {
      setError('Please add at least 1 member')
      return
    }
    setCreating(true)
    setError('')

    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        is_group: true,
        group_name: groupName.trim(),
        created_by: userId
      })
      .select()
      .single()

    if (conv) {
      const members = [userId, ...selectedUsers.map((u) => u.id)].map((uid) => ({
        conversation_id: conv.id,
        user_id: uid
      }))
      await supabase.from('conversation_members').insert(members)
      onCreated(conv.id)
    }
    setCreating(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(15,15,15,0.98)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 0 60px rgba(124,58,237,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>New Group</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#888',
              borderRadius: 8,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 18
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: '#888', fontSize: 13 }}>Group name *</label>
          <input
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'white',
              fontSize: 14,
              outline: 'none'
            }}
            placeholder="e.g. Study Group, Friends..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {selectedUsers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 20,
                  padding: '4px 10px'
                }}
              >
                <span style={{ color: '#c4b5fd', fontSize: 13 }}>{user.username}</span>
                <button
                  onClick={() => toggleUser(user)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: '#888', fontSize: 13 }}>Add members</label>
          <input
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 14px',
              color: 'white',
              fontSize: 14,
              outline: 'none'
            }}
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div
              style={{
                background: 'rgba(20,20,20,0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              {searchResults.map((user) => {
                const isSelected = selectedUsers.find((u) => u.id === user.id)
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(124,58,237,0.15)' : 'transparent'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(124,58,237,0.3)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{user.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span style={{ color: 'white', fontSize: 14 }}>{user.username}</span>
                    {isSelected && <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: 16 }}>✓</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          onClick={createGroup}
          disabled={creating}
          style={{
            padding: '12px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            cursor: creating ? 'not-allowed' : 'pointer',
            opacity: creating ? 0.7 : 1
          }}
        >
          {creating ? 'Creating...' : `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length + 1} members)` : ''}`}
        </button>
      </div>
    </div>
  )
}
