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

  async function handleToggleStatus() {
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('disabled', String(!user.disabled));

      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update user status');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.displayName || user.email}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

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

        <button
          onClick={handleDeleteUser}
          disabled={loading}
          className="btn btn-danger btn-sm w-full"
        >
          {loading ? 'Processing…' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
