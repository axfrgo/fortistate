import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from '../settingsContext.tsx'
import './SettingsPanel.css'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const themeOptions = [
  { value: 'cosmic-dark', label: 'Cosmic Dark', description: 'High-contrast nebula backdrop' },
  { value: 'aurora-light', label: 'Aurora Light', description: 'Soft daylight gradients' },
] as const

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSetting, resetSettings } = useSettings()

  const settingsSummary = useMemo(() => {
    const enabled = [
      settings.showGrid && 'Canvas grid',
      settings.snapToGrid && 'Snap to grid',
      settings.highlightActiveEdges && 'Active edge glow',
      settings.showAlgebraWarnings && 'Algebra warnings',
      settings.includeGraphSnapshot && 'Graph snapshot export',
      settings.showChronotopeTips && 'Chronotope tips',
    ].filter(Boolean)

    if (enabled.length === 0) return 'No enhancements enabled'
    return enabled.join(' • ')
  }, [settings])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="settings-panel"
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          >
            <header className="settings-header">
              <div>
                <h2>Studio Settings</h2>
                <p>{settingsSummary}</p>
              </div>
              <button className="settings-close" onClick={onClose} aria-label="Close settings">
                ✕
              </button>
            </header>

            <section className="settings-section">
              <h3>Appearance</h3>
              <div className="theme-options">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`theme-card ${settings.theme === option.value ? 'active' : ''}`}
                    onClick={() => updateSetting('theme', option.value)}
                    type="button"
                  >
                    <span className="theme-label">{option.label}</span>
                    <span className="theme-description">{option.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-section">
              <h3>Canvas</h3>
              <div className="settings-grid">
                <ToggleRow
                  label="Show grid background"
                  description="Render the cosmic grid behind your operators"
                  value={settings.showGrid}
                  onChange={(value) => updateSetting('showGrid', value)}
                />
                <ToggleRow
                  label="Snap to grid"
                  description="Align operators on a precise lattice (20px)"
                  value={settings.snapToGrid}
                  onChange={(value) => updateSetting('snapToGrid', value)}
                />
                <ToggleRow
                  label="Click-to-connect mode"
                  description="Create edges by selecting a source and target node"
                  value={settings.enableClickToConnect}
                  onChange={(value) => updateSetting('enableClickToConnect', value)}
                />
                <ToggleRow
                  label="Highlight active edges"
                  description="Glowing animation when execution flows through edges"
                  value={settings.highlightActiveEdges}
                  onChange={(value) => updateSetting('highlightActiveEdges', value)}
                />
                <ToggleRow
                  label="Edge count overlay"
                  description="Displays the number of edges in the current graph"
                  value={settings.showEdgeCountOverlay}
                  onChange={(value) => updateSetting('showEdgeCountOverlay', value)}
                />
              </div>
            </section>

            <section className="settings-section">
              <h3>Algebra Output</h3>
              <div className="settings-grid">
                <ToggleRow
                  label="Include graph snapshot"
                  description="Embed the graph structure as a serialised constant"
                  value={settings.includeGraphSnapshot}
                  onChange={(value) => updateSetting('includeGraphSnapshot', value)}
                />
                <ToggleRow
                  label="Show diagnostic warnings"
                  description="Surface missing metadata and potential execution issues"
                  value={settings.showAlgebraWarnings}
                  onChange={(value) => updateSetting('showAlgebraWarnings', value)}
                />
                <ToggleRow
                  label="Chronotope & paradox tips"
                  description="Keep integration hints in the generated module"
                  value={settings.showChronotopeTips}
                  onChange={(value) => updateSetting('showChronotopeTips', value)}
                />
              </div>
            </section>

            <footer className="settings-footer">
              <button className="reset-button" type="button" onClick={resetSettings}>
                ♻ Reset to defaults
              </button>
              <button className="primary-button" type="button" onClick={onClose}>
                Done
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <div className="toggle-copy">
        <span className="toggle-label">{label}</span>
        <span className="toggle-description">{description}</span>
      </div>
      <button
        type="button"
        className={`toggle ${value ? 'on' : 'off'}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className="toggle-thumb" />
      </button>
    </label>
  )
}
