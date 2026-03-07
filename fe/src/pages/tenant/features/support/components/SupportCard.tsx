import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SupportCardProps {
  icon: LucideIcon
  label: string
  description: string
  colorClass: string
  onClick: () => void
}

export function SupportCard({
  icon: Icon,
  label,
  description,
  colorClass,
  onClick,
}: SupportCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
