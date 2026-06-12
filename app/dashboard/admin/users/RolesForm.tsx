'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';
import { Company } from '@/types/company';

interface RolesFormProps {
  user: UserProfile;
  companies: Company[];
}

export default function RolesForm({ user, companies }: RolesFormProps) {
  const router = useRouter();

  const [admin, setAdmin] = useState(user.admin);
  const [creater, setCreater] = useState(user.creater);
  const [publisher, setPublisher] = useState(user.publisher);
  const [company, setCompany] = useState(user.company === 'Not Assigned' ? '' : (user.company ?? ''));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.uid}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin,
          creater,
          publisher,
          company: company || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update user roles');
      }

      setSuccess('User roles and company assignment updated successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5zm0 7.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
          {success}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="company">Company Assignment</label>
        <select
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Select Company (None) --</option>
          {companies.map((c) => (
            <option key={c.company} value={c.company}>
              {c.name} ({c.company})
            </option>
          ))}
        </select>
        <span className="form-hint">Assign this user to a company for content ownership.</span>
      </div>

      <hr className="divider" />

      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Access Control Roles</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
          <input
            id="role-admin"
            type="checkbox"
            checked={admin}
            onChange={(e) => setAdmin(e.target.checked)}
            disabled={loading}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <div style={{ cursor: 'pointer' }}>
            <label htmlFor="role-admin" style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>ADMIN</label>
            <span className="text-xs text-muted" style={{ display: 'block' }}>Can perform full system setup, manage companies and users.</span>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
          <input
            id="role-creater"
            type="checkbox"
            checked={creater}
            onChange={(e) => setCreater(e.target.checked)}
            disabled={loading}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <div style={{ cursor: 'pointer' }}>
            <label htmlFor="role-creater" style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>CREATOR (CREATER)</label>
            <span className="text-xs text-muted" style={{ display: 'block' }}>Can add month images, content articles, and terms.</span>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
          <input
            id="role-publisher"
            type="checkbox"
            checked={publisher}
            onChange={(e) => setPublisher(e.target.checked)}
            disabled={loading}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <div style={{ cursor: 'pointer' }}>
            <label htmlFor="role-publisher" style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>PUBLISHER</label>
            <span className="text-xs text-muted" style={{ display: 'block' }}>Can approve and publish content, images, and config.</span>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ marginTop: '2rem' }} />

      <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Applying…' : 'Apply Roles'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push(`/dashboard/admin/users/${user.uid}`)}
          disabled={loading}
        >
          Back to Details
        </button>
      </div>
    </form>
  );
}
