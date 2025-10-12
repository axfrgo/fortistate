'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useStore from 'fortistate/useStore';
import { teamStore, uiStore } from '@/stores/stores';
import { UserPlus, Mail, Trash2, RefreshCw, UsersRound } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
} as const;

type Role = keyof typeof roleLabels;

type TeamMember = {
  id: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type TeamInvitation = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type TeamResponse = {
  currentUserRole: Role;
  currentUserId: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
};

const roleOptions: Role[] = ['owner', 'admin', 'member'];

function roleBadgeClass(role: Role) {
  switch (role) {
    case 'owner':
      return 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30';
    case 'admin':
      return 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/30';
    default:
      return 'bg-vscode-button text-vscode-text-secondary border border-vscode-border';
  }
}

export default function TeamPage() {
  const [teamState, teamUtils] = useStore(teamStore);
  const [uiState, uiUtils] = useStore(uiStore);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' as Role });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [cancelingInvitationId, setCancelingInvitationId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      teamUtils.set({ ...teamState, value: { ...teamState.value, loading: true, error: null } });

      const response = await fetch('/api/team');
      const body = await response.json().catch(() => ({ error: 'Failed to load team data' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load team data');
      }

      const data = body as TeamResponse;
      teamUtils.set({
        value: {
          members: data.members,
          invitations: data.invitations,
          currentUserRole: data.currentUserRole,
          currentUserId: data.currentUserId,
          loading: false,
          error: null,
        },
      });
    } catch (err) {
      teamUtils.set({
        ...teamState,
        value: {
          ...teamState.value,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load team data',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchTeam();
  }, [fetchTeam]);

  const { members, invitations, currentUserRole, currentUserId, loading, error } = teamState?.value || {
    members: [],
    invitations: [],
    currentUserRole: 'member' as Role,
    currentUserId: '',
    loading: false,
    error: null,
  };

  const { activeModal } = uiState?.value || { activeModal: null };

  const canManage = useMemo(
    () => currentUserRole === 'owner' || currentUserRole === 'admin',
    [currentUserRole],
  );

  const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      setInviteSubmitting(true);
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || 'Failed to send invitation');
      }

      setFeedback('Invitation sent successfully.');
      uiUtils.set({ ...uiState, value: { ...uiState.value, activeModal: null } });
      await fetchTeam();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    if (memberId === currentUserId) return;

    try {
      setUpdatingMemberId(memberId);
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to update role' }));
        throw new Error(body.error || 'Failed to update role');
      }

      await fetchTeam();
    } catch (err) {
      console.error('Update role error:', err);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === currentUserId) return;

    try {
      setRemovingMemberId(memberId);
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to remove member' }));
        throw new Error(body.error || 'Failed to remove member');
      }

      await fetchTeam();
    } catch (err) {
      console.error('Remove member error:', err);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setCancelingInvitationId(invitationId);
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to cancel invitation' }));
        throw new Error(body.error || 'Failed to cancel invitation');
      }

      await fetchTeam();
    } catch (err) {
      console.error('Cancel invitation error:', err);
    } finally {
      setCancelingInvitationId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <UsersRound className="w-10 h-10 animate-pulse text-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void fetchTeam()}
            className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const owners = members.filter((member: TeamMember) => member.role === 'owner').length;
  const inviteModalOpen = activeModal === 'invite-member';
  const setInviteModalOpen = (open: boolean) => {
    uiUtils.set({ ...uiState, value: { ...uiState.value, activeModal: open ? 'invite-member' : null } });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vscode-text mb-2">Team</h1>
          <p className="text-vscode-text-secondary">
            Manage members, invites, and roles for your organization.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </button>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold text-vscode-text mb-4">Team Members ({members.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vscode-border">
                <th className="text-left py-3 px-4 text-vscode-text">Name</th>
                <th className="text-left py-3 px-4 text-vscode-text">Email</th>
                <th className="text-left py-3 px-4 text-vscode-text">Role</th>
                <th className="text-left py-3 px-4 text-vscode-text">Joined</th>
                {canManage && <th className="text-right py-3 px-4 text-vscode-text">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member: TeamMember) => {
                const isSelf = member.user.id === currentUserId;
                const isUpdating = updatingMemberId === member.id;
                const isRemoving = removingMemberId === member.id;

                return (
                  <tr key={member.id} className="border-b border-vscode-border/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {member.user.firstName} {member.user.lastName}
                        {isSelf && (
                          <span className="text-xs text-accent-primary font-medium">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-vscode-text-secondary">{member.user.email}</td>
                    <td className="py-3 px-4">
                      {canManage && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value as Role)}
                          disabled={isUpdating || (member.role === 'owner' && owners <= 1)}
                          className="input-field py-1"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role} disabled={role === 'owner' && member.role !== 'owner'}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={clsx('px-3 py-1 rounded-full text-sm', roleBadgeClass(member.role))}>
                          {roleLabels[member.role]}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-vscode-text-secondary">
                      {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={isRemoving || (member.role === 'owner' && owners <= 1)}
                            className="btn-secondary text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                          >
                            {isRemoving ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {invitations.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-vscode-text mb-4">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="card space-y-3">
            {invitations.map((invitation: TeamInvitation) => {
              const isCanceling = cancelingInvitationId === invitation.id;

              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-vscode-sidebar rounded border border-vscode-border"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-vscode-text-secondary" />
                    <div>
                      <p className="font-medium text-vscode-text">{invitation.email}</p>
                      <p className="text-sm text-vscode-text-secondary">
                        Invited as {roleLabels[invitation.role]} •{' '}
                        {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isCanceling}
                      className="btn-secondary text-red-400 hover:bg-red-400/10"
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold text-vscode-text mb-4">Invite Team Member</h2>

            {feedback && (
              <div
                className={clsx(
                  'mb-4 p-3 rounded',
                  feedback.includes('success')
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400',
                )}
              >
                {feedback}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-vscode-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-vscode-text mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as Role })}
                  className="input-field"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={inviteSubmitting} className="btn-primary flex-1">
                  {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
