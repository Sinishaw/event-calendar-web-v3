'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ETHIOPIAN_MONTHS } from '@/types/month-image';
import type { MonthImageCollection } from '@/types/month-image';

interface MonthImageFormProps {
  mode: 'create' | 'edit' | 'clone';
  roles: { isAdmin: boolean; isPublisher: boolean; isCreater: boolean; company?: string };
  /** Existing collection — used in edit/clone/review modes */
  collection?: MonthImageCollection;
}

interface TileState {
  /** Existing URL from Firestore (shown initially in edit/clone mode) */
  existingUrl: string | null;
  /** Newly picked local File — takes precedence over existingUrl for preview */
  file: File | null;
  /** Object URL for local preview */
  previewUrl: string | null;
  /** Whether user cleared this tile */
  cleared: boolean;
  /** Drag-over highlight */
  dragOver: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MonthImageForm({ mode, roles, collection }: MonthImageFormProps) {
  const router = useRouter();
  const canEdit = roles.isCreater || roles.isAdmin;
  const canPublish = roles.isPublisher || roles.isAdmin;
  const isReview = mode === 'edit' && !!collection;

  const [thm, setThm] = useState(collection?.thm ?? '');
  const [dsc, setDsc] = useState(collection?.dsc ?? '');

  // Tile state — one entry per Ethiopian month
  const [tiles, setTiles] = useState<Record<string, TileState>>(() => {
    const init: Record<string, TileState> = {};
    for (const m of ETHIOPIAN_MONTHS) {
      init[m.key] = {
        existingUrl: (collection as any)?.[m.urlField] ?? null,
        file: null,
        previewUrl: null,
        cleared: false,
        dragOver: false,
      };
    }
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // Conflict state — set when publish returns 409
  const [publishConflict, setPublishConflict] = useState<{ id: string; thm: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Show toast ──────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Tile helpers ─────────────────────────────────────────────────────────────
  const applyFile = useCallback((key: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setTiles((prev) => ({
      ...prev,
      [key]: { ...prev[key], file, previewUrl, cleared: false, dragOver: false },
    }));
  }, []);

  const clearTile = useCallback((key: string) => {
    setTiles((prev) => {
      const old = prev[key];
      if (old.previewUrl) URL.revokeObjectURL(old.previewUrl);
      return { ...prev, [key]: { ...old, file: null, previewUrl: null, existingUrl: null, cleared: true } };
    });
  }, []);

  const handleFileInput = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(key, file);
    e.target.value = ''; // allow re-pick same file
  };

  const handleDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    setTiles((prev) => ({ ...prev, [key]: { ...prev[key], dragOver: false } }));
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) applyFile(key, file);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thm.trim()) { showToast('Theme name is required', 'error'); return; }
    if (!dsc.trim()) { showToast('Description is required', 'error'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('thm', thm.trim());
      fd.append('dsc', dsc.trim());

      for (const m of ETHIOPIAN_MONTHS) {
        const t = tiles[m.key];
        if (t.file) {
          fd.append(`file_${m.key}`, t.file);
        } else if (t.cleared) {
          fd.append(`clear_${m.key}`, 'true');
        } else {
          fd.append(`url_${m.key}`, t.existingUrl ?? '');
        }
      }

      const url = mode === 'edit' && collection
        ? `/api/month-images/${collection.id}`
        : '/api/month-images';
      const method = mode === 'edit' && collection ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Save failed');

      showToast('Collection saved successfully!', 'success');
      const targetId = mode === 'edit' ? collection!.id : json.data?.id;
      setTimeout(() => router.push(`/dashboard/month-images/${targetId}`), 1200);
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Action buttons (approve, delete, publish, unpublish) ────────────────────
  const doAction = async (action: string, label: string) => {
    if (!collection) return;
    setPublishConflict(null);
    setActionLoading(action);
    try {
      const res = await fetch(`/api/month-images/${collection.id}/${action}`, { method: 'POST' });
      const json = await res.json();

      // Handle publish conflict (409) — another collection is live
      if (action === 'publish' && res.status === 409) {
        setPublishConflict({ id: json.conflictId, thm: json.conflictThm });
        return;
      }

      if (!res.ok) throw new Error(json.error || `${label} failed`);
      showToast(`${label} successful!`, 'success');
      setTimeout(() => router.refresh(), 1000);
    } catch (err: any) {
      showToast(err.message || `${label} failed`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async () => {
    if (!collection) return;
    if (!confirm('Are you sure you want to delete this collection?')) return;
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/month-images/${collection.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      showToast('Collection deleted.', 'success');
      setTimeout(() => router.push('/dashboard/month-images'), 1200);
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Status helpers ──────────────────────────────────────────────────────────
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
    <div className="fade-up">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
            padding: '0.85rem 1.25rem', borderRadius: 'var(--radius)',
            background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: '#fff', fontWeight: 600, boxShadow: 'var(--shadow-lg)',
            maxWidth: '360px', animation: 'fadeInUp 0.25s ease',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            {mode === 'create' ? '📅 New Month Image Collection'
              : mode === 'clone' ? '📋 Clone Collection'
              : '📅 Collection Details'}
          </h1>
          <p className="page-subtitle">
            {mode === 'create' ? 'Upload images for each Ethiopian calendar month'
              : mode === 'clone' ? 'Starting from an existing collection — change only the months you need'
              : `Theme: ${collection?.thm}`}
          </p>
        </div>
        <div className="page-header-right">
          <button
            type="button"
            onClick={() => router.push('/dashboard/month-images')}
            className="btn btn-secondary"
          >
            ← Back to List
          </button>
        </div>
      </div>

      {/* Status / Action Bar — review mode only */}
      {isReview && collection && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>

          {/* Publish conflict banner */}
          {publishConflict && (
            <div
              style={{
                background: 'color-mix(in srgb, var(--warning, #f59e0b) 15%, var(--surface-2))',
                border: '1px solid color-mix(in srgb, var(--warning, #f59e0b) 45%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text)' }}>
                  Another collection is currently published
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  &ldquo;{publishConflict.thm}&rdquo; is live. Unpublish it first, then come back to publish this one.
                </span>
              </div>
              <a
                href={`/dashboard/month-images/${publishConflict.id}`}
                className="btn btn-secondary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                Go to Live Collection →
              </a>
              <button
                type="button"
                onClick={() => setPublishConflict(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-faint)' }}
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
            {/* Status badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${statusClass(collection.st)}`}>{statusLabel(collection.st)}</span>
                {collection.published && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Live
                  </span>
                )}
              </div>
              {/* Lifecycle hint */}
              {canPublish && collection.st !== 3 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                  {collection.st === 0 && !collection.published && 'Next step: Approve'}
                  {collection.st === 1 && !collection.published && 'Next step: Publish'}
                  {collection.published && 'Currently live in the mobile app'}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center' }}>
              {canPublish && collection.st !== 3 && (
                <>
                  {/* APPROVE — only available for Draft */}
                  {collection.st === 0 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={actionLoading !== null}
                      onClick={() => doAction('approve', 'Approve')}
                      title="Approve this Draft collection"
                    >
                      {actionLoading === 'approve' ? '⏳' : '✅'} Approve
                    </button>
                  )}

                  {/* PUBLISH — only available for Approved, non-published */}
                  {collection.st === 1 && !collection.published && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={actionLoading !== null}
                      onClick={() => doAction('publish', 'Publish')}
                      title="Push this collection live to the mobile app"
                    >
                      {actionLoading === 'publish' ? '⏳' : '🚀'} Publish
                    </button>
                  )}

                  {/* UNPUBLISH — only available when this collection is live */}
                  {collection.published && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={actionLoading !== null}
                      onClick={() => doAction('unpublish', 'Unpublish')}
                      title="Remove from Remote Config — mobile app will stop using this set"
                    >
                      {actionLoading === 'unpublish' ? '⏳' : '🔒'} Unpublish
                    </button>
                  )}

                  <button
                    className="btn btn-danger btn-sm"
                    disabled={actionLoading !== null || collection.published}
                    onClick={doDelete}
                    title={collection.published ? 'Unpublish before deleting' : 'Delete this collection'}
                  >
                    {actionLoading === 'delete' ? '⏳' : '🗑'} Delete
                  </button>
                </>
              )}

              {/* Clone button — always available */}
              {canEdit && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => router.push(`/dashboard/month-images/new?clone=${collection.id}`)}
                >
                  📋 Clone
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Metadata */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <p className="card-title">Collection Details</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="thm">Theme Name *</label>
              <input
                id="thm"
                className="form-input"
                type="text"
                placeholder="e.g. 2025 Nature Vibes"
                value={thm}
                onChange={(e) => setThm(e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dsc">Description *</label>
              <textarea
                id="dsc"
                className="form-textarea"
                rows={2}
                placeholder="Short description of this image set..."
                value={dsc}
                onChange={(e) => setDsc(e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>
          </div>
        </div>

        {/* Month Image Grid */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div>
              <p className="card-title">Month Images</p>
              <p className="card-subtitle">
                Click a tile or drag & drop an image to assign it. All 13 Ethiopian months shown.
              </p>
            </div>
          </div>

          <div className="month-grid">
            {ETHIOPIAN_MONTHS.map((m) => {
              const tile = tiles[m.key];
              const displayUrl = tile.previewUrl ?? tile.existingUrl;
              const hasImage = !!displayUrl && !tile.cleared;
              const isNew = !!tile.file;

              return (
                <div key={m.key} className="month-tile-wrapper">
                  {/* Hidden file input */}
                  <input
                    ref={(el) => { fileRefs.current[m.key] = el; }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileInput(m.key, e)}
                    disabled={!canEdit}
                  />

                  {/* The tile itself */}
                  <div
                    className={`month-tile ${tile.dragOver ? 'month-tile--dragover' : ''} ${!hasImage ? 'month-tile--empty' : ''}`}
                    onClick={() => canEdit && fileRefs.current[m.key]?.click()}
                    onDragOver={(e) => { e.preventDefault(); if (canEdit) setTiles((p) => ({ ...p, [m.key]: { ...p[m.key], dragOver: true } })); }}
                    onDragLeave={() => setTiles((p) => ({ ...p, [m.key]: { ...p[m.key], dragOver: false } }))}
                    onDrop={(e) => canEdit && handleDrop(m.key, e)}
                  >
                    {/* Image */}
                    {hasImage && (
                      <img
                        src={displayUrl!}
                        alt={m.english}
                        className="month-tile-img"
                        key={displayUrl}
                      />
                    )}

                    {/* Overlay with camera icon */}
                    {canEdit && (
                      <div className="month-tile-overlay">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                          {hasImage ? 'Change' : 'Add'}
                        </span>
                      </div>
                    )}

                    {/* Month name badge */}
                    <div className="month-tile-badge">
                      <span className="month-tile-amharic">{m.amharic}</span>
                      <span className="month-tile-english">{m.english}</span>
                    </div>

                    {/* Clear button */}
                    {canEdit && hasImage && (
                      <button
                        type="button"
                        className="month-tile-clear"
                        title="Remove this image"
                        onClick={(e) => { e.stopPropagation(); clearTile(m.key); }}
                      >
                        ×
                      </button>
                    )}

                    {/* New file indicator */}
                    {isNew && (
                      <div className="month-tile-new-badge">NEW</div>
                    )}

                    {/* Empty placeholder */}
                    {!hasImage && (
                      <div className="month-tile-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span style={{ fontSize: '0.65rem', marginTop: '0.4rem', opacity: 0.5 }}>No Image</span>
                      </div>
                    )}
                  </div>

                  {/* File metadata shown below tile */}
                  {tile.file && (
                    <div className="month-tile-meta">
                      <span className="month-tile-meta-name" title={tile.file.name}>{tile.file.name}</span>
                      <span className="month-tile-meta-size">{formatSize(tile.file.size)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/dashboard/month-images')}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '140px' }}
            >
              {saving ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Saving…
                </span>
              ) : (
                mode === 'edit' ? '💾 Save Changes' : '✅ Create Collection'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
