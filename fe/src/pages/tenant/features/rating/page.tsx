import { useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Layout } from "@/components/Layout"
import { toast } from "sonner"
import { useRating } from "./hooks/useRating"
import { StarSelector } from "./components/StarSelector"
import { RatingGuideSection } from "./components/RatingGuideSection"

const RATING_LABELS: Record<number, string> = {
  1: "Rất kém",
  2: "Kém",
  3: "Trung bình",
  4: "Tốt",
  5: "Xuất sắc",
}

export default function RatingPage() {
  const navigate = useNavigate()
  const { rating, feedback, isSubmitting, isSubmitted, setRating, setFeedback, submit, skip } =
    useRating(() => navigate(-1))

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning("Vui lòng chọn số sao trước khi gửi")
      return
    }
    await submit()
    toast.success("Cảm ơn bạn đã đánh giá!")
  }

  return (
    <Layout>
      <div className="container max-w-lg py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Đánh Giá Ứng Dụng</h1>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Cảm ơn bạn!</h2>
            <p className="text-muted-foreground text-sm">
              Đánh giá của bạn đã được ghi nhận.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Star Rating */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Bạn hài lòng với KnockKnock đến đâu?
              </p>
              <div className="flex justify-center">
                <StarSelector value={rating} onChange={setRating} size="lg" />
              </div>
              {rating > 0 && (
                <p className="text-sm font-medium text-primary animate-in fade-in duration-200">
                  {RATING_LABELS[rating]}
                </p>
              )}
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <label
                htmlFor="feedback"
                className="text-sm font-medium"
              >
                Nhận xét thêm{" "}
                <span className="text-muted-foreground font-normal">
                  (tuỳ chọn)
                </span>
              </label>
              <Textarea
                id="feedback"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={skip} className="flex-1">
                Bỏ qua
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </div>

            {/* Guide */}
            <RatingGuideSection />
          </div>
        )}
      </div>
    </Layout>
  )
}
