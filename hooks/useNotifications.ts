'use client'
import { useState, useEffect } from 'react'
import type { Notification } from '@/types/database'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    fetch('/api/notifications?limit=15')
      .then(r => r.json())
      .then(d => {
        setNotifications(d.data || [])
        setUnreadCount(d.unread_count || 0)
      })
      .catch(() => {})
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return { notifications, unreadCount, markAllRead }
}
