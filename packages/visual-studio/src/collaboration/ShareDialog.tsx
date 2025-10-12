import { useState } from 'react'
import { motion } from 'framer-motion'
import type { User, ProjectId } from '../collaboration/types'
import './ShareDialog.css'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: ProjectId
  currentUser: User
  onInvite: (email: string, role: 'viewer' | 'editor' | 'admin') => Promise<void>
}

export function ShareDialog({ isOpen, onClose, projectId, currentUser, onInvite }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsInviting(true)
    setError(null)

    try {
      await onInvite(email, role)
      setEmail('')
      setRole('editor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const shareUrl = `${window.location.origin}/project/${projectId}`

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    // Show toast notification (implement toast system if needed)
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        className="share-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="share-dialog-positioner" role="dialog" aria-modal="true" aria-label="Share project">
        <motion.div
          className="share-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="share-header">
            <h2>Share Project</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="share-content">
          {/* Invite by email */}
          <form onSubmit={handleInvite} className="invite-form">
            <label>Invite collaborators</label>
            <div className="invite-inputs">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                disabled={isInviting}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                className="role-select"
                disabled={isInviting}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="invite-button" disabled={isInviting || !email.trim()}>
                {isInviting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </form>

          {/* Role descriptions */}
          <div className="role-descriptions">
            <div className="role-item">
              <strong>Viewer</strong> — Can view the project but cannot edit
            </div>
            <div className="role-item">
              <strong>Editor</strong> — Can view and edit the project
            </div>
            <div className="role-item">
              <strong>Admin</strong> — Full access including sharing and deletion
            </div>
          </div>

          {/* Share link */}
          <div className="share-link-section">
            <label>Share link</label>
            <div className="share-link-input">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="link-input"
                onClick={(e) => e.currentTarget.select()}
              />
              <button onClick={copyShareLink} className="copy-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* Tier upgrade prompt for Free users */}
          {currentUser.tier === 'free' && (
            <div className="upgrade-notice">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <strong>Upgrade to Pro</strong> to enable real-time collaboration with your team.
                <a href="#upgrade" className="upgrade-link">
                  View plans →
                </a>
              </div>
            </div>
          )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
