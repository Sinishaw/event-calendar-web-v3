import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUser } from '@/services/admin.service';
import UserForm from '../../UserForm';
import Link from 'next/link';
import type { Metadata } from 'next';

interface EditUserPageProps {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
  const { uid } = await params;
  return {
    title: `Edit User ${uid.substring(0, 8)}`,
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    redirect('/dashboard');
  }

  const { uid } = await params;
  let user;
  try {
    user = await getUser(uid);
  } catch (error) {
    redirect('/dashboard/admin/users');
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
            <Link href={`/dashboard/admin/users/${uid}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user.displayName || 'User Details'}
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Edit</span>
          </div>
          <h1 className="page-title">Edit User Profile</h1>
          <p className="page-subtitle">Update display name, contact info, photo, or status for this account.</p>
        </div>
      </div>

      <div className="card">
        <UserForm user={user} />
      </div>
    </div>
  );
}
