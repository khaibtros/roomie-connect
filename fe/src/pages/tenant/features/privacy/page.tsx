import { useNavigate } from "react-router-dom"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Layout } from "@/components/Layout"
import { toast } from "sonner"
import { usePrivacy } from "./hooks/usePrivacy"
import { PrivacyToggleSection } from "./components/PrivacyToggleSection"
import { PrivacyDataSection } from "./components/PrivacyDataSection"
import { DangerZoneSection } from "./components/DangerZoneSection"
import { formatRelativeTime } from "@/lib/format"

export default function PrivacyPage() {
  const navigate = useNavigate()
  const { settings, isUpdating, updateSetting, exportData, deleteAccount } =
    usePrivacy()

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
      toast.success("Tài khoản đã được xóa")
      navigate("/")
    } catch {
      toast.error("Không thể xóa tài khoản. Vui lòng thử lại.")
    }
  }

  const handleExport = () => {
    exportData()
    toast.success("Đang tải xuống dữ liệu cá nhân...")
  }

  const handlePrivacyPolicy = () => {
    window.open("/privacy-policy", "_blank", "noopener,noreferrer")
  }

  const handlePrivacyReport = () => {
    toast.info("Chức năng báo cáo sẽ sớm khả dụng")
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Quyền Riêng Tư</h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-11 mb-6">
          Cập nhật lần cuối: {formatRelativeTime(settings.updatedAt)}
        </p>

        <div className="space-y-4">
          <PrivacyToggleSection
            settings={settings}
            disabled={isUpdating}
            onToggle={updateSetting}
          />
          <PrivacyDataSection
            onExport={handleExport}
            onPrivacyPolicy={handlePrivacyPolicy}
            onPrivacyReport={handlePrivacyReport}
          />
          <DangerZoneSection onDeleteAccount={handleDeleteAccount} />
        </div>
      </div>
    </Layout>
  )
}
