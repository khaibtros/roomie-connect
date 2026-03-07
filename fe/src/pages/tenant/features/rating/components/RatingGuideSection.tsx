import { Star, ThumbsUp, Smile, Meh, Frown, AlertTriangle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface GuideEntry {
  stars: number
  Icon: LucideIcon
  label: string
  description: string
  colorClass: string
}

const GUIDES: GuideEntry[] = [
  {
    stars: 5,
    Icon: ThumbsUp,
    label: "Xuất sắc",
    description: "Tuyệt vời, vượt mong đợi!",
    colorClass: "text-green-500 bg-green-50",
  },
  {
    stars: 4,
    Icon: Smile,
    label: "Tốt",
    description: "Hài lòng, đúng kỳ vọng",
    colorClass: "text-blue-500 bg-blue-50",
  },
  {
    stars: 3,
    Icon: Meh,
    label: "Trung bình",
    description: "Tạm được, cần cải thiện",
    colorClass: "text-amber-500 bg-amber-50",
  },
  {
    stars: 2,
    Icon: Frown,
    label: "Kém",
    description: "Không hài lòng",
    colorClass: "text-orange-500 bg-orange-50",
  },
  {
    stars: 1,
    Icon: AlertTriangle,
    label: "Rất kém",
    description: "Rất tệ, cần cải thiện ngay",
    colorClass: "text-red-500 bg-red-50",
  },
]

export function RatingGuideSection() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Hướng dẫn đánh giá
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {GUIDES.map((guide) => (
          <Card key={guide.stars} className="border-0 shadow-none bg-muted/40">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${guide.colorClass}`}>
                <guide.Icon className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 mr-auto">
                {Array.from({ length: guide.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">{guide.label}</p>
                <p className="text-xs text-muted-foreground">
                  {guide.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
