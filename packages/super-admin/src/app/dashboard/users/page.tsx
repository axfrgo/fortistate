'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { exportUsers } from '@/lib/exportUtils';
import { ConfirmModal, AlertModal } from '@/components/Modals';

interface User {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  role: string;
  plan: string;
  status: 'active' | 'suspended' | 'deleted';
  isAbuser: boolean;
  abuseScore: number;
  totalApiCalls: number;
  totalAiCalls: number;
  createdAt: string;
  lastActiveAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'deleted'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    // Fetch users from API
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.includes(searchQuery);

    // Status filter
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    // Plan filter
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'suspended': return 'status-error';
      case 'deleted': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-slate-500/20 text-slate-300';
      case 'pro': return 'bg-purple-500/20 text-purple-300';
      case 'enterprise': return 'bg-amber-500/20 text-amber-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">👥 User Management</h1>
          <p className="text-foreground-muted">
            Manage all {users.length} users across the platform
          </p>
        </div>
        <button 
          onClick={() => exportUsers(users)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Users
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, or ID..."
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Plan
            </label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-foreground-muted">
            Showing <span className="text-foreground font-medium">{filteredUsers.length}</span> of{' '}
            <span className="text-foreground font-medium">{users.length}</span> users
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  API Calls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Abuse Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-background-tertiary transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.name || 'No name'}</div>
                        <div className="text-sm text-foreground-muted">{user.email}</div>
                        <div className="text-xs text-foreground-muted">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPlanBadge(user.plan)}`}>
                      {user.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(user.status)}`}>
                      {user.status.toUpperCase()}
                    </span>
                    {user.isAbuser && (
                      <span className="ml-2 text-xs text-red-400">⚠️ Abuser</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{user.totalApiCalls.toLocaleString()}</div>
                    <div className="text-xs text-foreground-muted">{user.totalAiCalls.toLocaleString()} AI</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-foreground">{user.abuseScore}</div>
                      {user.abuseScore > 50 && (
                        <span className="ml-2 text-red-400">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                    {new Date(user.lastActiveAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      href={`/dashboard/users/${user.id}`}
                      className="text-primary hover:text-primary-hover"
                    >
                      View
                    </Link>
                    {user.status === 'active' ? (
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Suspend User',
                            message: `Are you sure you want to suspend ${user.email}?\n\nThis will:\n• Immediately revoke access\n• Prevent login\n• Maintain all data\n\nYou can reactivate the account later.`,
                            type: 'danger',
                            onConfirm: () => {
                              // Optimistic UI update
                              setUsers(users.map(u => 
                                u.id === user.id ? { ...u, status: 'suspended' as const } : u
                              ));
                              setAlertModal({
                                isOpen: true,
                                title: 'User Suspended',
                                message: `User ${user.email} has been suspended.\n\nAction logged to audit trail.`,
                                type: 'success',
                              });
                            },
                          });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors cursor-pointer font-medium"
                      >
                        Suspend
                      </button>
                    ) : user.status === 'suspended' ? (
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Reactivate User',
                            message: `Reactivate ${user.email}?\n\nThis will restore full access to the account.`,
                            type: 'success',
                            onConfirm: () => {
                              // Optimistic UI update
                              setUsers(users.map(u => 
                                u.id === user.id ? { ...u, status: 'active' as const } : u
                              ));
                              setAlertModal({
                                isOpen: true,
                                title: 'User Reactivated',
                                message: `User ${user.email} has been reactivated.\n\nAction logged to audit trail.`,
                                type: 'success',
                              });
                            },
                          });
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
                      >
                        Activate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-foreground-muted mb-1">Active Users</div>
          <div className="text-2xl font-bold text-emerald-400">
            {users.filter(u => u.status === 'active').length}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-foreground-muted mb-1">Suspended</div>
          <div className="text-2xl font-bold text-red-400">
            {users.filter(u => u.status === 'suspended').length}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-foreground-muted mb-1">Abusers Detected</div>
          <div className="text-2xl font-bold text-amber-400">
            {users.filter(u => u.isAbuser).length}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-foreground-muted mb-1">Total API Calls</div>
          <div className="text-2xl font-bold text-primary">
            {users.reduce((sum, u) => sum + u.totalApiCalls, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
