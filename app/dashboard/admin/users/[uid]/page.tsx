import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUser } from '@/services/admin.service';
import { getAllCompanies } from '@/services/company.service';
import RolesForm from '../RolesForm';
import UserActions from './UserActions';
import Link from 'next/link';
import type { Metadata } from 'next';

interface UserDetailPageProps {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const { uid } = await params;
  return {
    title: `User Details ${uid.substring(0, 8)}`,
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    redirect('/dashboard');
  }

  const { uid } = await params;
  let user;
  let companies = [];

  try {
    user = await getUser(uid);
    companies = await getAllCompanies();
  } catch (error) {
    redirect('/dashboard/admin/users');
  }

  const nameInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?');

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/admin/users" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              User Management
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>{user.displayName || 'User Details'}</span>
          </div>
          <h1 className="page-title">{user.displayName || 'User Profile'}</h1>
          <p className="page-subtitle">Review user details, access metadata, update custom claims, and manage account status.</p>
        </div>
        <div className="page-actions">
          <Link href={`/dashboard/admin/users/${uid}/edit`} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Main Grid: Details Left, Photo & Roles Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Left: General Details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Account Information</h2>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>DISPLAY NAME</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{user.displayName || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>EMAIL ADDRESS</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                  {user.email}
                  {user.emailVerified ? (
                    <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Verified</span>
                  ) : (
                    <span className="badge badge-default" style={{ marginLeft: '0.5rem' }}>Not Verified</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>PHONE NUMBER</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{user.phoneNumber || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>ACCOUNT STATUS</span>
                <p style={{ marginTop: '0.25rem' }}>
                  <span className={`badge ${user.disabled ? 'badge-danger' : 'badge-success'}`}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </span>
                </p>
              </div>

              <hr className="divider" style={{ margin: '0.5rem 0' }} />

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>ACCOUNT CREATED</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                  {user.creationTime ? new Date(user.creationTime).toLocaleString() : '—'}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>LAST SIGN IN</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                  {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'Never signed in'}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>LAST METADATA REFRESH</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                  {user.lastRefreshTime ? new Date(user.lastRefreshTime).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Photo, Status Actions & Roles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Profile Photo & Actions Box */}
            <div className="card flex flex-col items-center gap-4" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  background: 'var(--bg-deep)',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--accent)' }} aria-hidden>
                    {nameInitial}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{user.displayName}</h3>
                <span className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>UID: {user.uid}</span>
              </div>

              <hr className="divider" style={{ width: '100%', margin: '0.5rem 0' }} />

              {/* Status Action Buttons */}
              <div style={{ width: '100%' }}>
                <UserActions user={user} />
              </div>
            </div>

            {/* Roles Assignment Card */}
            <div className="card">
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Roles & Claims</h2>
              </div>
              <RolesForm user={user} companies={companies} />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
