import { useState, useCallback } from "react"
import type { PrivacySettings } from "../types"
import { privacyService } from "../services/privacy.service"

interface UsePrivacyReturn {
  settings: PrivacySettings
  isUpdating: boolean
  updateSetting: <K extends keyof Omit<PrivacySettings, "updatedAt">>(
    key: K,
    value: PrivacySettings[K]
  ) => Promise<void>
  exportData: () => void
  deleteAccount: () => Promise<void>
}

export function usePrivacy(): UsePrivacyReturn {
  const [settings, setSettings] = useState<PrivacySettings>(() =>
    privacyService.getSettings()
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const updateSetting = useCallback(
    async <K extends keyof Omit<PrivacySettings, "updatedAt">>(
      key: K,
      value: PrivacySettings[K]
    ) => {
      const prev = settings
      // Optimistic update
      const optimistic: PrivacySettings = { ...settings, [key]: value }
      setSettings(optimistic)
      setIsUpdating(true)
      try {
        const updated = await privacyService.updateSettings(optimistic)
        setSettings(updated)
      } catch {
        setSettings(prev)
      } finally {
        setIsUpdating(false)
      }
    },
    [settings]
  )

  const exportData = useCallback(() => {
    privacyService.exportPersonalData()
  }, [])

  const deleteAccount = useCallback(async () => {
    await privacyService.deleteAccount()
  }, [])

  return { settings, isUpdating, updateSetting, exportData, deleteAccount }
}
