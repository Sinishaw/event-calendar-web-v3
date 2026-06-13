'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/types/user';

const ROLE_FILTERS = ['All', 'Super Admin', 'Admin', 'Creator', 'Publisher', 'No Role'] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

interface UsersListProps {
  users: UserProfile[];
  actorIsSuperAdmin: boolean;
}

export default function UsersList({ users, actorIsSuperAdmin }: UsersListProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled'>('All');

  const filtered = users.filter((u) => {
    // Search: name, email, uid, company
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.displayName ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      (u.company ?? '').toLowerCase().includes(q);

    // Role filter
    let matchesRole = true;
    if (roleFilter === 'Super Admin') matchesRole = u.superAdmin;
    else if (roleFilter === 'Admin') matchesRole = u.admin && !u.superAdmin;
    else if (roleFilter === 'Creator') matchesRole = u.creater && !u.superAdmin;
    else if (roleFilter === 'Publisher') matchesRole = u.publisher && !u.superAdmin;
    else if (roleFilter === 'No Role') matchesRole = !u.superAdmin && !u.admin && !u.creater && !u.publisher;

    // Status filter
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && !u.disabled) ||
      (statusFilter === 'Disabled' && u.disabled);

    return matchesSearch && matchesRole && matchesStatus;
  });

  function getRoleBadges(user: UserProfile) {
    if (user.superAdmin) return [{ label: 'Super Admin', cls: 'badge-danger' }];
    const badges = [];
    if (user.admin) badges.push({ label: 'Admin', cls: 'badge-warning' });
    if (user.creater) badges.push({ label: 'Creator', cls: 'badge-accent' });
    if (user.publisher) badges.push({ label: 'Publisher', cls: 'badge-info' });
    return badges;
  }

  function getInitial(user: UserProfile) {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return '?';
  }

  return (
    <div>
      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <svg
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="users-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, UID, company…"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
          />
        </div>

        {/* Status Filter */}
        <select
          id="users-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ flex: '0 0 140px' }}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
        </select>
      </div>

      {/* Role Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ROLE_FILTERS.map((role) => {
          const isActive = roleFilter === role;
          // Hide Super Admin chip for non-super-admin actors
          if (role === 'Super Admin' && !actorIsSuperAdmin) return null;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              type="button"
              style={{
                padding: '0.3rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 500,
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
                background: isActive ? 'var(--accent)' : 'var(--bg-deep)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {role}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ marginBottom: '1rem' }}>
        <span className="text-xs text-muted">
          Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              {actorIsSuperAdmin && <th>Company</th>}
              <th>Roles</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const badges = getRoleBadges(user);
              return (
                <tr key={user.uid}>
                  {/* User */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: user.photoURL ? 'transparent' : 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                          overflow: 'hidden', flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              // hide image on error and let the parent show the initials
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          getInitial(user)
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                          {user.displayName || 'No Name'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                          {user.uid.substring(0, 10)}…
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td>
                    <span style={{ fontSize: '0.875rem' }}>{user.email}</span>
                    {user.emailVerified && (
                      <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        Verified
                      </span>
                    )}
                  </td>

                  {/* Company — only for super admins */}
                  {actorIsSuperAdmin && (
                    <td>
                      <span className="badge badge-default">{user.company || 'Not Assigned'}</span>
                    </td>
                  )}

                  {/* Roles */}
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {badges.map((b) => (
                        <span key={b.label} className={`badge ${b.cls}`}>{b.label}</span>
                      ))}
                      {badges.length === 0 && <span className="text-xs text-faint">No Roles</span>}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge ${user.disabled ? 'badge-danger' : 'badge-success'}`}>
                      {user.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                      <Link href={`/dashboard/admin/users/${user.uid}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                      <Link href={`/dashboard/admin/users/${user.uid}/edit`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={actorIsSuperAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>
                    {search || roleFilter !== 'All' || statusFilter !== 'All'
                      ? 'No users match your filters'
                      : 'No users found'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
