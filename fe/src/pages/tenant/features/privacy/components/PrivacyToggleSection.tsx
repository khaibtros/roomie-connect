import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { PrivacySettings } from "../types"

type ToggleKey = keyof Omit<PrivacySettings, "updatedAt">

interface ToggleItem {
  key: ToggleKey
  label: string
  description: string
}

const TOGGLES: ToggleItem[] = [
  {
    key: "publicProfile",
    label: "Hồ Sơ Công Khai",
    description: "Cho phép người khác xem hồ sơ của bạn",
  },
  {
    key: "phoneVisible",
    label: "Hiển Thị Số Điện Thoại",
    description: "Hiển thị số điện thoại trên hồ sơ công khai",
  },
  {
    key: "activityVisible",
    label: "Trạng Thái Hoạt Động",
    description: "Hiển thị khi nào bạn đang hoạt động",
  },
]

interface PrivacyToggleSectionProps {
  settings: PrivacySettings
  disabled: boolean
  onToggle: (key: ToggleKey, value: boolean) => void
}

export function PrivacyToggleSection({
  settings,
  disabled,
  onToggle,
}: PrivacyToggleSectionProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/40">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Cài Đặt Quyền Riêng Tư
        </h2>
      </div>
      <div className="divide-y">
        {TOGGLES.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <Label
                htmlFor={item.key}
                className="text-sm font-medium cursor-pointer"
              >
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={item.key}
              checked={settings[item.key]}
              onCheckedChange={(v) => onToggle(item.key, v)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
