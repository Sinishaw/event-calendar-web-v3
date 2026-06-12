import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompanyContents } from '@/services/content.service';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Articles',
};

export default async function ContentListPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return (
      <div className="alert alert-warning mb-4" role="alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        </svg>
        Your account is not assigned to any company. Please ask an administrator to assign a company to your profile to manage content.
      </div>
    );
  }

  const contents = await getCompanyContents(companyId);

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Company Content</h1>
          <p className="page-subtitle">Add, edit, review, and broadcast news and announcement articles for your company app users.</p>
        </div>
        <div className="page-actions">
          {(roles.isAdmin || roles.isCreater) && (
            <Link href="/dashboard/content/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Content
            </Link>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {contents.map((item) => {
          let statusLabel = 'New';
          let statusClass = 'badge-warning';
          if (item.st === 1) {
            statusLabel = 'Published';
            statusClass = 'badge-success';
          } else if (item.st === 2) {
            statusLabel = 'Deleted';
            statusClass = 'badge-danger';
          }

          const fromDate = new Date(item.frD).toLocaleDateString();
          const toDate = new Date(item.toD).toLocaleDateString();

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                {/* Banner Image or placeholder */}
                <div
                  style={{
                    height: '140px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-deep)',
                    position: 'relative',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {item.iUrl ? (
                    <img src={item.iUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                      <span className="text-xs text-faint">No Banner Image</span>
                    </div>
                  )}
                  {/* Category badge */}
                  <span
                    className="badge badge-accent"
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      background: 'rgba(28, 25, 23, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--accent)',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', lineHeight: '1.4' }}>{item.title}</h2>
                  <p className="truncate" style={{ fontSize: '0.85rem', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', whiteSpace: 'normal', margin: 0, minHeight: '2.5rem' }}>
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-2" style={{ marginTop: '0.25rem' }}>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    {item.notified && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Notified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bottom */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs text-faint" style={{ display: 'block' }}>
                  {fromDate} - {toDate}
                </span>
                <Link href={`/dashboard/content/${item.id}`} className="btn btn-secondary btn-sm">
                  Review Details
                </Link>
              </div>
            </div>
          );
        })}

        {contents.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem' }}>
            <span className="text-muted">No content articles saved for your company yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
