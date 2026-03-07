export type NotificationType = "ROOM_INTERACTION" | "ROOM_UPDATE" | "NEW_MESSAGE"

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  description: string
  isRead: boolean
  createdAt: string
  redirectUrl?: string
}
