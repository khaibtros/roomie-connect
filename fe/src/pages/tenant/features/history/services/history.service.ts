import type { RoomHistoryItem } from "../types"

const STORAGE_KEY = "room_view_history"
const MAX_HISTORY = 50

export const historyService = {
  getAll(): RoomHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as RoomHistoryItem[]) : []
    } catch {
      return []
    }
  },

  add(item: Omit<RoomHistoryItem, "viewedAt">): void {
    const history = historyService.getAll()
    const filtered = history.filter((h) => h.id !== item.id)
    const updated: RoomHistoryItem[] = [
      { ...item, viewedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_HISTORY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
