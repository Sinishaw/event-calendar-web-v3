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

        {content.st === 1 && !content.notified && (
          <button
            onClick={handleNotify}
            disabled={loading}
            className="btn btn-primary btn-sm w-full"
          >
            {loading ? 'Sending…' : 'Send Push Notification (FCM)'}
          </button>
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
