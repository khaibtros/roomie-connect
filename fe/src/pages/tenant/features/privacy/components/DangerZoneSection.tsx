import { Trash2 } from "lucide-react"
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

interface DangerZoneSectionProps {
  onDeleteAccount: () => void
}

export function DangerZoneSection({ onDeleteAccount }: DangerZoneSectionProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden">
      <div className="p-4 border-b border-destructive/20 bg-destructive/5">
        <h2 className="font-semibold text-sm text-destructive uppercase tracking-wide">
          Vùng Nguy Hiểm
        </h2>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Xóa Tài Khoản</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Xóa tài khoản
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Bạn chắc chắn muốn xóa tài khoản?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này không thể hoàn tác. Toàn bộ dữ liệu, tin đăng
                  và thông tin cá nhân của bạn sẽ bị xóa vĩnh viễn.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Xóa vĩnh viễn
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
