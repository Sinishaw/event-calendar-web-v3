'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyContent } from '@/types/content';
import { CategoryOption } from '@/services/remote-config.service';

interface ContentFormProps {
  content?: CompanyContent | null; // If editing
  categories: CategoryOption[];
}

export default function ContentForm({ content, categories }: ContentFormProps) {
  const router = useRouter();
  const isEdit = !!content;

  // Helper to split ISO datetime into separate date and time fields
  const splitDateTime = (isoStr?: string) => {
    if (!isoStr) return { date: '', time: '00:00' };
    try {
      const d = new Date(isoStr);
      // Format to YYYY-MM-DD
      const date = d.toISOString().split('T')[0];
      // Format to HH:MM (local time representation)
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return { date, time: `${hours}:${minutes}` };
    } catch {
      return { date: '', time: '00:00' };
    }
  };

  const initFr = splitDateTime(content?.frD);
  const initTo = splitDateTime(content?.toD);
  const initMark = splitDateTime(content?.markDate);
  const initExp = splitDateTime(content?.fetchExpirationDate);

  // Form Fields State
  const [title, setTitle] = useState(content?.title ?? '');
  const [body, setBody] = useState(content?.body ?? '');
  const [description, setDescription] = useState(content?.description ?? '');
  const [category, setCategory] = useState(content?.category ?? (categories[0]?.value || ''));
  const [nationalDay, setNationalDay] = useState(content?.nationalDay ?? '');
  const [tagColor, setTagColor] = useState(content?.tagColor ?? '-1');
  const [ageRestriction, setAgeRestriction] = useState(content?.ageRestriction ?? '0');
  const [vUrl, setVUrl] = useState(content?.vUrl ?? '');
  const [wUrl, setWUrl] = useState(content?.wUrl ?? '');

  // Flags State
  const [notifyUser, setNotifyUser] = useState(content?.notifyUser ?? false);
  const [markOnCalendar, setMarkOnCalendar] = useState(content?.markOnCalendar ?? false);

  // Date and Time inputs State
  const [frD_date, setFrD_date] = useState(initFr.date);
  const [frD_time, setFrD_time] = useState(initFr.time);

  const [toD_date, setToD_date] = useState(initTo.date);
  const [toD_time, setToD_time] = useState(initTo.time);

  const [markDate_date, setMarkDate_date] = useState(initMark.date || initFr.date);
  const [markDate_time, setMarkDate_time] = useState(initMark.time || initFr.time);

  const [exp_date, setExp_date] = useState(initExp.date);
  const [exp_time, setExp_time] = useState(initExp.time);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(content?.iUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-fill expiration and mark dates based on "From Date" to simplify UX
  function handleFrDateChange(dateVal: string) {
    setFrD_date(dateVal);
    if (!toD_date) setToD_date(dateVal);
    if (!markDate_date) setMarkDate_date(dateVal);
    if (!exp_date) {
      // Default expiration to 1 week after From Date
      try {
        const d = new Date(dateVal);
        d.setDate(d.getDate() + 7);
        setExp_date(d.toISOString().split('T')[0]);
      } catch {}
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Banner image must be under 3MB');
        return;
      }
      setPhotoFile(file);
      setDeletePhoto(false);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
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

    // Validations
    if (!title || !body || !description) {
      setError('Title, Article Body, and Brief Summary are required');
      return;
    }
    if (!frD_date || !frD_time || !toD_date || !toD_time || !exp_date || !exp_time) {
      setError('From, To, and Expiration Date/Time fields are required');
      return;
    }
    if (markOnCalendar && (!markDate_date || !markDate_time)) {
      setError('Please provide the Mark on Calendar Date and Time');
      return;
    }

    setLoading(true);

    try {
      const formatISO = (d: string, t: string) => {
        return new Date(`${d}T${t}`).toISOString();
      };

      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('nationalDay', nationalDay);
      formData.append('tagColor', tagColor);
      formData.append('ageRestriction', ageRestriction);
      formData.append('vUrl', vUrl);
      formData.append('wUrl', wUrl);
      formData.append('notifyUser', String(notifyUser));
      formData.append('markOnCalendar', String(markOnCalendar));

      formData.append('frD', formatISO(frD_date, frD_time));
      formData.append('toD', formatISO(toD_date, toD_time));
      formData.append('fetchExpirationDate', formatISO(exp_date, exp_time));

      if (markOnCalendar) {
        formData.append('markDate', formatISO(markDate_date, markDate_time));
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (deletePhoto) {
        formData.append('deletePhoto', 'true');
      }

      const url = isEdit ? `/api/content/${content?.id}` : '/api/content';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save content article');
      }

      setSuccess(isEdit ? 'Article updated successfully!' : 'Article created successfully!');

      if (!isEdit) {
        router.push(`/dashboard/content/${result.data.id}`);
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
            <div className="form-group">
              <label htmlFor="title">Article Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual General Assembly Meeting"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Brief Summary / Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary (1-2 sentences) used in push alerts and lists..."
                rows={2}
                required
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="body">Article Body</label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Detailed article body text..."
                rows={6}
                required
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val.toLowerCase().replace(/\s/g, '') !== 'nationalday') {
                      setNationalDay('');
                    }
                  }}
                  disabled={loading}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ageRestriction">Age Restriction</label>
                <select
                  id="ageRestriction"
                  value={ageRestriction}
                  onChange={(e) => setAgeRestriction(e.target.value)}
                  disabled={loading}
                >
                  <option value="0">All Ages (0+)</option>
                  <option value="12">Teenagers (12+)</option>
                  <option value="16">Young Adults (16+)</option>
                  <option value="18">Adults Only (18+)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tagColor">Theme tag color</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    id="tagColor"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    <option value="-1">-- None --</option>
                    <option value="regular">Regular</option>
                    <option value="moderate">Moderate</option>
                    <option value="important">Important</option>
                    <option value="veryimportant">Very Important</option>
                  </select>
                  
                  {/* Visual color indicator box */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: tagColor === 'regular' ? '#009900' :
                                  tagColor === 'moderate' ? '#e7eb34' :
                                  tagColor === 'important' ? '#FFA500' :
                                  tagColor === 'veryimportant' ? '#FF0000' :
                                  'transparent',
                      flexShrink: 0
                    }}
                    title="Predefined tag color indicator"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nationalDay">National Day (Optional)</label>
                <select
                  id="nationalDay"
                  value={nationalDay}
                  onChange={(e) => setNationalDay(e.target.value)}
                  disabled={category.toLowerCase().replace(/\s/g, '') !== 'nationalday' || loading}
                >
                  <option value="">-- Not National Day --</option>
                  <option value="newYear">የኢትዮጵያ አዲስ ዓመት/እንቁጣጣሽ</option>
                  <option value="meskel">የመስቀል በዓል</option>
                  <option value="genna">ልደቱ ለእግዚእነ/ገና/</option>
                  <option value="timket">የጥምቀት በዓል</option>
                  <option value="fasika">የትንሳኤ በዓል</option>
                  <option value="siklet">የስቅለት በዓል</option>
                  <option value="adwa">የአድዋ ድል በዓል</option>
                  <option value="labaderoch">የላባደሮች ቀን</option>
                  <option value="arbegnoch">የአርበኞች የድል ቀን</option>
                  <option value="eidAlFitur">የኢድ አልፈጥር በዓል</option>
                  <option value="eidAlAdha">የኢድ አልአድሀ/አረፋ/ በዓል</option>
                  <option value="mewlid">የመውሊድ በዓል</option>
                  <option value="ginbot20">ደርግ የወደቀበት ቀን</option>
                </select>
              </div>
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Display Schedules</h3>

            {/* From Date Time */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="frD_date">Event Starts (From Date)</label>
                <input
                  id="frD_date"
                  type="date"
                  value={frD_date}
                  onChange={(e) => handleFrDateChange(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="frD_time">From Time</label>
                <input
                  id="frD_time"
                  type="time"
                  value={frD_time}
                  onChange={(e) => setFrD_time(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* To Date Time */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="toD_date">Event Ends (To Date)</label>
                <input
                  id="toD_date"
                  type="date"
                  value={toD_date}
                  onChange={(e) => setToD_date(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="toD_time">To Time</label>
                <input
                  id="toD_time"
                  type="time"
                  value={toD_time}
                  onChange={(e) => setToD_time(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Expiration Date Time */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="exp_date">Fetch Expiration (Archive Date)</label>
                <input
                  id="exp_date"
                  type="date"
                  value={exp_date}
                  onChange={(e) => setExp_date(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="exp_time">Expiration Time</label>
                <input
                  id="exp_time"
                  type="time"
                  value={exp_time}
                  onChange={(e) => setExp_time(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

          </div>

          {/* Right: Uploads & Media */}
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem' }}>
            
            {/* Banner Image */}
            <div className="flex flex-col items-center mb-6">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', width: '100%', textAlign: 'center' }}>Header Banner Image</h3>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: '180px',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'var(--bg-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Header Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div className="text-muted flex flex-col items-center gap-2" style={{ textAlign: 'center', padding: '1rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="text-xs">Browse Banner Image</span>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={loading} />

              <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  Choose Image
                </button>
                {photoPreview && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleRemovePhoto} disabled={loading}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>External Media URLs</h3>

            <div className="form-group">
              <label htmlFor="vUrl">Video Embed URL</label>
              <input id="vUrl" type="url" value={vUrl} onChange={(e) => setVUrl(e.target.value)} placeholder="https://..." disabled={loading} />
            </div>

            <div className="form-group">
              <label htmlFor="wUrl">Weather Widget Embed URL</label>
              <input id="wUrl" type="url" value={wUrl} onChange={(e) => setWUrl(e.target.value)} placeholder="https://..." disabled={loading} />
            </div>

            <hr className="divider" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Interactivity & Notifications</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input
                  id="notifyUser"
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="notifyUser" style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    Request Push notification
                  </label>
                  <span className="text-xs text-muted" style={{ display: 'block' }}>Ask publisher to send an FCM alert once approved.</span>
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input
                  id="markOnCalendar"
                  type="checkbox"
                  checked={markOnCalendar}
                  onChange={(e) => setMarkOnCalendar(e.target.checked)}
                  disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="markOnCalendar" style={{ margin: 0, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    Mark on Calendar
                  </label>
                  <span className="text-xs text-muted" style={{ display: 'block' }}>Flag this event to highlight on the client calendar.</span>
                </div>
              </div>
            </div>

            {markOnCalendar && (
              <div className="form-row" style={{ marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="markDate_date">Highlight Date</label>
                  <input
                    id="markDate_date"
                    type="date"
                    value={markDate_date}
                    onChange={(e) => setMarkDate_date(e.target.value)}
                    required={markOnCalendar}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="markDate_time">Highlight Time</label>
                  <input
                    id="markDate_time"
                    type="time"
                    value={markDate_time}
                    onChange={(e) => setMarkDate_time(e.target.value)}
                    required={markOnCalendar}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        <hr className="divider" />

        <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Submit Changes' : 'Save Content'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push(isEdit ? `/dashboard/content/${content?.id}` : '/dashboard/content')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
