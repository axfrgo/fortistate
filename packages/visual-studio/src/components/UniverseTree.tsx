import { useState, useEffect } from 'react'
import type { Node } from 'reactflow'
import './UniverseTree.css'

interface UniverseTreeProps {
  nodes: Node[]
}

interface UniverseBranch {
  id: string
  name: string
  parent: string | null
  spawnedBy: string | null
  reason: string
  timestamp: number
  isActive: boolean
}

export default function UniverseTree({ nodes }: UniverseTreeProps) {
  const [branches, setBranches] = useState<UniverseBranch[]>([
    {
      id: 'universe-0',
      name: 'Prime Universe',
      parent: null,
      spawnedBy: null,
      reason: 'Genesis',
      timestamp: Date.now(),
      isActive: true
    }
  ])
  // @ts-expect-error - selectedBranch reserved for future branch switching logic
  const [selectedBranch, setSelectedBranch] = useState('universe-0')

  useEffect(() => {
    // Detect CEASE nodes with fork action to spawn universe branches
    const ceaseNodes = nodes.filter(n => n.type === 'cease')
    const forkNodes = ceaseNodes.filter(n => n.data.action === 'fork')

    // Generate branches from fork nodes
    const newBranches: UniverseBranch[] = [branches[0]] // Keep prime universe

    forkNodes.forEach((node, index) => {
      const branchId = `universe-fork-${node.id}`
      const existing = branches.find(b => b.id === branchId)
      
      if (!existing) {
        newBranches.push({
          id: branchId,
          name: `Fork ${index + 1}: ${node.data.entity}`,
          parent: 'universe-0',
          spawnedBy: node.id,
          reason: `Paradox: ${node.data.condition}`,
          timestamp: Date.now() + index * 100,
          isActive: false
        })
      } else {
        newBranches.push(existing)
      }
    })

    // Detect TRANSCEND nodes to create cross-universe portals
    const transcendNodes = nodes.filter(n => n.type === 'transcend')
    transcendNodes.forEach((node, index) => {
      const branchId = `universe-portal-${node.id}`
      const existing = branches.find(b => b.id === branchId)
      
      if (!existing && node.data.portal) {
        newBranches.push({
          id: branchId,
          name: node.data.portal.replace('universe:', ''),
          parent: 'universe-0',
          spawnedBy: node.id,
          reason: `Portal: ${node.data.condition || 'Always open'}`,
          timestamp: Date.now() + forkNodes.length * 100 + index * 100,
          isActive: false
        })
      } else if (existing) {
        newBranches.push(existing)
      }
    })

    if (newBranches.length > branches.length) {
      setBranches(newBranches)
    }
  }, [nodes, branches])

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranch(branchId)
    console.log(`Switched to universe: ${branchId}`)
    // Update active branch
    setBranches(prev => prev.map(b => ({
      ...b,
      isActive: b.id === branchId
    })))
  }

  return (
    <div className="universe-tree">
      <div className="universe-header">
        <span className="universe-icon">🌌</span>
        <h3>Universe Branches</h3>
        <div className="universe-count">{branches.length}</div>
      </div>

      <div className="universe-branches">
        {branches.map((branch, index) => (
          <div 
            key={branch.id}
            className={`universe-branch ${branch.isActive ? 'active' : ''} ${branch.parent ? 'child' : 'root'}`}
            onClick={() => handleSelectBranch(branch.id)}
            style={{ 
              animationDelay: `${index * 100}ms`,
              marginLeft: branch.parent ? '32px' : '0'
            }}
          >
            <div className="branch-connector">
              {branch.parent && (
                <>
                  <div className="connector-line"></div>
                  <div className="connector-node"></div>
                </>
              )}
            </div>
            <div className="branch-content">
              <div className="branch-header">
                <span className="branch-icon">
                  {branch.parent === null ? '🌍' : branch.reason.startsWith('Paradox') ? '🌀' : '🌐'}
                </span>
                <span className="branch-name">{branch.name}</span>
                {branch.isActive && <span className="active-badge">Active</span>}
              </div>
              <div className="branch-reason">{branch.reason}</div>
              {branch.spawnedBy && (
                <div className="branch-spawner">
                  Spawned by: <code>{branch.spawnedBy}</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {branches.length > 1 && (
        <div className="universe-info">
          <span className="info-icon">💡</span>
          <span>Click a universe to switch branches</span>
        </div>
      )}
    </div>
  )
}
