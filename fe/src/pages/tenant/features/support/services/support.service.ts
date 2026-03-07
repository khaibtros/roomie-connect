import type { SupportRequestPayload } from "../types"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const supportService = {
  async submitRequest(payload: SupportRequestPayload): Promise<void> {
    if (!isValidEmail(payload.email)) {
      throw new Error("Email không hợp lệ")
    }
    // Simulate network latency; replace with real API call when endpoint is available
    await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  },
}
