import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarSelectorProps {
  value: number
  onChange: (rating: number) => void
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP: Record<NonNullable<StarSelectorProps["size"]>, string> = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-12 w-12",
}

export function StarSelector({ value, onChange, size = "md" }: StarSelectorProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Chọn số sao đánh giá"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} sao`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              SIZE_MAP[size],
              "transition-colors",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground hover:text-amber-300"
            )}
          />
        </button>
      ))}
    </div>
  )
}
