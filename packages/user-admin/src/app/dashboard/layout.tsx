'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  Key, 
  CreditCard, 
  BarChart3, 
  Settings,
  FileText,
  Clock,
  HelpCircle,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/universes', label: 'Universes', icon: Globe },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/docs', label: 'API Docs', icon: FileText },
  { href: '/dashboard/activity', label: 'Activity', icon: Clock },
  { href: '/dashboard/support', label: 'Support', icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [orgName, setOrgName] = useState('Loading...');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement | null>(null);
  const profilePopoverRef = useRef<HTMLDivElement | null>(null);
  const notificationsPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch organization name
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.organization) {
          setOrgName(data.organization.name);
        }
      })
      .catch((err) => console.error('Failed to fetch org data:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        profileOpen &&
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(target) &&
        !profileButtonRef.current?.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationsOpen &&
        notificationsPopoverRef.current &&
        !notificationsPopoverRef.current.contains(target) &&
        !notificationsButtonRef.current?.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen, notificationsOpen]);

  useEffect(() => {
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="vscode-layout">
      {/* Activity Bar (Left-most vertical bar) */}
      <div className="vscode-activity-bar relative flex flex-col items-center py-4 gap-2">
        <div className="w-10 h-10 rounded-lg bg-accent-primary flex items-center justify-center text-white font-bold text-sm mb-4">
          FS
        </div>
        
        <div className="flex-1" />
        
        <button 
          ref={profileButtonRef}
          className="w-10 h-10 rounded-lg hover:bg-vscode-button transition-colors flex items-center justify-center"
          title="Profile"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotificationsOpen(false);
          }}
        >
          <User size={20} />
        </button>
        
        <button 
          ref={notificationsButtonRef}
          className="w-10 h-10 rounded-lg hover:bg-vscode-button transition-colors flex items-center justify-center relative"
          title="Notifications"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={notificationsOpen}
          onClick={() => {
            setNotificationsOpen((prev) => !prev);
            setProfileOpen(false);
          }}
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
        </button>

        {profileOpen && (
          <div
            ref={profilePopoverRef}
            className="absolute left-16 bottom-24 w-56 rounded-lg border border-vscode-border bg-vscode-editor shadow-lg"
            role="dialog"
            aria-label="Profile menu"
          >
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-vscode-text">{orgName}</p>
              <p className="text-xs text-vscode-text-tertiary">Signed in as owner</p>
              <button
                type="button"
                className="btn-secondary w-full justify-center"
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/dashboard/settings');
                }}
              >
                Open settings
              </button>
            </div>
          </div>
        )}

        {notificationsOpen && (
          <div
            ref={notificationsPopoverRef}
            className="absolute left-16 bottom-10 w-64 rounded-lg border border-vscode-border bg-vscode-editor shadow-lg"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-vscode-text">Notifications</p>
              <p className="text-xs text-vscode-text-secondary">You&apos;re all caught up. New alerts will appear here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`relative vscode-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'}`}>
        <div
          className={`h-full flex flex-col transition-opacity duration-300 ${sidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          aria-hidden={sidebarCollapsed}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-vscode-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-vscode-text text-sm">{orgName}</h2>
              <p className="text-xs text-vscode-text-tertiary">Organization</p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-vscode-button rounded transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all
                      ${isActive 
                        ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' 
                        : 'text-vscode-text-secondary hover:bg-vscode-button hover:text-vscode-text'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-vscode-border">
            <button 
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button hover:text-status-error transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={18} />
              <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {sidebarCollapsed && (
          <button
            type="button"
            aria-label="Expand sidebar"
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-6 -right-3 flex h-8 w-8 items-center justify-center rounded-full border border-vscode-border bg-vscode-editor text-vscode-text shadow outline-none transition hover:bg-vscode-button"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="vscode-editor">
        {children}
      </div>

      {/* Status Bar */}
      <div className="vscode-status-bar px-4 flex items-center justify-between text-xs text-vscode-text-tertiary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="status-dot status-dot-success" />
            Connected
          </span>
          <span>|</span>
          <span>Owner</span>
        </div>
        <div className="flex items-center gap-4">
          <span>3 universes</span>
          <span>|</span>
          <span>Free Plan</span>
        </div>
      </div>
    </div>
  );
}
