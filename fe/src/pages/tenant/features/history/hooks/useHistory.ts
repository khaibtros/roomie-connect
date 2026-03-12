import { useState, useCallback } from "react"
import type { RoomHistoryItem } from "../types"
import { historyService } from "../services/history.service"
import { useAuth } from "@/contexts/AuthContext"

interface UseHistoryReturn {
  items: RoomHistoryItem[]
  isClearing: boolean
  clearAll: () => void
}

export function useHistory(): UseHistoryReturn {
  const { user } = useAuth()
  historyService.setUserId(user?.id || user?._id || null)
  const [items, setItems] = useState<RoomHistoryItem[]>(() =>
    historyService.getAll()
  )
  const [isClearing, setIsClearing] = useState(false)

  const clearAll = useCallback(() => {
    setIsClearing(true)
    historyService.clearAll()
    setItems([])
    setIsClearing(false)
  }, [])

  return { items, isClearing, clearAll }
}
