import { AnimatePresence, motion } from 'framer-motion'
import './HelpModal.css'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  {
    category: 'Canvas',
    items: [
      { keys: ['Delete', 'Backspace'], action: 'Delete selected nodes or edges' },
      { keys: ['Ctrl / ⌘', 'A'], action: 'Select all nodes' },
      { keys: ['Space', 'Drag'], action: 'Pan across the canvas' },
      { keys: ['Mouse wheel'], action: 'Zoom in / out' },
      { keys: ['Ctrl / ⌘', '0'], action: 'Reset zoom to fit' },
    ],
  },
  {
    category: 'Modes',
    items: [
      { keys: ['Ctrl / ⌘', '1'], action: 'Switch to Play mode' },
      { keys: ['Ctrl / ⌘', '2'], action: 'Switch to Hybrid mode' },
      { keys: ['Ctrl / ⌘', '3'], action: 'Switch to Algebra mode' },
    ],
  },
  {
    category: 'Studio',
    items: [
      { keys: ['Ctrl / ⌘', '?'], action: 'Toggle this help panel' },
      { keys: ['Ctrl / ⌘', ','], action: 'Open settings' },
      { keys: ['Double click node'], action: 'Edit operator details' },
      { keys: ['Drag from handle'], action: 'Create a connection (drag mode)' },
      { keys: ['Click → Click'], action: 'Create a connection (click-to-connect mode)' },
    ],
  },
]

const resources = [
  {
    title: 'Visual Studio Deep Dive',
    description: 'Full tour of Play, Hybrid, and Algebra depth modes',
    link: 'https://github.com/axfrgo/fortistate/blob/master/packages/visual-studio/VISUAL_STUDIO_VX.md',
  },
  {
    title: 'Ontogenetic Operators',
    description: 'BEGIN, BECOME, CEASE, TRANSCEND, and RESOLVE explained',
    link: 'https://github.com/axfrgo/fortistate/blob/master/docs/HOOKS.md',
  },
  {
    title: 'Collision & Paradox Guides',
    description: 'Integrate chronotope snapshots and conflict inspectors',
    link: 'https://github.com/axfrgo/fortistate/blob/master/docs/COLLABORATION_ANALYSIS.md',
  },
]

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="help-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className="help-modal-positioner" aria-hidden>
            <motion.div
              className="help-modal"
              role="dialog"
              aria-modal="true"
              initial={{ y: 36, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            >
              <header className="help-header">
                <div>
                  <h2>Fortistate Studio Help</h2>
                  <p>Shortcuts, gestures, and learning resources to master Generative Existence Theory.</p>
                </div>
                <button className="help-close" onClick={onClose} aria-label="Close help">
                  ✕
                </button>
              </header>

              <section className="help-section">
                <h3>Quick Start</h3>
                <div className="help-quick">
                  <article>
                    <h4>Build a narrative</h4>
                    <p>Drag ontogenetic operators (🌱/🌊/🧱/🌀/🔄) onto the canvas, connect them, and double click to customise each law.</p>
                  </article>
                  <article>
                    <h4>Run the fabric</h4>
                    <p>Switch to Play mode and press <strong>Execute</strong> to simulate the graph and inspect the narrative timeline.</p>
                  </article>
                  <article>
                    <h4>Inspect the algebra</h4>
                    <p>Enter Hybrid mode to see the generated operators, diagnostics, and chronotope integration tips in real time.</p>
                  </article>
                </div>
              </section>

              <section className="help-section">
                <h3>Keyboard Shortcuts</h3>
                <div className="shortcut-grid">
                  {shortcuts.map((group) => (
                    <div key={group.category} className="shortcut-card">
                      <h4>{group.category}</h4>
                      <ul>
                        {group.items.map((item, index) => (
                          <li key={`${group.category}-${index}`}>
                            <span className="keys">
                              {item.keys.map((key, keyIndex) => (
                                <kbd key={keyIndex}>{key}</kbd>
                              ))}
                            </span>
                            <span className="action">{item.action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="help-section">
                <h3>Pro Tips</h3>
                <ul className="tips-list">
                  <li>Shift + Drag nodes together to keep timelines aligned before connecting portals.</li>
                  <li>Use the Settings panel to enable snapping and edge overlays when auditing complex graphs.</li>
                  <li>Hybrid mode mirrors every change in the Algebra view—copy the module to bootstrap your production laws.</li>
                  <li>Chronotope snapshots are serialised automatically; plug them into <code>chronotopeStore.reconcileSnapshots</code> for vΩ⁺ simulations.</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>Learn More</h3>
                <div className="resource-grid">
                  {resources.map((resource) => (
                    <a
                      key={resource.title}
                      className="resource-card"
                      href={resource.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="resource-title">{resource.title}</span>
                      <span className="resource-description">{resource.description}</span>
                      <span className="resource-link">Open reference →</span>
                    </a>
                  ))}
                </div>
              </section>

              <footer className="help-footer">
                <span>Need deeper guidance? Email <strong>studio@fortistate.dev</strong>.</span>
                <button className="primary-button" type="button" onClick={onClose}>
                  Back to building
                </button>
              </footer>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
