'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MonthImageListItem } from '@/types/month-image';
import { ETHIOPIAN_MONTHS } from '@/types/month-image';

interface MonthImageListClientProps {
  initialCollections: MonthImageListItem[];
  roles: { isAdmin: boolean; isPublisher: boolean; isCreater: boolean; company?: string };
}

export default function MonthImageListClient({ initialCollections, roles }: MonthImageListClientProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');

  const filtered = useMemo(() => {
    return initialCollections.filter((item) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        if (!item.thm.toLowerCase().includes(q) && !item.dsc.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'all' && String(item.st) !== statusFilter) return false;
      if (publishedFilter === 'published' && !item.published) return false;
      if (publishedFilter === 'unpublished' && item.published) return false;
      return true;
    });
  }, [initialCollections, searchText, statusFilter, publishedFilter]);

  const statusLabel = (st: number) => {
    if (st === 1) return 'Approved';
    if (st === 3) return 'Deleted';
    return 'Draft';
  };
  const statusClass = (st: number) => {
    if (st === 1) return 'badge-success';
    if (st === 3) return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          {/* Search */}
          <div className="filter-search-wrapper">
            <input
              type="text"
              placeholder="Search theme or description…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="filter-search-input"
            />
            <span className="filter-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
          </div>

          {/* Status filter */}
          <div className="filter-select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="0">Draft</option>
              <option value="1">Approved</option>
              <option value="3">Deleted</option>
            </select>
          </div>

          {/* Published filter */}
          <div className="filter-select-wrapper">
            <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value)} className="filter-select">
              <option value="all">All</option>
              <option value="published">Published (Live)</option>
              <option value="unpublished">Not Published</option>
            </select>
          </div>
        </div>

        {/* Action */}
        {(roles.isCreater || roles.isAdmin) && (
          <div className="filter-toolbar-actions">
            <Link href="/dashboard/month-images/new" className="btn btn-primary btn-sm">
              + New Collection
            </Link>
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <span className="text-muted">No collections match your filters.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((item) => {
            // Pick first 5 non-null month images as a preview strip
            const strip = ETHIOPIAN_MONTHS
              .map((m) => ({ key: m.key, url: (item as any)[m.urlField] as string | null, label: m.amharic }))
              .filter((x) => !!x.url)
              .slice(0, 5);

            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Cover: strip of up to 5 month thumbnails */}
                <div
                  style={{
                    height: '100px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '2px',
                  }}
                >
                  {strip.length > 0 ? (
                    strip.map((s) => (
                      <div key={s.key} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={s.url!}
                          alt={s.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            fontSize: '0.55rem', textAlign: 'center',
                            background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '1px 0',
                          }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="text-xs text-faint">No Images</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${statusClass(item.st)}`}>{statusLabel(item.st)}</span>
                    {item.published && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Live
                      </span>
                    )}
                    <span className="text-xs text-faint" style={{ marginLeft: 'auto' }}>
                      {strip.length}/13 images
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{item.thm}</h2>
                  <p className="truncate" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{item.dsc}</p>
                  <span className="text-xs text-faint">Created: {new Date(item.cd).toLocaleDateString()}</span>
                </div>

                {/* Footer actions */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {(roles.isCreater || roles.isAdmin) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => router.push(`/dashboard/month-images/new?clone=${item.id}`)}
                    >
                      📋 Clone
                    </button>
                  )}
                  <Link href={`/dashboard/month-images/${item.id}`} className="btn btn-secondary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
