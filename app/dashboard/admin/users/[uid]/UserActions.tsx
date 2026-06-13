'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';

interface UserActionsProps {
  user: UserProfile;
}

export default function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleToggleStatus() {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('disabled', String(!user.disabled));

      const res = await fetch(`/api/admin/users/${user.uid}`, { method: 'PUT', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update user status');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete user');
      router.push('/dashboard/admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="alert alert-danger" role="alert" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 w-full">
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className={`btn ${user.disabled ? 'btn-success' : 'btn-secondary'} btn-sm w-full`}
        >
          {loading ? 'Processing…' : user.disabled ? 'Enable Account' : 'Disable Account'}
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="btn btn-danger btn-sm w-full"
          >
            Delete Account
          </button>
        ) : (
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius)', padding: '0.75rem', width: '100%',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, margin: 0 }}>
              Permanently delete &quot;{user.displayName || user.email}&quot;?
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="btn btn-danger btn-sm"
                style={{ flex: 1 }}
              >
                {loading ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
