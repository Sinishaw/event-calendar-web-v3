import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllUsers } from '@/services/admin.service';
import Link from 'next/link';
import type { Metadata } from 'next';
import UsersList from './UsersList';

export const metadata: Metadata = {
  title: 'User Management | Calendar Platform',
};

export default async function UserManagementPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isSuperAdmin) redirect('/dashboard');

  const allUsers = await getAllUsers();

  // Super Admins see everyone; Tenant Admins see only their company's users
  const visibleUsers = roles.isSuperAdmin
    ? allUsers
    : allUsers.filter((u) => u.company === roles.company);

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {roles.isSuperAdmin
              ? 'Manage all backend users across all companies, assign roles, and control access.'
              : `Manage users within your company (${roles.company ?? 'tenant'}).`}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/admin/users/new" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New User
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users', value: visibleUsers.length, color: 'var(--accent)' },
          { label: 'Active', value: visibleUsers.filter((u) => !u.disabled).length, color: '#22c55e' },
          { label: 'Disabled', value: visibleUsers.filter((u) => u.disabled).length, color: 'var(--danger)' },
          ...(roles.isSuperAdmin ? [{ label: 'Super Admins', value: visibleUsers.filter((u) => u.superAdmin).length, color: '#f59e0b' }] : []),
          { label: 'Admins', value: visibleUsers.filter((u) => u.admin && !u.superAdmin).length, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="card"
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card">
        <UsersList users={visibleUsers} actorIsSuperAdmin={roles.isSuperAdmin} />
      </div>
    </div>
  );
}
