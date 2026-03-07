import { useState, useEffect, useCallback } from "react"
import type { NotificationItem } from "../types"
import { notificationService } from "../services/notification.service"

interface UseNotificationReturn {
  items: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (id: string) => void
}

export function useNotification(): UseNotificationReturn {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await notificationService.getAll()
        if (!cancelled) setItems(data)
      } catch {
        if (!cancelled) setError("Không thể tải thông báo")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const unreadCount = items.filter((n) => !n.isRead).length

  const markAsRead = useCallback((id: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    notificationService.markAsRead(id).catch(() => {
      // Rollback on failure
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      )
    })
  }, [])

  return { items, unreadCount, isLoading, error, markAsRead }
}
