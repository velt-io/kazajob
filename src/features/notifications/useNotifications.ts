'use client'

import { useState, useEffect, useCallback, useRef, createElement, type ReactNode } from 'react'
import { Bell, CalendarDays, ClipboardList, Clock, Sparkles, Undo2, type LucideIcon } from 'lucide-react'

export interface Notification {
  id: string
  user_id: string
  type: 'application_status' | 'new_job_match' | 'interview_scheduled' | 'application_withdrawn' | string
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

// Icônes lucide au lieu d'emojis.
const TYPE_ICON: Record<string, LucideIcon> = {
  application_status:     ClipboardList,
  new_job_match:          Sparkles,
  interview_scheduled:    CalendarDays,
  application_withdrawn:  Undo2,
  job_expired:            Clock,
}

export function getNotifIcon(type: string): ReactNode {
  return createElement(TYPE_ICON[type] ?? Bell, { size: 16, className: 'text-[var(--kz-ink)]' })
}

const POLL_MS = 10000

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const activeRef = useRef(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok && activeRef.current) setNotifications((await res.json()) as Notification[])
    } catch { /* garde l'état */ }
    if (activeRef.current) setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    activeRef.current = true
    fetchNotifications()
    const timer = setInterval(fetchNotifications, POLL_MS) // polling (remplace le realtime)
    return () => { activeRef.current = false; clearInterval(timer) }
  }, [userId, fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications/all', { method: 'PATCH' }).catch(() => {})
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, loading, unreadCount, markRead, markAllRead }
}
