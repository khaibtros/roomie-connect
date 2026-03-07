import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Layout } from "@/components/Layout"
import { toast } from "sonner"
import { supportService } from "../services/support.service"
import type { SupportRequestPayload } from "../types"

type FormErrors = Partial<Record<keyof SupportRequestPayload, string>>

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ContactSupportPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SupportRequestPayload>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (key: keyof SupportRequestPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = "Vui lòng nhập họ tên"
    if (!form.email.trim()) next.email = "Vui lòng nhập email"
    else if (!validateEmail(form.email)) next.email = "Email không hợp lệ"
    if (!form.subject.trim()) next.subject = "Vui lòng nhập chủ đề"
    if (!form.message.trim()) next.message = "Vui lòng nhập nội dung"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await supportService.submitRequest(form)
      toast.success("Yêu cầu đã được gửi! Chúng tôi sẽ phản hồi trong 24h.")
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gửi thất bại, vui lòng thử lại"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container max-w-lg py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Gửi Yêu Cầu Hỗ Trợ</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Họ và tên *</Label>
            <Input
              id="name"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Chủ đề *</Label>
            <Input
              id="subject"
              placeholder="Vấn đề cần hỗ trợ"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
            {errors.subject && (
              <p id="subject-error" className="text-xs text-destructive">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message">Nội dung *</Label>
            <Textarea
              id="message"
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={5}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <p id="message-error" className="text-xs text-destructive">
                {errors.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
