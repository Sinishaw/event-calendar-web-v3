import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompany } from '@/services/company.service';
import CompanyActions from './CompanyActions';
import Link from 'next/link';
import type { Metadata } from 'next';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CompanyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Company ${id.toUpperCase()}`,
  };
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;
  const roles = getRoles(session);

  // If creator, must match their company
  if (roles.isCreater && !roles.isAdmin && roles.company !== id) {
    redirect('/dashboard');
  }

  const company = await getCompany(id);
  if (!company) {
    redirect('/dashboard/company');
  }

  let statusLabel = 'New / Pending Review';
  let statusClass = 'badge-warning';
  if (company.st === 1) {
    statusLabel = 'Published / Active';
    statusClass = 'badge-success';
  } else if (company.st === 2) {
    statusLabel = 'Deleted / Archived';
    statusClass = 'badge-danger';
  }

  const initial = company.name ? company.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/company" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Companies
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>{company.name}</span>
          </div>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-subtitle">Review company details, contact channels, social profiles, and app configuration themes.</p>
        </div>
        <div className="page-actions">
          {(roles.isAdmin || (roles.isCreater && roles.company === id)) && (
            <Link href={`/dashboard/company/${id}/edit`} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </Link>
          )}
          
          {(roles.isAdmin || (roles.isCreater && roles.company === id)) && (
            <Link href={`/dashboard/company/${id}/theme`} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Theme Settings
            </Link>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Side: General Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Profile Information</h2>
            </div>

            <div className="flex flex-col gap-4">
              {company.category && (
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>CATEGORY</span>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.category}</p>
                </div>
              )}

              {company.description && (
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>DESCRIPTION</span>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem', lineHeight: '1.5' }}>{company.description}</p>
                </div>
              )}

              {company.established && (
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>ESTABLISHED ON</span>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.established}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>STATUS</span>
                <p style={{ marginTop: '0.25rem' }}>
                  <span className={`badge ${statusClass}`}>{statusLabel}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contact details</h2>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>PHONE NUMBER</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.phone || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>EMAIL ADDRESS</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.email || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>ADDRESS LOCATION</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.address || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>P.O. BOX</span>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginTop: '0.15rem' }}>{company.pobox || '—'}</p>
              </div>

              <div>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>WEBSITE</span>
                <p style={{ color: 'var(--accent)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                  ) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Logo & Actions & Socials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Logo & Publisher Actions */}
          <div className="card flex flex-col items-center gap-4" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--bg-deep)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
              }}
            >
              {company.iUrl ? (
                <img src={company.iUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--accent)' }} aria-hidden>
                  {initial}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{company.name}</h3>
              <span className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>Identifier: {company.company}</span>
            </div>

            <hr className="divider" style={{ width: '100%', margin: '0.5rem 0' }} />

            {/* Approve/Delete Actions */}
            <CompanyActions company={company} isPublisher={roles.isPublisher} />
          </div>

          {/* Mission & Vision & Socials */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Mission, Vision & Media</h2>
            </div>

            <div className="flex flex-col gap-4">
              {company.mission && (
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>MISSION</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.15rem' }}>{company.mission}</p>
                </div>
              )}

              {company.vision && (
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>VISION</span>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.15rem' }}>{company.vision}</p>
                </div>
              )}

              {/* Social URLs */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <span className="text-xs text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>SOCIAL LINKS</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {company.facebook && <a href={company.facebook} target="_blank" className="btn btn-secondary btn-sm" rel="noopener noreferrer">Facebook</a>}
                  {company.twitter && <a href={company.twitter} target="_blank" className="btn btn-secondary btn-sm" rel="noopener noreferrer">Twitter</a>}
                  {company.youtube && <a href={company.youtube} target="_blank" className="btn btn-secondary btn-sm" rel="noopener noreferrer">YouTube</a>}
                  {company.instagram && <a href={company.instagram} target="_blank" className="btn btn-secondary btn-sm" rel="noopener noreferrer">Instagram</a>}
                  {!company.facebook && !company.twitter && !company.youtube && !company.instagram && (
                    <span className="text-xs text-faint">No social links configured</span>
                  )}
                </div>
              </div>

              {/* Widget URLs */}
              {(company.vUrl || company.wUrl) && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {company.vUrl && (
                    <div>
                      <span className="text-xs text-muted" style={{ fontWeight: 600 }}>VIDEO CONFIG URL</span>
                      <p className="truncate text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{company.vUrl}</p>
                    </div>
                  )}
                  {company.wUrl && (
                    <div>
                      <span className="text-xs text-muted" style={{ fontWeight: 600 }}>WEATHER CONFIG URL</span>
                      <p className="truncate text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{company.wUrl}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
