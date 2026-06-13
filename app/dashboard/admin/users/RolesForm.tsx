'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';
import { Company } from '@/types/company';

interface RolesFormProps {
  user: UserProfile;
  companies: Company[];
  actorIsSuperAdmin: boolean;
  actorCompany?: string;
}

export default function RolesForm({ user, companies, actorIsSuperAdmin, actorCompany }: RolesFormProps) {
  const router = useRouter();

  const [superAdmin, setSuperAdmin] = useState(user.superAdmin);
  const [admin, setAdmin] = useState(user.admin);
  const [creater, setCreater] = useState(user.creater);
  const [publisher, setPublisher] = useState(user.publisher);
  const [company, setCompany] = useState(
    actorIsSuperAdmin
      ? (user.company === 'Not Assigned' ? '' : (user.company ?? ''))
      : (actorCompany ?? '')
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSuperAdminToggle(checked: boolean) {
    setSuperAdmin(checked);
    if (checked) {
      setAdmin(false);
      setCreater(false);
      setPublisher(false);
      setCompany('');
    }
  }

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
          superAdmin,
          admin,
          creater,
          publisher,
          company: company || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update roles');

      setSuccess('Roles updated successfully. User must sign out and back in for changes to apply.');
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

      {/* Company */}
      <div className="form-group">
        <label htmlFor="roles-company">Company Assignment</label>
        {actorIsSuperAdmin ? (
          <>
            <select id="roles-company" value={company} onChange={(e) => setCompany(e.target.value)}
              disabled={loading || superAdmin}>
              <option value="">— None (unassigned) —</option>
              {companies.map((c) => (
                <option key={c.company} value={c.company}>{c.name} ({c.company})</option>
              ))}
            </select>
            <span className="form-hint">
              {superAdmin ? 'Super Admins are not scoped to a company.' : 'Scopes this user to a specific tenant.'}
            </span>
          </>
        ) : (
          <>
            <input type="text" value={actorCompany || 'Your Company'} disabled style={{ opacity: 0.7 }} />
            <span className="form-hint">Tenant Admins can only assign users within their own company.</span>
          </>
        )}
      </div>

      <hr className="divider" />
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Access Control Roles</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Super Admin — only for Super Admins */}
        {actorIsSuperAdmin && (
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              background: superAdmin ? 'rgba(239,68,68,0.08)' : 'var(--bg-deep)',
              border: `1px solid ${superAdmin ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius)', padding: '0.75rem',
              cursor: 'pointer', userSelect: 'none', transition: 'all var(--transition)',
            }}
            onClick={() => !loading && handleSuperAdminToggle(!superAdmin)}
          >
            <input id="roles-superadmin" type="checkbox" checked={superAdmin}
              onChange={(e) => handleSuperAdminToggle(e.target.checked)} disabled={loading}
              style={{ width: 'auto', cursor: 'pointer', marginTop: '2px', accentColor: 'var(--danger)' }}
              onClick={(e) => e.stopPropagation()} />
            <div>
              <label htmlFor="roles-superadmin" style={{ margin: 0, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}>SUPER ADMIN</label>
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '0.15rem' }}>
                Global platform access — not scoped to any company.
              </span>
            </div>
          </div>
        )}

        {[
          { id: 'roles-admin', label: 'ADMIN', description: "Manages their tenant's users, content, and configuration.", state: admin, setter: setAdmin },
          { id: 'roles-creater', label: 'CREATOR', description: 'Creates content, month images, and topic articles.', state: creater, setter: setCreater },
          { id: 'roles-publisher', label: 'PUBLISHER', description: 'Approves and publishes content and media.', state: publisher, setter: setPublisher },
        ].map(({ id, label, description, state, setter }) => (
          <div
            key={id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              background: state ? 'rgba(var(--accent-rgb, 99 102 241), 0.06)' : 'var(--bg-deep)',
              border: `1px solid ${state ? 'var(--accent)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius)', padding: '0.75rem',
              cursor: superAdmin || loading ? 'not-allowed' : 'pointer',
              opacity: superAdmin ? 0.5 : 1, userSelect: 'none',
              transition: 'all var(--transition)',
            }}
            onClick={() => !loading && !superAdmin && setter(!state)}
          >
            <input id={id} type="checkbox" checked={state} onChange={(e) => setter(e.target.checked)}
              disabled={loading || superAdmin} style={{ width: 'auto', cursor: 'pointer', marginTop: '2px' }}
              onClick={(e) => e.stopPropagation()} />
            <div>
              <label htmlFor={id} style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>{label}</label>
              <span className="text-xs text-muted" style={{ display: 'block', marginTop: '0.15rem' }}>{description}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="divider" style={{ marginTop: '1.5rem' }} />

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Applying…' : 'Apply Roles'}
        </button>
        <button type="button" className="btn btn-secondary" disabled={loading}
          onClick={() => router.push(`/dashboard/admin/users/${user.uid}`)}>
          Back to Details
        </button>
      </div>
    </form>
  );
}
