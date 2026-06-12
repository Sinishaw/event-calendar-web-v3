'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TopicContent } from '@/services/topic-content.service';
import { TopicOption } from '@/services/remote-config.service';

interface TopicListClientProps {
  initialContents: TopicContent[];
  roles: {
    isAdmin: boolean;
    isPublisher: boolean;
    isCreater: boolean;
    company?: string;
  };
  topics: TopicOption[];
}

export default function TopicListClient({ initialContents, roles, topics }: TopicListClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Extract unique categories from contents to populate category filter dynamically
  const uniqueCategories = useMemo(() => {
    const cats = initialContents.map((item) => item.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [initialContents]);

  // Compute filtered contents based on user queries
  const filteredContents = useMemo(() => {
    return initialContents.filter((item) => {
      // 1. Text Search
      if (searchText) {
        const text = searchText.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(text);
        const matchesDesc = item.description?.toLowerCase().includes(text);
        const matchesCategory = item.category?.toLowerCase().includes(text);
        const matchesCompany = item.companyName?.toLowerCase().includes(text);
        const matchesAuthor = item.cb?.toLowerCase().includes(text);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesCompany && !matchesAuthor) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const targetStatus = parseInt(statusFilter, 10);
        if (item.st !== targetStatus) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all') {
        if (item.category !== categoryFilter) return false;
      }

      // 4. Topic Channel Filter
      if (topicFilter !== 'all') {
        if (item.topic !== topicFilter) return false;
      }

      // 5. Date Range: Start Date Filter
      if (startDateFilter) {
        const fromTime = new Date(startDateFilter).setHours(0, 0, 0, 0);
        const itemTime = new Date(item.frD).setHours(0, 0, 0, 0);
        if (itemTime < fromTime) return false;
      }

      // 6. Date Range: End Date Filter
      if (endDateFilter) {
        const toTime = new Date(endDateFilter).setHours(23, 59, 59, 999);
        const itemTime = new Date(item.frD).getTime();
        if (itemTime > toTime) return false;
      }

      return true;
    });
  }, [initialContents, searchText, statusFilter, categoryFilter, topicFilter, startDateFilter, endDateFilter]);

  // Get human readable topic name
  function getTopicName(val: string): string {
    const found = topics.find((t) => t.value === val);
    return found ? found.name : val;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search and Filters Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-inputs">
          
          {/* Text Search Input */}
          <div className="filter-search-wrapper">
            <input
              type="text"
              placeholder="Search title, summary, company, author..."
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

          {/* Topic Channel Filter */}
          <div className="filter-select-wrapper">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrapper">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="0">Draft</option>
              <option value="1">Published</option>
              <option value="2">Deleted</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="filter-date-wrapper">
            <span className="filter-date-label">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="filter-date-input"
            />
            <span className="filter-date-label">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="filter-date-input"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                type="button"
                className="filter-date-clear"
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                title="Clear date filters"
              >
                &times;
              </button>
            )}
          </div>

        </div>

        {/* Single Spot View Mode Toggle Button */}
        <div className="filter-toolbar-actions">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '38px', minWidth: '110px' }}
          >
            {viewMode === 'grid' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>List View</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Grid View</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* RENDER LISTINGS */}
      {viewMode === 'grid' ? (
        /* GRID VIEW LAYOUT */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredContents.map((item) => {
            let statusLabel = 'Draft';
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
                      <img src={item.iUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                        <span className="text-xs text-faint">No Banner Image</span>
                      </div>
                    )}
                    {/* Category tag */}
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
                    {/* Channel tag */}
                    <span
                      className="badge badge-default"
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(28, 25, 23, 0.85)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {getTopicName(item.topic)}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.logoUrl && (
                        <img src={item.logoUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{item.companyName}</span>
                    </div>

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

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-faint" style={{ display: 'block' }}>
                    {fromDate} - {toDate}
                  </span>
                  <Link href={`/dashboard/topics/${item.topic}/${item.id}`} className="btn btn-secondary btn-sm">
                    Review Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>Icon</th>
                <th>Topic</th>
                <th>Title</th>
                <th>Company</th>
                <th>Category</th>
                <th>Status</th>
                <th>Broadcast</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.map((item) => {
                let statusLabel = 'Draft';
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
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--bg-deep)',
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.5rem', color: 'var(--text-faint)' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{getTopicName(item.topic)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                        <span className="truncate" style={{ fontSize: '0.8rem', color: 'var(--text-faint)', maxWidth: '240px' }} title={item.description}>
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td>{item.companyName}</td>
                    <td>
                      <span className="badge badge-accent">{item.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td>
                      {item.notified ? (
                        <span className="badge badge-success">Notified</span>
                      ) : (
                        <span className="badge badge-default">Pending</span>
                      )}
                    </td>
                    <td>{fromDate}</td>
                    <td>{toDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/dashboard/topics/${item.topic}/${item.id}`} className="btn btn-secondary btn-sm">
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredContents.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <span className="text-muted">No topic articles match your active search filters.</span>
        </div>
      )}

    </div>
  );
}
