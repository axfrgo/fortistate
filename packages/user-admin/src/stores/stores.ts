/**
 * Initialize Fortistate stores for the admin dashboard
 * Import these stores in your components and use with useStore hook
 */

// Import only what we need to avoid Node.js dependencies in browser
import { StoreFactory } from 'fortistate/storeFactory';
import type {
  AuthState,
  TeamState,
  NotificationsState,
  AnalyticsState,
  ActivityState,
  OrgSettings,
  UIState,
} from './index';

// Use the global store factory
const globalStoreFactory = new StoreFactory();

// Helper to create stores
function createStore<T>(key: string, initialValue: T) {
  return globalStoreFactory.create(key, { value: initialValue });
}

// Auth Store
export const authStore = createStore<AuthState>('auth', {
  userId: null,
  orgId: null,
  firstName: '',
  lastName: '',
  email: '',
  role: 'member',
  isAuthenticated: false,
});

// Team Store
export const teamStore = createStore<TeamState>('team', {
  members: [],
  invitations: [],
  currentUserRole: 'member',
  currentUserId: '',
  loading: false,
  error: null,
});

// Notifications Store
export const notificationsStore = createStore<NotificationsState>('notifications', {
  items: [],
  unreadCount: 0,
});

// Analytics Store
export const analyticsStore = createStore<AnalyticsState>('analytics', {
  memberCount: 0,
  universeCount: 0,
  apiKeyCount: 0,
  apiCallsLast30Days: 0,
  activityTrend: [],
  topUniverses: [],
  loading: false,
  error: null,
});

// Activity Log Store
export const activityStore = createStore<ActivityState>('activity', {
  activities: [],
  total: 0,
  filterType: 'all',
  loading: false,
  error: null,
});

// Settings Store
export const settingsStore = createStore<OrgSettings>('settings', {
  name: '',
  slug: '',
  domain: '',
  allowPublicUniverses: false,
  require2FA: false,
  sessionTimeoutMinutes: 30,
  loading: false,
  error: null,
});

// UI State Store
export const uiStore = createStore<UIState>('ui', {
  sidebarCollapsed: false,
  activeModal: null,
  showProfilePopover: false,
  showNotificationPopover: false,
});

// Export all stores
export const stores = {
  auth: authStore,
  team: teamStore,
  notifications: notificationsStore,
  analytics: analyticsStore,
  activity: activityStore,
  settings: settingsStore,
  ui: uiStore,
};

// VS Access store has been removed (no longer needed)
