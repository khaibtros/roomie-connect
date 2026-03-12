import type { RoomHistoryItem } from "../types"

const STORAGE_KEY_PREFIX = "room_view_history"
const MAX_HISTORY = 50

let _currentUserId: string | null = null

function storageKey(): string {
  return _currentUserId
    ? `${STORAGE_KEY_PREFIX}_${_currentUserId}`
    : STORAGE_KEY_PREFIX
}

export const historyService = {
  setUserId(userId: string | null): void {
    _currentUserId = userId
  },

  getAll(): RoomHistoryItem[] {
    try {
      const raw = localStorage.getItem(storageKey())
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
    localStorage.setItem(storageKey(), JSON.stringify(updated))
  },

  clearAll(): void {
    localStorage.removeItem(storageKey())
  },
}
