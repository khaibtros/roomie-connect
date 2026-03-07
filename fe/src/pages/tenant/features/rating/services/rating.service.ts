import type { AppRatingPayload } from "../types"

const STORAGE_KEY = "app_rating_submitted"

export const ratingService = {
  async submitRating(payload: AppRatingPayload): Promise<void> {
    // Simulate network request; replace with real API call when endpoint is available
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, submittedAt: new Date().toISOString() })
    )
  },

  hasRated(): boolean {
    return !!localStorage.getItem(STORAGE_KEY)
  },
}
