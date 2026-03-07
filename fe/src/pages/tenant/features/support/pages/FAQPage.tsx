import { useNavigate } from "react-router-dom"
import { ArrowLeft, MessageCircle, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout } from "@/components/Layout"
import { SupportCard } from "../components/SupportCard"
import { faqService } from "../services/faq.service"
import type { FAQCategory } from "../types"

const CATEGORY_LABELS: Record<FAQCategory, string> = {
  ACCOUNT: "Tài khoản",
  SEARCH: "Tìm kiếm",
  PAYMENT: "Thanh toán",
  SECURITY: "Bảo mật",
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FAQCategory[]

export default function FAQPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
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
          <h1 className="text-xl font-bold">Hỗ Trợ</h1>
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="faq" className="flex-1">
              Câu hỏi thường gặp
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-1">
              Liên hệ
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {CATEGORIES.map((cat) => {
              const items = faqService.getByCategory(cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {items.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border rounded-xl px-4 data-[state=open]:shadow-sm"
                      >
                        <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-3">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )
            })}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Chọn kênh hỗ trợ phù hợp với bạn:
            </p>
            <SupportCard
              icon={MessageCircle}
              label="Live Chat"
              description="Chat trực tiếp với đội hỗ trợ"
              colorClass="bg-blue-100 text-blue-600"
              onClick={() => navigate("/support/contact")}
            />
            <SupportCard
              icon={Mail}
              label="Gửi Email"
              description="support@knockknock.vn"
              colorClass="bg-green-100 text-green-600"
              onClick={() => (window.location.href = "mailto:support@knockknock.vn")}
            />
            <SupportCard
              icon={Phone}
              label="Hotline"
              description="1800-KNOCK (Miễn phí · 8:00–22:00)"
              colorClass="bg-amber-100 text-amber-600"
              onClick={() => (window.location.href = "tel:1800KNOCK")}
            />
            <Button
              className="w-full mt-2"
              onClick={() => navigate("/support/contact")}
            >
              Gửi yêu cầu hỗ trợ
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
