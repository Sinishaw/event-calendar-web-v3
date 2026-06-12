import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CompanyForm from '../CompanyForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Company',
};

export default async function AddCompanyPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isCreater) {
    redirect('/dashboard/company');
  }

  return (
    <div className="fade-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/company" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Companies
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>New Company</span>
          </div>
          <h1 className="page-title">Add New Company</h1>
          <p className="page-subtitle">Register a new tenant company on the platform and set up its general profile.</p>
        </div>
      </div>

      <div className="card">
        <CompanyForm />
      </div>
    </div>
  );
}
