import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompany } from '@/services/company.service';
import { getCompanyConfig } from '@/services/remote-config.service';
import CompanyThemeForm from './CompanyThemeForm';
import Link from 'next/link';
import type { Metadata } from 'next';

interface CompanyThemePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CompanyThemePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Company Theme ${id.toUpperCase()}`,
  };
}

export default async function CompanyThemePage({ params }: CompanyThemePageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;
  const roles = getRoles(session);

  // Authorization: Admin or Creator associated with this company
  if (!roles.isAdmin && (!roles.isCreater || roles.company !== id)) {
    redirect('/dashboard/company');
  }

  const company = await getCompany(id);
  if (!company) {
    redirect('/dashboard/company');
  }

  const { config, languages, topics } = await getCompanyConfig(id);

  // Setup default fallbacks if Remote Config doesn't have lists populated yet
  const globalLanguages = languages.length > 0 ? languages : ['am', 'en', 'om', 'ti'];
  const globalTopics = topics.length > 0 ? topics : ['News', 'Events', 'Announcements', 'Holidays', 'Business'];

  return (
    <div className="fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Theme & Settings</span>
          </div>
          <h1 className="page-title">App Theme & Settings</h1>
          <p className="page-subtitle">Configure the user interface branding, color tokens, active languages, layout preferences, and content channels.</p>
        </div>
      </div>

      <div className="card">
        <CompanyThemeForm
          companyId={id}
          config={config}
          globalLanguages={globalLanguages}
          globalTopics={globalTopics}
        />
      </div>
    </div>
  );
}
