'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { name: 'Global Overview', href: '/dashboard', icon: '🌐' },
  { name: 'Users', href: '/dashboard/users', icon: '👥' },
  { name: 'Organizations', href: '/dashboard/organizations', icon: '🏢' },
  { name: 'Universes', href: '/dashboard/universes', icon: '🌌' },
  { name: 'Security', href: '/dashboard/security', icon: '🛡️' },
  { name: 'Revenue', href: '/dashboard/revenue', icon: '💰' },
  { name: 'AI Usage', href: '/dashboard/ai-usage', icon: '🤖' },
  { name: 'Feature Flags', href: '/dashboard/feature-flags', icon: '🚩' },
  { name: 'System Health', href: '/dashboard/health', icon: '❤️' },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: '📋' },
  { name: 'Deployments', href: '/dashboard/deployments', icon: '🚀' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background-secondary border-b border-slate-700 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-primary">🔐 FortiState Super Admin</h1>
              <p className="text-xs text-foreground-muted">Platform Management Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">LIVE</span>
            </div>

            {/* Admin Info */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-background-tertiary rounded-lg">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
                SA
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Super Admin</p>
                <p className="text-xs text-foreground-muted">admin@fortistate.io</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-background-secondary border-r border-slate-700 transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-medium'
                    : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-slate-700">
          <div className="text-xs text-foreground-muted space-y-1">
            <p className="font-semibold">Security Status</p>
            <div className="flex items-center justify-between">
              <span>IP Whitelist</span>
              <span className="text-emerald-400">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Session</span>
              <span className="text-emerald-400">✓ Valid</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-0'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
