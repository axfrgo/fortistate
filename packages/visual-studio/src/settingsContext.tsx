import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'

export type StudioTheme = 'cosmic-dark' | 'aurora-light'

export interface StudioSettings {
  theme: StudioTheme
  showGrid: boolean
  snapToGrid: boolean
  showEdgeCountOverlay: boolean
  enableClickToConnect: boolean
  highlightActiveEdges: boolean
  showAlgebraWarnings: boolean
  includeGraphSnapshot: boolean
  showChronotopeTips: boolean
}

interface SettingsContextValue {
  settings: StudioSettings
  updateSetting: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void
  resetSettings: () => void
}

const STORAGE_KEY = 'fortistate:studio-settings:v1'

const defaultSettings: StudioSettings = {
  theme: 'aurora-light',
  showGrid: true,
  snapToGrid: false,
  showEdgeCountOverlay: true,
  enableClickToConnect: true,
  highlightActiveEdges: true,
  showAlgebraWarnings: true,
  includeGraphSnapshot: true,
  showChronotopeTips: true,
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return defaultSettings
      const parsed = JSON.parse(stored) as Partial<StudioSettings>
      return { ...defaultSettings, ...parsed }
    } catch (error) {
      console.warn('⚠️ Failed to parse stored settings, using defaults.', error)
      return defaultSettings
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('⚠️ Failed to persist settings.', error)
    }
  }, [settings])

  const updateSetting = useMemo(
    () =>
      function updateSettingFn<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) {
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }))
      },
    [],
  )

  const resetSettings = useMemo(
    () =>
      function resetSettingsFn() {
        setSettings(defaultSettings)
      },
    [],
  )

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSetting: updateSetting as SettingsContextValue['updateSetting'], resetSettings }),
    [settings, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export { defaultSettings }
