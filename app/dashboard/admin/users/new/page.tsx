import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserForm from '../UserForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create User',
};

export default async function CreateUserPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="fade-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/admin/users" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              User Management
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>New User</span>
          </div>
          <h1 className="page-title">Create New User</h1>
          <p className="page-subtitle">Provision a new backend account. You will configure roles after creation.</p>
        </div>
      </div>

      <div className="card">
        <UserForm />
      </div>
    </div>
  );
}
