import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTopicContent } from '@/services/topic-content.service';
import TopicActions from './TopicActions';
import Link from 'next/link';
import type { Metadata } from 'next';

interface TopicDetailPageProps {
  params: Promise<{ topic: string; id: string }>;
}

export async function generateMetadata({ params }: TopicDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Topic Article Detail ${id}`,
  };
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoString;
  }
}

function getTagColorHex(tagColor?: string): string {
  switch (tagColor) {
    case 'regular': return '#009900';
    case 'moderate': return '#e7eb34';
    case 'important': return '#FFA500';
    case 'veryimportant': return '#FF0000';
    default: return tagColor && tagColor !== '-1' ? tagColor : 'transparent';
  }
}

function getTagColorName(tagColor?: string): string {
  switch (tagColor) {
    case 'regular': return 'Regular';
    case 'moderate': return 'Moderate';
    case 'important': return 'Important';
    case 'veryimportant': return 'Very Important';
    default: return tagColor === '-1' ? 'None' : (tagColor || 'None');
  }
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { topic, id } = await params;
  const decodedTopic = decodeURIComponent(topic);
  const roles = getRoles(session);

  const content = await getTopicContent(decodedTopic, id);
  if (!content) {
    redirect('/dashboard/topics');
  }

  // Status mapping
  let statusLabel = 'New / Draft';
  let statusClass = 'badge-warning';
  if (content.st === 1) {
    statusLabel = 'Published';
    statusClass = 'badge-success';
  } else if (content.st === 2) {
    statusLabel = 'Deleted / Archived';
    statusClass = 'badge-danger';
  }

  const hasVideo = !!content.vUrl;
  const hasWeather = !!content.wUrl;

  return (
    <div className="fade-up">
      {/* Breadcrumbs & Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/topics" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Topic Articles
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Details</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {content.logoUrl && (
              <img
                src={content.logoUrl}
                alt="Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-deep)'
                }}
              />
            )}
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)' }}>{content.companyName}</span>
              <span className="text-muted text-xs" style={{ marginLeft: '0.50rem' }}>(Channel: {content.topic})</span>
            </div>
          </div>

          <h1 className="page-title">{content.title}</h1>
          <p className="page-subtitle">Created by {content.cb || 'System'} on {formatDate(content.cd)}</p>
        </div>
        
        <div className="page-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/dashboard/topics" className="btn btn-secondary">
            Back to List
          </Link>
          {(roles.isAdmin || roles.isCreater) && content.st !== 2 && (
            <Link href={`/dashboard/topics/${topic}/${id}/edit`} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Article
            </Link>
          )}
        </div>
      </div>

      {/* Main Details Layout - Responsive 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }} className="content-detail-layout">
        
        {/* Left Column: Banner, Body, and Embeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Banner Photo */}
          <div
            style={{
              width: '100%',
              height: '320px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              boxShadow: 'var(--shadow)',
            }}
          >
            {content.iUrl ? (
              <img src={content.iUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-sm text-faint" style={{ marginTop: '0.5rem' }}>No Header Banner Image Uploaded</span>
              </div>
            )}

            {/* Category tag */}
            <span
              className="badge badge-accent"
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                fontSize: '0.85rem',
                padding: '0.35rem 0.85rem',
                background: 'rgba(28, 25, 23, 0.85)',
                backdropFilter: 'blur(4px)',
                color: 'var(--accent)',
              }}
            >
              {content.category}
            </span>
          </div>

          {/* Article Description Summary */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent)', background: 'var(--surface-2)' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', marginBottom: '0.5rem' }}>Brief Summary</h3>
            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '1rem', color: 'var(--text)' }}>
              &ldquo;{content.description}&rdquo;
            </p>
          </div>

          {/* Article Detailed Body */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>Article Body</h2>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: '1.8' }}>
              {content.body}
            </div>
          </div>

          {/* Interactive Widgets */}
          {(hasVideo || hasWeather) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {hasVideo && (
                <div className="card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    Video Media Attachment
                  </h3>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={content.vUrl}
                      title="Video attachment"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {hasWeather && (
                <div className="card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    </svg>
                    Weather Information Widget
                  </h3>
                  <div style={{ width: '100%', height: '240px', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-deep)' }}>
                    <iframe
                      src={content.wUrl}
                      title="Weather Widget"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Status, Configuration Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Status Actions Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</span>
              <span className={`badge ${statusClass}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>{statusLabel}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Push Alerts</span>
              {content.notified ? (
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>FCM Broadcasted</span>
              ) : content.notifyUser ? (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Pending Push</span>
              ) : (
                <span className="badge badge-default" style={{ fontSize: '0.75rem' }}>None Requested</span>
              )}
            </div>

            {/* Render Publisher actions */}
            {(roles.isAdmin || roles.isPublisher) && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Publisher Review</h4>
                <TopicActions content={content} isPublisher={roles.isAdmin || roles.isPublisher} />
              </div>
            )}
          </div>

          {/* Configuration and Schedules info */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              Schedules & Config
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              
              <div>
                <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Theme Tag Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: getTagColorHex(content.tagColor), display: 'inline-block', border: '1px solid var(--border)' }}></span>
                  <span>{getTagColorName(content.tagColor)} ({content.tagColor})</span>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Age Restriction</span>
                <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>
                  {content.ageRestriction === '0' ? 'All Ages (0+)' : `${content.ageRestriction}+ years only`}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Visible From</span>
                <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>{formatDate(content.frD)}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Visible Until</span>
                <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>{formatDate(content.toD)}</span>
              </div>

              {content.markOnCalendar && (
                <div>
                  <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Calendar Highlight Date</span>
                  <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>{formatDate(content.markDate)}</span>
                </div>
              )}

              <div>
                <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Expiration Date</span>
                <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>{formatDate(content.fetchExpirationDate)}</span>
              </div>

              {content.nationalDay && (
                <div>
                  <span style={{ display: 'block', color: 'var(--text-faint)', fontSize: '0.75rem', textTransform: 'uppercase' }}>National Day Event</span>
                  <span style={{ display: 'block', color: 'var(--text)', marginTop: '0.15rem' }}>{content.nationalDay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Info Card */}
          <div className="card" style={{ fontSize: '0.8rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Audit Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', color: 'var(--text-muted)' }}>
              
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Author:</span> {content.cb || 'System'}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Created:</span> {formatDate(content.cd)}
              </div>
              
              {content.ub && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Last Editor:</span> {content.ub}
                </div>
              )}
              {content.ud && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Last Updated:</span> {formatDate(content.ud)}
                </div>
              )}

              {content.st === 1 && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Publisher Approval:</span> Published
                </div>
              )}

              {content.notified && content.messageId && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>FCM Message ID:</span>
                  <code style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.15rem' }}>{content.messageId}</code>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* CSS layout adjustment styling scoped to this layout structure */}
      <style>{`
        @media (max-width: 900px) {
          .content-detail-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
