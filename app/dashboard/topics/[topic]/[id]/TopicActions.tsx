'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicContent } from '@/services/topic-content.service';

interface TopicActionsProps {
  content: TopicContent;
  isPublisher: boolean;
}

export default function TopicActions({ content, isPublisher }: TopicActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmResend, setConfirmResend] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  async function handleApprove() {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/topics/${content.topic}/${content.id}/approve`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to approve content');
      }

      setSuccess('Topic content approved and published successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/topics/${content.topic}/${content.id}/unpublish`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to unpublish content');
      }

      setSuccess('Topic content unpublished and reverted to Draft successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleNotify() {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/topics/${content.topic}/${content.id}/notify`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to send topic push notification');
      }

      setSuccess('FCM Topic Notification broadcasted successfully!');
      setConfirmResend(false);
      setShowSendConfirm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete topic article "${content.title}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/topics/${content.topic}/${content.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete topic content');
      }

      setSuccess('Topic content archived successfully!');
      router.push('/dashboard/topics');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  if (!isPublisher) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {error && (
        <div className="alert alert-danger mb-2" role="alert" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-2" role="alert" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%' }}>
        {content.st !== 1 && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn btn-success btn-sm w-full"
          >
            {loading ? 'Processing…' : 'Approve & Publish'}
          </button>
        )}

        {content.st === 1 && (
          <button
            onClick={handleUnpublish}
            disabled={loading}
            className="btn btn-secondary btn-sm w-full"
          >
            {loading ? 'Processing…' : 'Unpublish / Revert to Draft'}
          </button>
        )}

        {content.st === 1 && !content.notified && !showSendConfirm && (
          <button
            onClick={() => setShowSendConfirm(true)}
            disabled={loading}
            className="btn btn-primary btn-sm w-full"
          >
            Send Push Notification (FCM)
          </button>
        )}

        {content.st === 1 && content.notified && !showSendConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <label htmlFor="confirmResend" style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap' }}>
                Confirm resend
              </label>
              <input
                type="checkbox"
                className="form-check-input"
                id="confirmResend"
                checked={confirmResend}
                onChange={(e) => setConfirmResend(e.target.checked)}
                style={{ margin: 0, flexShrink: 0 }}
              />
            </div>
            {content.successCount > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Sent successfully {content.successCount} time{content.successCount === 1 ? '' : 's'}
              </p>
            )}
            <button
              onClick={() => setShowSendConfirm(true)}
              disabled={loading || !confirmResend}
              className="btn btn-primary btn-sm w-full"
            >
              Resend Push Notification (FCM)
            </button>
          </div>
        )}

        {content.st === 1 && showSendConfirm && (
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius)', padding: '0.75rem', width: '100%',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, margin: 0 }}>
              {content.notified ? 'Resend' : 'Send'} push notification for &quot;{content.title}&quot;?
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              This cannot be reverted once it is sent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleNotify}
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
              >
                {loading ? 'Sending…' : 'Yes, Send'}
              </button>
              <button
                onClick={() => setShowSendConfirm(false)}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {content.st !== 2 && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger btn-sm w-full"
          >
            {loading ? 'Processing…' : 'Delete Article'}
          </button>
        )}
      </div>
    </div>
  );
}
