'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TermsAndPolicies } from '@/types/terms';
import Link from 'next/link';

interface TermsActionButtonsProps {
  term: TermsAndPolicies;
  scope: 'company' | 'general';
  companyId: string;
  roles: { isAdmin: boolean; isPublisher: boolean; isCreater: boolean; company?: string };
}

export default function TermsActionButtons({ term, scope, companyId, roles }: TermsActionButtonsProps) {
  const router = useRouter();
  const canEdit = roles.isCreater || roles.isAdmin;
  const canPublish = roles.isPublisher || roles.isAdmin;

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [publishConflict, setPublishConflict] = useState<{ id: string; description: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (action: string, label: string, override = false) => {
    setPublishConflict(null);
    setLoadingAction(action === 'publish' && override ? 'publish_override' : action);

    try {
      const urlParams = new URLSearchParams({
        scope,
        company: companyId,
      });
      if (override) {
        urlParams.append('override', 'true');
      }

      const res = await fetch(`/api/terms/${term.id}/${action}?${urlParams.toString()}`, {
        method: 'POST',
      });
      const json = await res.json();

      if (action === 'publish' && res.status === 409) {
        setPublishConflict({ id: json.conflictId, description: json.conflictDescription });
        showToast('Publish conflict: Another terms version is currently live.', 'error');
        return;
      }

      if (!res.ok) throw new Error(json.error || `${label} failed`);

      showToast(`${label} successful!`, 'success');
      setTimeout(() => router.refresh(), 1000);
    } catch (err: any) {
      showToast(err.message || `${label} failed`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this terms version?')) return;
    setLoadingAction('delete');
    try {
      const urlParams = new URLSearchParams({
        scope,
        company: companyId,
      });
      const res = await fetch(`/api/terms/${term.id}?${urlParams.toString()}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Delete failed');

      showToast('Terms version deleted successfully', 'success');
      setTimeout(() => {
        router.push(`/dashboard/terms?scope=${scope}${companyId !== 'general' ? `&company=${companyId}` : ''}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
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

      {/* Conflict Dialog Warning */}
      {publishConflict && (
        <div
          className="fade-up"
          style={{
            background: 'color-mix(in srgb, var(--warning, #f59e0b) 15%, var(--surface-2))',
            border: '1px solid color-mix(in srgb, var(--warning, #f59e0b) 45%, transparent)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', marginTop: '-0.1rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                Conflict: Another version is currently published
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                &ldquo;{publishConflict.description}&rdquo; is currently active. You can choose to automatically unpublish it and make this version live, or review it first.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleAction('publish', 'Publish', true)}
                  disabled={loadingAction !== null}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' }}
                >
                  {loadingAction === 'publish_override' ? '⌛ Processing...' : 'Unpublish Existing & Publish This Version'}
                </button>
                <Link
                  href={`/dashboard/terms/${publishConflict.id}?scope=${scope}${companyId !== 'general' ? `&company=${companyId}` : ''}`}
                  className="btn btn-secondary btn-sm"
                >
                  Go to Active Terms →
                </Link>
                <button
                  type="button"
                  onClick={() => setPublishConflict(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Actions Card */}
      <div className="card">
        <div className="card-header">
          <p className="card-title">Lifecycle Operations</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {canPublish && term.st !== 2 && (
            <>
              {/* Approve: Draft st === 0 */}
              {term.st === 0 && (
                <button
                  className="btn btn-secondary w-full"
                  style={{ justifyContent: 'center' }}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('approve', 'Approve')}
                >
                  {loadingAction === 'approve' ? '⌛ Approving...' : '✅ Approve Version'}
                </button>
              )}

              {/* Publish: Approved st === 1 and not published */}
              {term.st === 1 && !term.published && (
                <button
                  className="btn btn-primary w-full"
                  style={{ justifyContent: 'center' }}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('publish', 'Publish')}
                >
                  {loadingAction === 'publish' ? '⌛ Publishing...' : '🚀 Publish Version'}
                </button>
              )}

              {/* Unpublish: published === true */}
              {term.published && (
                <button
                  className="btn btn-secondary w-full"
                  style={{ justifyContent: 'center' }}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('unpublish', 'Unpublish')}
                >
                  {loadingAction === 'unpublish' ? '⌛ Unpublishing...' : '🔒 Unpublish Version'}
                </button>
              )}
            </>
          )}

          {/* Edit Button */}
          {canEdit && term.st === 0 && (
            <Link
              href={`/dashboard/terms/${term.id}/edit?scope=${scope}${companyId !== 'general' ? `&company=${companyId}` : ''}`}
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center' }}
            >
              📝 Edit Draft
            </Link>
          )}

          {/* Delete Button */}
          {canPublish && term.st !== 2 && (
            <button
              className="btn btn-danger w-full"
              style={{ justifyContent: 'center' }}
              disabled={loadingAction !== null || term.published}
              onClick={handleDelete}
              title={term.published ? 'Unpublish the version before deleting' : 'Delete version'}
            >
              {loadingAction === 'delete' ? '⌛ Deleting...' : '🗑 Delete Version'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
