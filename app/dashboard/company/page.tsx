import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllCompanies } from '@/services/company.service';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Companies',
};

export default async function CompanyListPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);

  // If creator, redirect to their own company page
  if (roles.isCreater && !roles.isAdmin && roles.company && roles.company !== 'Not Assigned') {
    redirect(`/dashboard/company/${roles.company}`);
  }

  // Non-creators (admins, publishers) can see all companies
  const companies = await getAllCompanies();

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Manage multi-tenant entities, configure profiles, themes, and publication statuses.</p>
        </div>
        <div className="page-actions">
          {(roles.isAdmin || roles.isCreater) && (
            <Link href="/dashboard/company/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Company
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Company Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {companies.map((c) => {
          let statusLabel = 'New';
          let statusClass = 'badge-warning';
          if (c.st === 1) {
            statusLabel = 'Published';
            statusClass = 'badge-success';
          } else if (c.st === 2) {
            statusLabel = 'Deleted';
            statusClass = 'badge-danger';
          }

          const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';

          return (
            <div key={c.company} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {c.iUrl ? (
                      <img src={c.iUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }} aria-hidden>{initial}</span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>{c.name}</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>ID: {c.company}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {c.category && (
                    <div>
                      <span className="text-xs text-muted" style={{ fontWeight: 600, display: 'block' }}>CATEGORY</span>
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{c.category}</span>
                    </div>
                  )}

                  {c.description && (
                    <div>
                      <span className="text-xs text-muted" style={{ fontWeight: 600, display: 'block' }}>DESCRIPTION</span>
                      <p className="truncate" style={{ fontSize: '0.875rem', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal', margin: 0 }}>
                        {c.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-muted" style={{ fontWeight: 600, display: 'block' }}>STATUS</span>
                    <span className={`badge ${statusClass}`} style={{ marginTop: '0.2rem' }}>{statusLabel}</span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Link href={`/dashboard/company/${c.company}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  Manage Company
                </Link>
              </div>
            </div>
          );
        })}

        {companies.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <span className="text-muted">No companies registered in the platform yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
