import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompany } from '@/services/company.service';
import CompanyForm from '../../CompanyForm';
import Link from 'next/link';
import type { Metadata } from 'next';

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditCompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Company ${id.toUpperCase()}`,
  };
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;
  const roles = getRoles(session);

  // Authorization: admin or creator associated with this company
  if (!roles.isAdmin && (!roles.isCreater || roles.company !== id)) {
    redirect('/dashboard/company');
  }

  const company = await getCompany(id);
  if (!company) {
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
            <Link href={`/dashboard/company/${id}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {company.name}
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Edit</span>
          </div>
          <h1 className="page-title">Edit Company Profile</h1>
          <p className="page-subtitle">Update general profile info, PO box, contact info, social links, or logo.</p>
        </div>
      </div>

      <div className="card">
        <CompanyForm company={company} />
      </div>
    </div>
  );
}
