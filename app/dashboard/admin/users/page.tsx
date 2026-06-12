import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllUsers } from '@/services/admin.service';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management',
};

export default async function UserManagementPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    return (
      <div className="alert alert-danger mb-4" role="alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
        </svg>
        Access Denied. Only system administrators can access user management.
      </div>
    );
  }

  const users = await getAllUsers();

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage backend users, companies assignment, and access control list roles.</p>
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

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Assigned Company</th>
                <th>Roles</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userRoles: string[] = [];
                if (user.admin) userRoles.push('Admin');
                if (user.publisher) userRoles.push('Publisher');
                if (user.creater) userRoles.push('Creator');

                const nameInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?');

                return (
                  <tr key={user.uid}>
                    <td>
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="avatar"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="avatar" aria-hidden>{nameInitial}</div>
                        )}
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                            {user.displayName || 'No Display Name'}
                          </div>
                          <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                            UID: {user.uid.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{user.email}</span>
                      {user.emailVerified && (
                        <span className="badge badge-success" style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                          Verified
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-default">{user.company || 'Not Assigned'}</span>
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        {userRoles.map((role) => (
                          <span key={role} className={`badge ${role === 'Admin' ? 'badge-danger' : role === 'Publisher' ? 'badge-info' : 'badge-accent'}`}>
                            {role}
                          </span>
                        ))}
                        {userRoles.length === 0 && <span className="text-xs text-faint">No Roles</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.disabled ? 'badge-danger' : 'badge-success'}`}>
                        {user.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <Link href={`/dashboard/admin/users/${user.uid}`} className="btn btn-ghost btn-sm" title="View details">
                          View
                        </Link>
                        <Link href={`/dashboard/admin/users/${user.uid}/edit`} className="btn btn-secondary btn-sm" title="Edit user">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="text-muted mb-2">No users found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
