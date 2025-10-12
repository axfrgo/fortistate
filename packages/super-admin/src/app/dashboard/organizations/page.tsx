'use client';

import { useEffect, useState } from 'react';
import { exportOrganizations } from '@/lib/exportUtils';
import { ConfirmModal, AlertModal } from '@/components/Modals';
import Link from 'next/link';
import { Plus, Shield, ShieldCheck, Users } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  hasEnterpriseAccess: boolean;
  orgAdminEmail: string | null;
  orgAdminId: string | null;
  mrr: number;
  userCount: number;
  universeCount: number;
  totalApiCalls: number;
  createdAt: string;
  enterpriseAccessGrantedAt: string | null;
  enterpriseAccessGrantedBy: string | null;
}

interface CreateOrgForm {
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  orgAdminEmail: string;
  grantEnterpriseAccess: boolean;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState<CreateOrgForm>({
    name: '',
    slug: '',
    plan: 'free',
    orgAdminEmail: '',
    grantEnterpriseAccess: false,
  });

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
    fetchOrganizations();
  }, []);

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
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to fetch organizations. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      const data = await response.json();
      
      setAlertModal({
        isOpen: true,
        title: 'Organization Created!',
        message: `✅ Organization "${createForm.name}" created successfully!\n\n${
          createForm.grantEnterpriseAccess
            ? '🎉 Enterprise access granted - org admin can now access User Admin panel'
            : '📧 Invitation sent to ' + createForm.orgAdminEmail
        }`,
        type: 'success',
      });

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        slug: '',
        plan: 'free',
        orgAdminEmail: '',
        grantEnterpriseAccess: false,
      });

      // Refresh organizations list
      fetchOrganizations();
    } catch (error: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `Failed to create organization: ${error.message}`,
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleGrantEnterpriseAccess(org: Organization) {
    setConfirmModal({
      isOpen: true,
      title: 'Grant Enterprise Access',
      message: `Grant User Admin panel access to "${org.name}"?\n\nThis will:\n✅ Enable team management features\n✅ Allow org admin to manage users\n✅ Provide advanced analytics\n✅ Enable enterprise features\n\nContinue?`,
      type: 'success',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organizations/${org.id}/grant-enterprise`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to grant enterprise access');
          }

          setAlertModal({
            isOpen: true,
            title: 'Enterprise Access Granted!',
            message: `✅ "${org.name}" now has access to User Admin panel!\n\nOrg admin (${org.orgAdminEmail}) has been notified.`,
            type: 'success',
          });

          // Refresh organizations
          fetchOrganizations();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to grant enterprise access. Please try again.',
            type: 'error',
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  }

  async function handleRevokeEnterpriseAccess(org: Organization) {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Enterprise Access',
      message: `⚠️ Revoke User Admin access from "${org.name}"?\n\nThis will:\n❌ Disable User Admin panel\n❌ Remove team management\n❌ Org admin will lose access\n\nContinue?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organizations/${org.id}/revoke-enterprise`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to revoke enterprise access');
          }

          setAlertModal({
            isOpen: true,
            title: 'Enterprise Access Revoked',
            message: `✅ User Admin access revoked from "${org.name}".\n\nOrg admin has been notified.`,
            type: 'success',
          });

          // Refresh organizations
          fetchOrganizations();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to revoke enterprise access. Please try again.',
            type: 'error',
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  }

  async function handleSuspendOrganization(org: Organization) {
    setConfirmModal({
      isOpen: true,
      title: 'Suspend Organization',
      message: `⚠️ SUSPEND ORGANIZATION: ${org.name}\n\nThis will:\n• Suspend all ${org.userCount} users\n• Stop ${org.universeCount} universes\n• Halt all API access\n• Pause billing\n\nAre you sure you want to continue?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organizations/${org.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'suspended' }),
          });

          if (!response.ok) {
            throw new Error('Failed to suspend organization');
          }

          setAlertModal({
            isOpen: true,
            title: 'Organization Suspended',
            message: `✅ Organization "${org.name}" suspended successfully!\n\n• ${org.userCount} users affected\n• ${org.universeCount} universes stopped\n• Action logged to audit trail`,
            type: 'success',
          });

          // Refresh organizations
          fetchOrganizations();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to suspend organization. Please try again.',
            type: 'error',
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  }

  async function handleActivateOrganization(org: Organization) {
    setConfirmModal({
      isOpen: true,
      title: 'Activate Organization',
      message: `Reactivate organization "${org.name}"?\n\nThis will:\n• Restore access for ${org.userCount} users\n• Allow universes to start\n• Resume billing\n\nContinue?`,
      type: 'success',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organizations/${org.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' }),
          });

          if (!response.ok) {
            throw new Error('Failed to activate organization');
          }

          setAlertModal({
            isOpen: true,
            title: 'Organization Activated',
            message: `✅ Organization "${org.name}" reactivated!\n\nUsers can now log in and resume operations.`,
            type: 'success',
          });

          // Refresh organizations
          fetchOrganizations();
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to activate organization. Please try again.',
            type: 'error',
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  }

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
  const enterpriseOrgs = organizations.filter(o => o.hasEnterpriseAccess).length;

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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
          <button 
            onClick={() => exportOrganizations(organizations)}
            className="px-4 py-2 bg-background-secondary hover:bg-slate-700 text-foreground border border-slate-600 rounded-lg transition-colors"
          >
            Export
          </button>
        </div>
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
          <div className="text-sm text-foreground-muted mb-2 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Access</span>
          </div>
          <div className="text-3xl font-bold text-amber-400">
            {enterpriseOrgs}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {((enterpriseOrgs / organizations.length) * 100).toFixed(1)}% of orgs
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
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">{org.name}</h3>
                  {org.hasEnterpriseAccess && (
                    <span title="Enterprise Access Granted">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-muted">@{org.slug}</p>
                {org.orgAdminEmail && (
                  <p className="text-xs text-foreground-muted mt-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    {org.orgAdminEmail}
                  </p>
                )}
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
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    org.status === 'active'
                      ? 'status-active'
                      : 'status-error'
                  }`}
                >
                  {org.status.toUpperCase()}
                </span>
                {org.hasEnterpriseAccess && (
                  <span className="text-xs text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>User Admin</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/organizations/${org.id}`}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors text-center"
                >
                  View Details
                </Link>
                {org.status === 'active' ? (
                  <button 
                    onClick={() => handleSuspendOrganization(org)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    Suspend
                  </button>
                ) : (
                  <button 
                    onClick={() => handleActivateOrganization(org)}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    Activate
                  </button>
                )}
              </div>
              
              {/* Enterprise Access Button */}
              {org.hasEnterpriseAccess ? (
                <button
                  onClick={() => handleRevokeEnterpriseAccess(org)}
                  className="w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 hover:text-amber-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Revoke User Admin</span>
                </button>
              ) : (
                <button
                  onClick={() => handleGrantEnterpriseAccess(org)}
                  className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant User Admin</span>
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

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-slate-700 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Create Organization</h2>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Acme Corp"
                  required
                  className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Slug * <span className="text-xs text-foreground-muted">(URL-friendly identifier)</span>
                </label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="acme-corp"
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Plan *
                </label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as any })}
                  className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Organization Admin Email *
                </label>
                <input
                  type="email"
                  value={createForm.orgAdminEmail}
                  onChange={(e) => setCreateForm({ ...createForm, orgAdminEmail: e.target.value })}
                  placeholder="admin@acmecorp.com"
                  required
                  className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  This user will be assigned the org_admin role
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <input
                  type="checkbox"
                  id="grantEnterprise"
                  checked={createForm.grantEnterpriseAccess}
                  onChange={(e) => setCreateForm({ ...createForm, grantEnterpriseAccess: e.target.checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="grantEnterprise" className="text-sm font-medium text-foreground cursor-pointer flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Grant User Admin Panel Access</span>
                  </label>
                  <p className="text-xs text-foreground-muted mt-1">
                    Enable enterprise features and User Admin panel for this organization
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Organization'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      name: '',
                      slug: '',
                      plan: 'free',
                      orgAdminEmail: '',
                      grantEnterpriseAccess: false,
                    });
                  }}
                  className="px-4 py-2 bg-background-secondary hover:bg-slate-700 text-foreground border border-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
