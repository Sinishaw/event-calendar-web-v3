'use client';

import { useState, useRef } from 'react';
import { TopicOption } from '@/services/remote-config.service';

interface GlobalTopicsClientProps {
  initialTopics: TopicOption[];
  initialSubs: Record<string, string>;
}

export default function GlobalTopicsClient({ initialTopics, initialSubs }: GlobalTopicsClientProps) {
  const [topics, setTopics] = useState<TopicOption[]>(initialTopics);
  const [topicsForSub, setTopicsForSub] = useState<Record<string, string>>(initialSubs);

  const [name, setName] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDeleteValue, setConfirmDeleteValue] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Topic name is required.');
      return;
    }

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = topics.some(t => t.value === value);
    if (exists) {
      setError(`Topic "${trimmed}" already exists.`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', trimmed);
      if (iconFile) {
        formData.append('icon', iconFile);
      }

      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create topic');
      }

      // Add to local state
      const newTopic: TopicOption = { name: trimmed, value };
      setTopics(prev => [...prev, newTopic]);
      setTopicsForSub(prev => ({
        ...prev,
        [value]: `${value}~${result.topic.iconURL || ''}`,
      }));

      setSuccess(`Global topic "${trimmed}" created successfully!`);
      setName('');
      setIconFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function performDelete(value: string, name: string) {
    setError('');
    setSuccess('');
    setLoading(true);
    setConfirmDeleteValue(null);

    try {
      const res = await fetch(`/api/admin/topics?value=${value}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete topic');
      }

      // Remove from local state
      setTopics(prev => prev.filter(t => t.value !== value));
      setTopicsForSub(prev => {
        const copy = { ...prev };
        delete copy[value];
        return copy;
      });

      setSuccess(`Global topic "${name}" deleted successfully!`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
      
      {/* Left Column: Topics List */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          Registered Topics
        </h2>
        
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        {success && <div className="alert alert-success mb-4" role="alert">{success}</div>}

        {topics.length === 0 ? (
          <p className="text-muted text-sm" style={{ padding: '1rem 0' }}>No global topics registered yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Topic Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Identifier</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Icon</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => {
                  const iconUrl = topicsForSub[t.value]?.split('~')?.[1];
                  return (
                    <tr key={t.value} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.value}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {iconUrl ? (
                          <img src={iconUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'inline-block' }} />
                        ) : (
                          <span className="text-faint text-xs">—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {confirmDeleteValue === t.value ? (
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-danger)', fontWeight: 500 }}>Confirm?</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                performDelete(t.value, t.name);
                              }}
                              disabled={loading}
                              className="btn btn-sm"
                              style={{
                                padding: '0.15rem 0.4rem',
                                fontSize: '0.75rem',
                                color: '#ffffff',
                                background: 'var(--text-danger)',
                                border: '1px solid var(--text-danger)',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmDeleteValue(null);
                              }}
                              disabled={loading}
                              className="btn btn-sm btn-secondary"
                              style={{
                                padding: '0.15rem 0.4rem',
                                fontSize: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmDeleteValue(t.value);
                            }}
                            disabled={loading}
                            className="btn btn-sm"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem',
                              color: 'var(--text-danger)',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Column: Creation Form */}
      <div className="card" style={{ alignSelf: 'start' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          Create New Topic
        </h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>
          <div className="form-group">
            <label htmlFor="topic-name">Topic Display Name</label>
            <input
              id="topic-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technology"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic-icon">Topic Icon Image (Optional)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {iconFile ? 'Change File' : 'Choose Image File'}
              </button>
              {iconFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="text-xs text-muted" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {iconFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIconFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 6px', fontSize: '0.75rem', lineHeight: 1 }}
                    title="Clear File"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="topic-icon"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setIconFile(file);
                }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating…' : 'Add Global Topic'}
          </button>
        </form>
      </div>

    </div>
  );
}
