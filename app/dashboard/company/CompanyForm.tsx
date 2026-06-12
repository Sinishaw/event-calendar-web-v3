'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Company } from '@/types/company';

interface CompanyFormProps {
  company?: Company | null; // If editing
}

export default function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;

  const [companyId, setCompanyId] = useState(company?.company ?? '');
  const [name, setName] = useState(company?.name ?? '');
  const [category, setCategory] = useState(company?.category ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [established, setEstablished] = useState(company?.established ?? '');
  const [address, setAddress] = useState(company?.address ?? '');
  const [phone, setPhone] = useState(company?.phone ?? '');
  const [pobox, setPobox] = useState(company?.pobox ?? '');
  const [website, setWebsite] = useState(company?.website ?? '');
  const [email, setEmail] = useState(company?.email ?? '');
  const [vUrl, setVUrl] = useState(company?.vUrl ?? '');
  const [wUrl, setWUrl] = useState(company?.wUrl ?? '');
  const [mission, setMission] = useState(company?.mission ?? '');
  const [vision, setVision] = useState(company?.vision ?? '');
  const [facebook, setFacebook] = useState(company?.facebook ?? '');
  const [twitter, setTwitter] = useState(company?.twitter ?? '');
  const [youtube, setYoutube] = useState(company?.youtube ?? '');
  const [instagram, setInstagram] = useState(company?.instagram ?? '');

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(company?.iUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle image preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo image must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      setDeletePhoto(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setDeletePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!isEdit && !companyId) {
      setError('Company ID is required');
      return;
    }
    if (!name) {
      setError('Company Name is required');
      return;
    }

    if (!isEdit && !/^[a-z0-9-]+$/.test(companyId)) {
      setError('Company ID must be lowercase alphanumeric and dashes only (e.g. elexicon-corp)');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('established', established);
      formData.append('address', address);
      formData.append('phone', phone);
      formData.append('pobox', pobox);
      formData.append('website', website);
      formData.append('email', email);
      formData.append('vUrl', vUrl);
      formData.append('wUrl', wUrl);
      formData.append('mission', mission);
      formData.append('vision', vision);
      formData.append('facebook', facebook);
      formData.append('twitter', twitter);
      formData.append('youtube', youtube);
      formData.append('instagram', instagram);

      if (!isEdit) {
        formData.append('company', companyId);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (deletePhoto) {
        formData.append('deletePhoto', 'true');
      }

      const url = isEdit ? `/api/company/${company?.company}` : '/api/company';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save company profile');
      }

      setSuccess(isEdit ? 'Company profile updated successfully!' : 'Company created successfully!');

      if (!isEdit) {
        router.push(`/dashboard/company/${result.data.company}`);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Left: General Fields */}
          <div>
            {!isEdit && (
              <div className="form-group">
                <label htmlFor="companyId">Company ID (URL identifier)</label>
                <input
                  id="companyId"
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="e.g. google, mmcy, elexicon"
                  required
                  disabled={loading}
                />
                <span className="form-hint">Lowercase alphanumeric and dashes only. This acts as the unique URL segment.</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Company Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MMCY Tech"
                required
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Technology"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="established">Established Year</label>
                <input
                  id="established"
                  type="text"
                  value={established}
                  onChange={(e) => setEstablished(e.target.value)}
                  placeholder="e.g. 2012-05-15"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Company profile description..."
                rows={3}
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Contact Info</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +251..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Addis Ababa, Ethiopia"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pobox">P.O. Box</label>
                <input
                  id="pobox"
                  type="text"
                  value={pobox}
                  onChange={(e) => setPobox(e.target.value)}
                  placeholder="e.g. 1000"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="website">Website URL</label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://www.company.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Right: Upload & Socials */}
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
            {/* Logo Upload */}
            <div className="flex flex-col items-center mb-6">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', width: '100%', textAlign: 'center' }}>Company Logo</h3>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '200px',
                  height: '200px',
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
                    alt="Company Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
                  />
                ) : (
                  <div className="text-muted flex flex-col items-center gap-2" style={{ textAlign: 'center', padding: '1rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="text-xs">Browse Logo Picture</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />

              <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Choose Logo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRemovePhoto}
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Media & Socials</h3>

            <div className="form-group">
              <label htmlFor="mission">Mission Statement</label>
              <textarea
                id="mission"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Company mission statement..."
                rows={2}
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vision">Vision Statement</label>
              <textarea
                id="vision"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Company vision statement..."
                rows={2}
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="facebook">Facebook Link</label>
                <input
                  id="facebook"
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="twitter">Twitter Link</label>
                <input
                  id="twitter"
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="youtube">YouTube Link</label>
                <input
                  id="youtube"
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="instagram">Instagram Link</label>
                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vUrl">Video URL (GCS/Stream)</label>
                <input
                  id="vUrl"
                  type="url"
                  value={vUrl}
                  onChange={(e) => setVUrl(e.target.value)}
                  placeholder="e.g. video streaming url"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="wUrl">Weather URL (Embed)</label>
                <input
                  id="wUrl"
                  type="url"
                  value={wUrl}
                  onChange={(e) => setWUrl(e.target.value)}
                  placeholder="e.g. weather widgets url"
                  disabled={loading}
                />
              </div>
            </div>

          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving…' : isEdit ? 'Update Profile' : 'Create Company'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push(isEdit ? `/dashboard/company/${company?.company}` : '/dashboard/company')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
