import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTermsRecords } from '@/services/terms.service';
import { getAllCompanies } from '@/services/company.service';
import CompanyFilterSelect from './CompanyFilterSelect';
import Link from 'next/link';
import type { Metadata } from 'next';
import '../dashboard.css';

export const metadata: Metadata = { title: 'Terms & Policies | Calendar Platform' };

type Props = {
  searchParams: Promise<{ scope?: string; company?: string }>;
};

export default async function TermsListPage(props: Props) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const searchParams = await props.searchParams;
  const scope = (searchParams.scope === 'general') ? 'general' : 'company';
  
  // Admin can select another company, default to their company or first in list
  const companies = roles.isAdmin ? await getAllCompanies() : [];
  let companyId = '';

  if (scope === 'general') {
    if (!roles.isAdmin) {
      redirect('/dashboard/terms?scope=company');
    }
    companyId = 'general';
  } else {
    companyId = roles.isAdmin 
      ? (searchParams.company || (companies.length > 0 ? companies[0].company : '')) 
      : (roles.company || '');
  }

  const records = companyId ? await getTermsRecords(companyId) : [];

  const canEdit = roles.isCreater || roles.isAdmin;

  // Helper for displaying status badge styling
  const statusLabel = (st: number) => {
    if (st === 1) return 'Approved';
    if (st === 2) return 'Deleted';
    return 'Draft';
  };

  const statusClass = (st: number) => {
    if (st === 1) return 'badge-success';
    if (st === 2) return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📋 Terms & Policies</h1>
          <p className="page-subtitle">
            Manage, approve, and publish versioned Terms of Service and Privacy Policies synced with mobile client configurations.
          </p>
        </div>
        
        {canEdit && companyId && (
          <div className="page-actions">
            <Link 
              href={`/dashboard/terms/new?scope=${scope}${scope === 'company' && roles.isAdmin ? `&company=${companyId}` : ''}`} 
              className="btn btn-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Version
            </Link>
          </div>
        )}
      </div>

      {/* Tabs / Company Selection Dropdown */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Tab Headers (only admins see general tab) */}
        {roles.isAdmin ? (
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <Link 
              href={`/dashboard/terms?scope=company${companyId !== 'general' ? `&company=${companyId}` : ''}`}
              className="btn"
              style={{
                background: scope === 'company' ? 'var(--surface)' : 'transparent',
                borderColor: scope === 'company' ? 'var(--border)' : 'transparent',
                color: scope === 'company' ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                padding: '0.4rem 1rem',
              }}
            >
              🏢 Company Terms
            </Link>
            <Link 
              href="/dashboard/terms?scope=general"
              className="btn"
              style={{
                background: scope === 'general' ? 'var(--surface)' : 'transparent',
                borderColor: scope === 'general' ? 'var(--border)' : 'transparent',
                color: scope === 'general' ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                padding: '0.4rem 1rem',
              }}
            >
              🌍 General Terms
            </Link>
          </div>
        ) : (
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>
            🏢 Managing Terms for: {roles.company || 'Assigned Company'}
          </div>
        )}

        {/* Company Dropdown (only for admin and company scope) */}
        {roles.isAdmin && scope === 'company' && companies.length > 0 && (
          <CompanyFilterSelect companies={companies} currentCompanyId={companyId} />
        )}
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Version #</th>
                <th>Revision Note</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Published</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} style={{ opacity: rec.st === 2 ? 0.65 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>📄</span>
                      <strong style={{ color: 'var(--text)' }}>v{rec.version}</strong>
                    </div>
                  </td>
                  <td>
                    <span 
                      style={{ 
                        fontWeight: '500', 
                        color: 'var(--text)', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        display: 'block',
                        maxWidth: '450px'
                      }}
                      title={rec.description}
                    >
                      {rec.description || 'No revision details provided.'}
                    </span>
                  </td>
                  <td className="text-sm">
                    {new Date(rec.cd).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${statusClass(rec.st)}`}>{statusLabel(rec.st)}</span>
                  </td>
                  <td>
                    <span className={`badge ${rec.published ? 'badge-success' : 'badge-default'}`}>
                      {rec.published ? '🚀 Live' : '🔒 Not Published'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/dashboard/terms/${rec.id}?scope=${scope}${scope === 'company' && roles.isAdmin ? `&company=${companyId}` : ''}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <div className="text-muted mb-1">No terms and policies versions found.</div>
                    {canEdit && (
                      <p className="text-xs text-faint">Click "Create New Version" to get started.</p>
                    )}
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
