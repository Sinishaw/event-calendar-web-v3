'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/user';

interface UserFormProps {
  user?: UserProfile; // If editing
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;

  const [email, setEmail] = useState(user?.email ?? '');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [disabled, setDisabled] = useState(user?.disabled ?? false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified ?? false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle image preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
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
      
      if (password) {
        formData.append('password', password);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const url = isEdit ? `/api/admin/users/${user.uid}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save user profile');
      }

      setSuccess(isEdit ? 'Profile updated successfully!' : 'User created successfully!');

      if (!isEdit) {
        // Redirect to detail page of the newly created user
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
        {/* Form Fields & Photo Side-by-Side on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Left Column: Form Details */}
          <div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (with + prefix)</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251911..."
                disabled={loading}
              />
              <span className="form-hint">E.g., +251911122233</span>
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label htmlFor="password">
                {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Password (min 6 chars)'}
                required={!isEdit}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="verifyPassword">Verify Password</label>
              <input
                id="verifyPassword"
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Verify Password'}
                required={!isEdit || !!password}
                disabled={loading}
              />
            </div>

            <hr className="divider" />

            <div className="flex gap-4" style={{ marginTop: '1rem' }}>
              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input
                  id="emailVerified"
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                  disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="emailVerified" style={{ margin: 0, cursor: 'pointer' }}>Email Verified</label>
              </div>

              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input
                  id="disabled"
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="disabled" style={{ margin: 0, cursor: 'pointer' }}>Disabled (Locked)</label>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Picture Upload */}
          <div className="flex flex-col items-center" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', width: '100%', textAlign: 'center' }}>Profile Photo</h3>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '240px',
                height: '240px',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'var(--bg-deep)',
                position: 'relative',
                transition: 'border-color var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="text-muted flex flex-col items-center gap-2" style={{ textAlign: 'center', padding: '1rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-xs">Browse Profile Picture</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={loading}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Choose Image
            </button>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving…' : isEdit ? 'Update Profile' : 'Create User'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push(isEdit ? `/dashboard/admin/users/${user.uid}` : '/dashboard/admin/users')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
