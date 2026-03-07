import { useNavigate } from "react-router-dom"
import { Bell, Home, MessageCircle, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import type { NotificationItem, NotificationType } from "../types"

const iconMap: Record<NotificationType, ReactNode> = {
  ROOM_INTERACTION: <Home className="h-4 w-4" />,
  ROOM_UPDATE: <RefreshCw className="h-4 w-4" />,
  NEW_MESSAGE: <MessageCircle className="h-4 w-4" />,
}

const colorMap: Record<NotificationType, string> = {
  ROOM_INTERACTION: "bg-blue-100 text-blue-600",
  ROOM_UPDATE: "bg-amber-100 text-amber-600",
  NEW_MESSAGE: "bg-green-100 text-green-600",
}

interface NotificationCardProps {
  notification: NotificationItem
  onMarkAsRead: (id: string) => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
}: NotificationCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors",
        notification.isRead
          ? "bg-background border-border hover:bg-muted/50"
          : "bg-primary/5 border-primary/20 hover:bg-primary/10"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full shrink-0 mt-0.5",
          colorMap[notification.type] ?? "bg-muted text-foreground"
        )}
      >
        {iconMap[notification.type] ?? <Bell className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm line-clamp-1",
              notification.isRead ? "font-medium" : "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  )
}
