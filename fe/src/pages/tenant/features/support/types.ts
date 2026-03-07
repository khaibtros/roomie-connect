export type FAQCategory = "ACCOUNT" | "SEARCH" | "PAYMENT" | "SECURITY"

export type FAQItem = {
  id: string
  category: FAQCategory
  question: string
  answer: string
}

export type SupportRequestPayload = {
  name: string
  email: string
  subject: string
  message: string
}
