import { Download, FileText, ShieldCheck } from "lucide-react"

interface PrivacyDataSectionProps {
  onExport: () => void
  onPrivacyPolicy: () => void
  onPrivacyReport: () => void
}

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  colorClass: string
  onClick: () => void
}

export function PrivacyDataSection({
  onExport,
  onPrivacyPolicy,
  onPrivacyReport,
}: PrivacyDataSectionProps) {
  const actions: ActionItem[] = [
    {
      icon: Download,
      label: "Tải Dữ Liệu Cá Nhân",
      description: "Xuất bản sao lưu dữ liệu của bạn",
      colorClass: "bg-blue-100 text-blue-600",
      onClick: onExport,
    },
    {
      icon: FileText,
      label: "Báo Cáo Quyền Riêng Tư",
      description: "Gửi báo cáo vấn đề riêng tư",
      colorClass: "bg-amber-100 text-amber-600",
      onClick: onPrivacyReport,
    },
    {
      icon: ShieldCheck,
      label: "Chính Sách Quyền Riêng Tư",
      description: "Xem chính sách bảo mật đầy đủ",
      colorClass: "bg-green-100 text-green-600",
      onClick: onPrivacyPolicy,
    },
  ]

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/40">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Dữ Liệu & Quyền Riêng Tư
        </h2>
      </div>
      <div className="divide-y">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`p-2 rounded-lg shrink-0 ${action.colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
