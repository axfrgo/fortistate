/**
 * Fortistate Store Definitions
 * Centralized reactive state management for user admin dashboard
 */

// Auth Store - Current user session
export interface AuthState {
  userId: string | null;
  orgId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  isAuthenticated: boolean;
}

// Team Store - Organization members and invitations
export interface TeamMember {
  id: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface TeamState {
  members: TeamMember[];
  invitations: TeamInvitation[];
  currentUserRole: 'owner' | 'admin' | 'member';
  currentUserId: string;
  loading: boolean;
  error: string | null;
}

// Notifications Store
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

// Analytics Store
export interface AnalyticsState {
  memberCount: number;
  universeCount: number;
  apiKeyCount: number;
  apiCallsLast30Days: number;
  activityTrend: Array<{ date: string; count: number }>;
  topUniverses: Array<{ name: string; apiCalls: number }>;
  loading: boolean;
  error: string | null;
}

// Activity Log Store
export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ActivityState {
  activities: ActivityItem[];
  total: number;
  filterType: string;
  loading: boolean;
  error: string | null;
}

// Settings Store
export interface OrgSettings {
  name: string;
  slug: string;
  domain: string;
  allowPublicUniverses: boolean;
  require2FA: boolean;
  sessionTimeoutMinutes: number;
  loading: boolean;
  error: string | null;
}

// UI State Store - Global UI state like sidebar, modals, etc.
export interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  showProfilePopover: boolean;
  showNotificationPopover: boolean;
}
