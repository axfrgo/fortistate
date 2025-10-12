'use client';

import { useState } from 'react';
import StoreDemo from '@/components/StoreDemo';
import SessionManager from '@/components/SessionManager';
import PresenceViewer from '@/components/PresenceViewer';
import AuditLogViewer from '@/components/AuditLogViewer';
import SpaceShooterGame from '@/components/SpaceShooterGame';
import { getInspectorDisplayHost } from '@/utils/inspector';

export default function Home() {
  const [activeSection, setActiveSection] = useState('overview');

  const inspectorDisplay = getInspectorDisplayHost();

  const sections = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'game', label: '🎮 Game Demo', icon: '🎮' },
    { id: 'stores', label: '🗄️ Stores', icon: '🗄️' },
    { id: 'sessions', label: '🔐 Sessions', icon: '🔐' },
    { id: 'presence', label: '👥 Presence', icon: '👥' },
    { id: 'audit', label: '📝 Audit', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fortistate Demo</h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive demo of all Fortistate features (Epics 1-5)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Inspector:</div>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{inspectorDisplay}</code>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to Fortistate Demo</h2>
              <p className="text-gray-700 mb-4">
                This comprehensive demo showcases all features delivered across 5 strategic epics,
                transforming Fortistate into a production-ready collaborative state management platform.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Epic Cards */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎮</div>
                    <div>
                      <h3 className="font-bold mb-1">Game Demo: Ontogenetic Laws</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Space shooter with 10 ontogenetic laws governing game state, auto-fix, and inspector integration
                      </p>
                      <button
                        onClick={() => setActiveSection('game')}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Play Game →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔐</div>
                    <div>
                      <h3 className="font-bold mb-1">Epics 1-3: Authentication & DX</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Unified auth system, role-based access control, and CLI session management
                      </p>
                      <button
                        onClick={() => setActiveSection('sessions')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Explore Sessions →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📝</div>
                    <div>
                      <h3 className="font-bold mb-1">Epic 4: Audit Logging</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Log rotation, multiple export formats (JSON/CSV/plain), compliance-ready
                      </p>
                      <button
                        onClick={() => setActiveSection('audit')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Audit Logs →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👥</div>
                    <div>
                      <h3 className="font-bold mb-1">Epic 5: Collaboration</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Real-time presence tracking, WebSocket protocol, multi-user debugging
                      </p>
                      <button
                        onClick={() => setActiveSection('presence')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        See Presence →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🗄️</div>
                    <div>
                      <h3 className="font-bold mb-1">Core: State Management</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Reactive stores, nested objects, arrays, type safety, real-time updates
                      </p>
                      <button
                        onClick={() => setActiveSection('stores')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Try Stores →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3">🚀 Quick Start</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Start the Fortistate inspector: <code className="bg-blue-100 px-2 py-0.5 rounded">npm run inspect</code></li>
                <li>2. Create a session in the <strong>Sessions</strong> tab (choose admin role for full access)</li>
                <li>3. Open the <strong>Presence</strong> tab to see real-time collaboration</li>
                <li>4. Try the <strong>Stores</strong> tab to interact with state</li>
                <li>5. View the <strong>Audit</strong> tab to see logged actions</li>
              </ol>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">✨ Key Features</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">✓ Production Ready</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 107 tests passing</li>
                    <li>• Zero breaking changes</li>
                    <li>• Full TypeScript support</li>
                    <li>• Comprehensive docs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-blue-600">✓ Security</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Session-based auth</li>
                    <li>• Role hierarchy (observer/editor/admin)</li>
                    <li>• Token revocation</li>
                    <li>• Complete audit trail</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-purple-600">✓ Collaboration</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real-time presence</li>
                    <li>• WebSocket protocol</li>
                    <li>• Multi-user debugging</li>
                    <li>• Cursor tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Demo Section */}
        {activeSection === 'game' && <SpaceShooterGame />}

        {/* Store Demo Section */}
        {activeSection === 'stores' && <StoreDemo />}

        {/* Session Management Section */}
        {activeSection === 'sessions' && <SessionManager />}

        {/* Presence Section */}
        {activeSection === 'presence' && <PresenceViewer />}

        {/* Audit Section */}
        {activeSection === 'audit' && <AuditLogViewer />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>
              Fortistate v1.0.3 • Epics 1-5 Complete •{' '}
              <a
                href="../docs/EPIC_1-5_REVIEW.md"
                className="text-blue-600 hover:text-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Documentation
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
