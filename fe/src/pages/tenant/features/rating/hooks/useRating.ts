import { useState, useCallback } from "react"
import type { AppRatingPayload } from "../types"
import { ratingService } from "../services/rating.service"

interface UseRatingReturn {
  rating: number
  feedback: string
  isSubmitting: boolean
  isSubmitted: boolean
  setRating: (r: number) => void
  setFeedback: (f: string) => void
  submit: () => Promise<void>
  skip: () => void
}

export function useRating(onDone: () => void): UseRatingReturn {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const submit = useCallback(async () => {
    if (rating === 0) return
    const payload: AppRatingPayload = {
      rating,
      feedback: feedback.trim() || undefined,
    }
    setIsSubmitting(true)
    try {
      await ratingService.submitRating(payload)
      setIsSubmitted(true)
      setTimeout(onDone, 1500)
    } finally {
      setIsSubmitting(false)
    }
  }, [rating, feedback, onDone])

  const skip = useCallback(() => {
    onDone()
  }, [onDone])

  return {
    rating,
    feedback,
    isSubmitting,
    isSubmitted,
    setRating,
    setFeedback,
    submit,
    skip,
  }
}
