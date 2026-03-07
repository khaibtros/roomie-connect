import type { PrivacySettings } from "../types"

const STORAGE_KEY = "privacy_settings"

const DEFAULT_SETTINGS: PrivacySettings = {
  publicProfile: true,
  phoneVisible: false,
  activityVisible: true,
  updatedAt: new Date().toISOString(),
}

export const privacyService = {
  getSettings(): PrivacySettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PrivacySettings) : { ...DEFAULT_SETTINGS }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  },

  async updateSettings(settings: PrivacySettings): Promise<PrivacySettings> {
    const updated: PrivacySettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  async deleteAccount(): Promise<void> {
    // TODO: call DELETE /auth/account when endpoint is available
    await Promise.resolve()
  },

  exportPersonalData(): void {
    const settings = privacyService.getSettings()
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "personal-data.json"
    anchor.click()
    URL.revokeObjectURL(url)
  },
}
