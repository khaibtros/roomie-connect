import { useNavigate } from "react-router-dom"
import { MapPin, Clock, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatRelativeTime, formatPrice } from "@/lib/format"
import type { RoomHistoryItem } from "../types"

interface RoomHistoryCardProps {
  item: RoomHistoryItem
}

export function RoomHistoryCard({ item }: RoomHistoryCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/rooms/${item.id}`)}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                Chưa có ảnh
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1 mb-0.5">
              {item.title}
            </h3>
            <p className="text-primary font-semibold text-sm mb-1">
              {formatPrice(item.price)}/tháng
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{item.address}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(item.viewedAt)}</span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
        </div>
      </CardContent>
    </Card>
  )
}
