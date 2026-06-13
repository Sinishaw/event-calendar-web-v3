'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';
import { Company } from '@/types/company';

interface UserFormProps {
  user?: UserProfile;                // Editing existing user
  companies: Company[];              // Available companies for assignment
  actorIsSuperAdmin: boolean;        // Whether the acting admin is a Super Admin
  actorCompany?: string;             // Tenant admin's own company (restricts assignment)
}

export default function UserForm({ user, companies, actorIsSuperAdmin, actorCompany }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;

  // Profile fields
  const [email, setEmail] = useState(user?.email ?? '');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [disabled, setDisabled] = useState(user?.disabled ?? false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified ?? false);

  // Roles
  const [superAdmin, setSuperAdmin] = useState(user?.superAdmin ?? false);
  const [admin, setAdmin] = useState(user?.admin ?? false);
  const [creater, setCreater] = useState(user?.creater ?? false);
  const [publisher, setPublisher] = useState(user?.publisher ?? false);
  const [company, setCompany] = useState<string>(
    actorIsSuperAdmin
      ? (user?.company === 'Not Assigned' ? '' : (user?.company ?? ''))
      : (actorCompany ?? '')
  );

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // When superAdmin is toggled on, auto-clear tenant roles
  function handleSuperAdminToggle(checked: boolean) {
    setSuperAdmin(checked);
    if (checked) {
      setAdmin(false);
      setCreater(false);
      setPublisher(false);
      setCompany('');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !displayName) {
      setError('Email and Display Name are required');
      return;
    }
    if (!isEdit && !password) {
      setError('Password is required for new users');
      return;
    }
    if (password && password !== verifyPassword) {
      setError('Passwords do not match');
      return;
    }
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      setError('Phone number must start with + followed by country code (e.g. +251...)');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('displayName', displayName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('emailVerified', String(emailVerified));
      formData.append('disabled', String(disabled));
      if (password) formData.append('password', password);
      if (photoFile) formData.append('photo', photoFile);

      // Roles — always included, API enforces what's allowed
      formData.append('updateRoles', 'true');
      formData.append('superAdmin', String(superAdmin));
      formData.append('admin', String(admin));
      formData.append('creater', String(creater));
      formData.append('publisher', String(publisher));
      formData.append('company', company || '');

      const url = isEdit ? `/api/admin/users/${user.uid}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Failed to save user');

      setSuccess(isEdit ? 'User updated successfully!' : 'User created successfully!');

      if (!isEdit) {
        router.push(`/dashboard/admin/users/${result.data.uid}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const ROLE_BADGE_COLORS: Record<string, string> = {
    'Super Admin': 'badge-danger',
    Admin: 'badge-warning',
    Creator: 'badge-accent',
    Publisher: 'badge-info',
  };

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* ── Section 1: Profile + Photo ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Profile Fields */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text)' }}>Profile Information</h3>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com" required disabled={loading} />
            </div>

            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name" required disabled={loading} />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (optional)</label>
              <input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251911..." disabled={loading} />
              <span className="form-hint">Must start with country code, e.g. +251911122233</span>
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label htmlFor="password">{isEdit ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Min 6 characters'} required={!isEdit} disabled={loading} />
            </div>

            <div className="form-group">
              <label htmlFor="verifyPassword">Verify Password</label>
              <input id="verifyPassword" type="password" value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Repeat password'} required={!isEdit || !!password} disabled={loading} />
            </div>

            <hr className="divider" />

            <div className="flex gap-4">
              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="emailVerified" type="checkbox" checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)} disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="emailVerified" style={{ margin: 0, cursor: 'pointer' }}>Email Verified</label>
              </div>
              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="disabled" type="checkbox" checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)} disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="disabled" style={{ margin: 0, cursor: 'pointer' }}>Disabled (Locked)</label>
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="flex flex-col items-center" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', width: '100%', textAlign: 'center' }}>Profile Photo</h3>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '220px', height: '220px',
                border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-deep)',
                transition: 'border-color var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="text-muted flex flex-col items-center gap-2" style={{ textAlign: 'center', padding: '1rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-xs">Click to browse image</span>
                </div>
              )}
            </div>

            <input ref={fileInputRef} id="photo" type="file" accept="image/*"
              onChange={handleFileChange} style={{ display: 'none' }} disabled={loading} />

            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}
              onClick={() => fileInputRef.current?.click()} disabled={loading}>
              Choose Image
            </button>
          </div>
        </div>

        {/* ── Section 2: Roles & Company ── */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>
            Access Roles &amp; Company Assignment
          </h3>
          <p className="text-xs text-muted" style={{ marginBottom: '1.5rem' }}>
            Assign this user's role level and tenant. Roles determine what sections they can access.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Role Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Super Admin — only shown to Super Admins */}
              {actorIsSuperAdmin && (
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    background: superAdmin ? 'rgba(239,68,68,0.08)' : 'var(--bg-deep)',
                    border: `1px solid ${superAdmin ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius)', padding: '0.875rem 1rem',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    userSelect: 'none',
                  }}
                  onClick={() => !loading && handleSuperAdminToggle(!superAdmin)}
                >
                  <input id="role-superadmin" type="checkbox" checked={superAdmin}
                    onChange={(e) => handleSuperAdminToggle(e.target.checked)} disabled={loading}
                    style={{ width: 'auto', cursor: 'pointer', marginTop: '2px', accentColor: 'var(--danger)' }}
                    onClick={(e) => e.stopPropagation()} />
                  <div>
                    <label htmlFor="role-superadmin" style={{ margin: 0, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem' }}>
                      SUPER ADMIN
                    </label>
                    <span className="text-xs" style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Global access — manages all companies, users, and global topics. No tenant restriction.
                    </span>
                  </div>
                </div>
              )}

              {/* Tenant roles — disabled when superAdmin is selected */}
              {[
                { id: 'role-admin', label: 'ADMIN', description: "Manages their company's content, users, and configuration.", state: admin, setter: setAdmin },
                { id: 'role-creater', label: 'CREATOR', description: 'Creates month images, content articles, and topic entries.', state: creater, setter: setCreater },
                { id: 'role-publisher', label: 'PUBLISHER', description: 'Reviews and publishes content, approves images and config.', state: publisher, setter: setPublisher },
              ].map(({ id, label, description, state, setter }) => (
                <div
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    background: state ? 'rgba(var(--accent-rgb, 99 102 241), 0.08)' : 'var(--bg-deep)',
                    border: `1px solid ${state ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius)', padding: '0.875rem 1rem',
                    cursor: superAdmin || loading ? 'not-allowed' : 'pointer',
                    opacity: superAdmin ? 0.5 : 1,
                    transition: 'all var(--transition)', userSelect: 'none',
                  }}
                  onClick={() => !loading && !superAdmin && setter(!state)}
                >
                  <input id={id} type="checkbox" checked={state}
                    onChange={(e) => setter(e.target.checked)} disabled={loading || superAdmin}
                    style={{ width: 'auto', cursor: 'pointer', marginTop: '2px' }}
                    onClick={(e) => e.stopPropagation()} />
                  <div>
                    <label htmlFor={id} style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontSize: '0.875rem' }}>
                      {label}
                    </label>
                    <span className="text-xs" style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {description}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Company Assignment */}
            <div>
              <div className="form-group">
                <label htmlFor="company">Company Assignment</label>
                {actorIsSuperAdmin ? (
                  <>
                    <select id="company" value={company} onChange={(e) => setCompany(e.target.value)}
                      disabled={loading || superAdmin}>
                      <option value="">— None (unassigned) —</option>
                      {companies.map((c) => (
                        <option key={c.company} value={c.company}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                    <span className="form-hint">
                      {superAdmin ? 'Super Admins are not scoped to a company.' : 'Scopes the user to a specific tenant.'}
                    </span>
                  </>
                ) : (
                  <>
                    <input type="text" value={actorCompany || 'Your Company'} disabled
                      style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                    <span className="form-hint">Tenant Admins can only create users within their own company.</span>
                  </>
                )}
              </div>

              {/* Preview active roles */}
              <div style={{ marginTop: '1rem' }}>
                <span className="text-xs text-muted" style={{ fontWeight: 600 }}>ACTIVE ROLE PREVIEW</span>
                <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.5rem' }}>
                  {superAdmin && <span className="badge badge-danger">Super Admin</span>}
                  {admin && !superAdmin && <span className="badge badge-warning">Admin</span>}
                  {creater && !superAdmin && <span className="badge badge-accent">Creator</span>}
                  {publisher && !superAdmin && <span className="badge badge-info">Publisher</span>}
                  {!superAdmin && !admin && !creater && !publisher && (
                    <span className="text-xs text-faint">No roles selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
          <button type="button" className="btn btn-secondary" disabled={loading}
            onClick={() => router.push(isEdit ? `/dashboard/admin/users/${user.uid}` : '/dashboard/admin/users')}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
