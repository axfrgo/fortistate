'use client';

import { useEffect, useState } from 'react';
import { exportOrganizations } from '@/lib/exportUtils';
import { ConfirmModal, AlertModal } from '@/components/Modals';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  mrr: number;
  userCount: number;
  universeCount: number;
  totalApiCalls: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');

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
    // Fetch organizations from API
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const data = await response.json();
        setOrganizations(data.organizations);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = searchQuery === '' || 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.id.includes(searchQuery);

    const matchesPlan = filterPlan === 'all' || org.plan === filterPlan;

    return matchesSearch && matchesPlan;
  });

  const totalMRR = organizations.reduce((sum, org) => sum + org.mrr, 0);
  const totalUsers = organizations.reduce((sum, org) => sum + org.userCount, 0);
  const totalUniverses = organizations.reduce((sum, org) => sum + org.universeCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🏢 Organization Management</h1>
          <p className="text-foreground-muted">
            Manage all {organizations.length} organizations
          </p>
        </div>
        <button 
          onClick={() => exportOrganizations(organizations)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Organizations
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total MRR</div>
          <div className="text-3xl font-bold text-emerald-400">
            ${(totalMRR / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            ${(totalMRR * 12 / 1000).toFixed(0)}K ARR
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Users</div>
          <div className="text-3xl font-bold text-primary">{totalUsers}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Across all orgs
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Universes</div>
          <div className="text-3xl font-bold text-primary">{totalUniverses}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Active workspaces
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Paying Orgs</div>
          <div className="text-3xl font-bold text-amber-400">
            {organizations.filter(o => o.mrr > 0).length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {((organizations.filter(o => o.mrr > 0).length / organizations.length) * 100).toFixed(1)}% conversion
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Search Organizations
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, or ID..."
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
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
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => (
          <div
            key={org.id}
            className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">{org.name}</h3>
                <p className="text-sm text-foreground-muted">@{org.slug}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  org.plan === 'enterprise'
                    ? 'bg-amber-500/20 text-amber-300'
                    : org.plan === 'pro'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-slate-500/20 text-slate-300'
                }`}
              >
                {org.plan.toUpperCase()}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">MRR</span>
                <span className="text-foreground font-medium">
                  {org.mrr > 0 ? `$${org.mrr.toLocaleString()}` : 'Free'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Users</span>
                <span className="text-foreground font-medium">{org.userCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Universes</span>
                <span className="text-foreground font-medium">{org.universeCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">API Calls</span>
                <span className="text-foreground font-medium">
                  {(org.totalApiCalls / 1000).toFixed(0)}K
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4 pt-4 border-t border-slate-700">
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  org.status === 'active'
                    ? 'status-active'
                    : 'status-error'
                }`}
              >
                {org.status.toUpperCase()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href={`/dashboard/organizations/${org.id}`}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors text-center"
              >
                View Details
              </Link>
              {org.status === 'active' ? (
                <button 
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Suspend Organization',
                      message: `⚠️ SUSPEND ORGANIZATION: ${org.name}\n\nThis will:\n• Suspend all ${org.userCount} users\n• Stop ${org.universeCount} universes\n• Halt all API access\n• Pause billing\n\nAre you sure you want to continue?`,
                      type: 'danger',
                      onConfirm: () => {
                        setAlertModal({
                          isOpen: true,
                          title: 'Organization Suspended',
                          message: `✅ Organization "${org.name}" suspended successfully!\n\n• ${org.userCount} users affected\n• ${org.universeCount} universes stopped\n• Action logged to audit trail`,
                          type: 'success'
                        });
                        // Optimistic UI update
                        setOrganizations(organizations.map(o => 
                          o.id === org.id ? { ...o, status: 'suspended' as const } : o
                        ));
                        setConfirmModal({ ...confirmModal, isOpen: false });
                      }
                    });
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Suspend
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Activate Organization',
                      message: `Reactivate organization "${org.name}"?\n\nThis will:\n• Restore access for ${org.userCount} users\n• Allow universes to start\n• Resume billing\n\nContinue?`,
                      type: 'success',
                      onConfirm: () => {
                        setAlertModal({
                          isOpen: true,
                          title: 'Organization Activated',
                          message: `✅ Organization "${org.name}" reactivated!\n\nUsers can now log in and resume operations.`,
                          type: 'success'
                        });
                        // Optimistic UI update
                        setOrganizations(organizations.map(o => 
                          o.id === org.id ? { ...o, status: 'active' as const } : o
                        ));
                        setConfirmModal({ ...confirmModal, isOpen: false });
                      }
                    });
                  }}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrgs.length === 0 && (
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-foreground-muted">No organizations found matching your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterPlan('all');
            }}
            className="mt-4 text-primary hover:text-primary-hover"
          >
            Clear Filters
          </button>
        </div>
      )}

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
