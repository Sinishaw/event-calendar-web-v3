import { verifySession, getRoles } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getTermDocument } from '@/services/terms.service';
import TermsActionButtons from '../TermsActionButtons';
import Link from 'next/link';
import type { Metadata } from 'next';
import '../../dashboard.css';

export const metadata: Metadata = { title: 'Terms Version Details | Calendar Platform' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scope?: string; company?: string }>;
};

export default async function TermsDetailPage(props: Props) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const scope = (searchParams.scope === 'general') ? 'general' : 'company';
  const queryCompany = searchParams.company;

  const roles = getRoles(session);
  if (scope === 'general' && !roles.isAdmin) {
    redirect('/dashboard');
  }

  const companyId = scope === 'general' ? 'general' : (roles.isAdmin && queryCompany ? queryCompany : roles.company);
  if (!companyId) redirect('/dashboard/terms');

  const term = await getTermDocument(companyId, id);
  if (!term) notFound();

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
          <h1 className="page-title">📝 Terms Version Review</h1>
          <p className="page-subtitle">
            Review version details, mobile app updates metadata, and edit or publish this terms document.
          </p>
        </div>
        <div className="page-actions">
          <Link
            href={`/dashboard/terms?scope=${scope}${queryCompany ? `&company=${queryCompany}` : ''}`}
            className="btn btn-secondary"
          >
            ← Back to List
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Left Column: Sidebar / Meta / Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Metadata Card */}
          <div className="card">
            <div className="card-header">
              <p className="card-title">Version Status</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs text-muted">Version Number:</span>
                <span className="badge badge-accent">Version {term.version}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs text-muted">Lifecycle State:</span>
                <span className={`badge ${statusClass(term.st)}`}>{statusLabel(term.st)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs text-muted">Published Status:</span>
                <span className={`badge ${term.published ? 'badge-success' : 'badge-default'}`}>
                  {term.published ? '🚀 Live' : '🔒 Not Published'}
                </span>
              </div>

              {term.wUrl && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Website Reference URL:</span>
                  <a
                    href={term.wUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs"
                    style={{ color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {term.wUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (client actions handler) */}
          <TermsActionButtons
            term={term}
            scope={scope}
            companyId={companyId}
            roles={roles}
          />

          {/* Audit Logs Card */}
          <div className="card">
            <div className="card-header">
              <p className="card-title">Audit Stamps</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <span className="text-muted" style={{ display: 'block' }}>Created By:</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{term.cb || 'System'}</span>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                  {new Date(term.cd).toLocaleString()}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span className="text-muted" style={{ display: 'block' }}>Last Updated By:</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{term.ub || 'System'}</span>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                  {new Date(term.ud).toLocaleString()}
                </span>
              </div>
              {term.ab && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  <span className="text-muted" style={{ display: 'block' }}>Approved By:</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{term.ab}</span>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                    {term.ad ? new Date(term.ad).toLocaleString() : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* App Update Metadata (General Terms only) */}
          {scope === 'general' && (term.appVersionNumber || term.appVersionName || term.appVersionSummary) && (
            <div className="card">
              <div className="card-header">
                <p className="card-title">Mobile Update Info</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {term.appVersionNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Version Code:</span>
                    <strong style={{ color: 'var(--text)' }}>{term.appVersionNumber}</strong>
                  </div>
                )}
                {term.appVersionName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Version Name:</span>
                    <strong style={{ color: 'var(--text)' }}>{term.appVersionName}</strong>
                  </div>
                )}
                {term.appVersionSummary && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <span className="text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Forced Update Summary:</span>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                      {term.appVersionSummary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Terms Content display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minWidth: 0 }}>
          
          {/* Description Card */}
          <div className="card">
            <div className="card-header">
              <p className="card-title">Revision Note</p>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              &ldquo;{term.description}&rdquo;
            </p>
          </div>

          {/* Document Content Card */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <p className="card-title">Document Content</p>
            </div>
            <div
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                maxHeight: '700px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '0.925rem',
                lineHeight: 1.6,
                color: 'var(--text)',
              }}
            >
              {term.terms}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
