import { apiClient } from "@/lib/api"
import type { NotificationItem } from "../types"

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    type: (raw.type as NotificationItem["type"]) ?? "ROOM_UPDATE",
    title: String(raw.title ?? ""),
    description: String(raw.description ?? raw.message ?? ""),
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    redirectUrl: raw.redirectUrl ? String(raw.redirectUrl) : undefined,
  }
}

export const notificationService = {
  async getAll(): Promise<NotificationItem[]> {
    const { data, error } = await apiClient.getNotifications()
    if (error || !data) return []
    const raw: unknown[] = Array.isArray(data) ? data : (data?.notifications ?? [])
    return (raw as Record<string, unknown>[]).map(mapNotification)
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.markNotificationRead(id)
  },
}
