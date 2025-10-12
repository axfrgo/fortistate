import { motion } from 'framer-motion'
import type { Presence, UserId } from '../collaboration/types'
import './PresenceAvatars.css'

interface PresenceAvatarsProps {
  presences: Map<UserId, Presence>
  currentUserId?: UserId
  onUserClick?: (userId: UserId) => void
}

export function PresenceAvatars({ presences, currentUserId, onUserClick }: PresenceAvatarsProps) {
  const activeUsers = Array.from(presences.values()).filter(
    (p) => p.status === 'active' && p.userId !== currentUserId
  )

  if (activeUsers.length === 0) return null

  return (
    <div className="presence-avatars">
      <div className="avatars-list">
        {activeUsers.map((presence) => (
          <motion.button
            key={presence.userId}
            className={`avatar-button status-${presence.status}`}
            onClick={() => onUserClick?.(presence.userId)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`${presence.user.name} (${presence.user.tier})`}
            style={{
              '--user-color': presence.user.color,
            } as React.CSSProperties}
          >
            {presence.user.avatar ? (
              <img src={presence.user.avatar} alt={presence.user.name} className="avatar-image" />
            ) : (
              <div className="avatar-initials">
                {presence.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            
            {/* Status indicator */}
            <div className="status-indicator" />
          </motion.button>
        ))}

        {/* User count badge */}
        {activeUsers.length > 5 && (
          <div className="overflow-badge">+{activeUsers.length - 5}</div>
        )}
      </div>

      {/* Tooltip with names */}
      <div className="avatars-tooltip">
        {activeUsers.slice(0, 3).map((p) => p.user.name).join(', ')}
        {activeUsers.length > 3 && ` and ${activeUsers.length - 3} more`}
      </div>
    </div>
  )
}
