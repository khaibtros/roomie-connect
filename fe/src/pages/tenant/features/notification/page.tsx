import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Layout } from "@/components/Layout"
import { useNotification } from "./hooks/useNotification"
import { NotificationCard } from "./components/NotificationCard"

export default function NotificationPage() {
  const navigate = useNavigate()
  const { items, unreadCount, isLoading, error, markAsRead } = useNotification()

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Thông Báo</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} chưa đọc</Badge>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4 border rounded-xl">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-16">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-medium mb-2">Không có thông báo</h3>
            <p className="text-sm text-muted-foreground">
              Bạn chưa có thông báo nào. Hãy quay lại sau!
            </p>
          </div>
        )}

        {/* Notification List */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
