import { useNavigate } from "react-router-dom"
import { ArrowLeft, History, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Layout } from "@/components/Layout"
import { useHistory } from "./hooks/useHistory"
import { RoomHistoryCard } from "./components/RoomHistoryCard"

export default function HistoryPage() {
  const navigate = useNavigate()
  const { items, isClearing, clearAll } = useHistory()

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Lịch Sử Xem</h1>
          </div>

          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Xóa tất cả
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa lịch sử xem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ xóa toàn bộ lịch sử xem phòng của bạn và
                    không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAll}
                    disabled={isClearing}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Xóa tất cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-medium mb-2">Chưa có lịch sử xem</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Các phòng bạn đã xem gần đây sẽ xuất hiện ở đây.
            </p>
            <Button onClick={() => navigate("/find-room")}>
              Tìm phòng ngay
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {items.length} phòng đã xem
            </p>
            {items.map((item) => (
              <RoomHistoryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
