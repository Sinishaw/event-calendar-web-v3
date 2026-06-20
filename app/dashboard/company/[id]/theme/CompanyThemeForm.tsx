'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyThemeConfig } from '@/services/remote-config.service';

const logoOptions = [
  { value: 'topleft', label: 'Top Left' },
  { value: 'topright', label: 'Top Right' },
  { value: 'bottomleft', label: 'Bottom Left' },
  { value: 'bottomright', label: 'Bottom Right' },
];

const adsOptionsMap: Record<string, { value: string; label: string }[]> = {
  topright: [
    { value: 'left', label: 'Left' },
    { value: 'bottom', label: 'Bottom' },
  ],
  topleft: [
    { value: 'right', label: 'Right' },
    { value: 'bottom', label: 'Bottom' },
  ],
  bottomleft: [
    { value: 'top', label: 'Top' },
    { value: 'right', label: 'Right' },
  ],
  bottomright: [
    { value: 'left', label: 'Left' },
    { value: 'top', label: 'Top' },
  ],
};

interface CompanyThemeFormProps {
  companyId: string;
  config: CompanyThemeConfig | null;
  globalLanguages: any[];
  globalTopics: any[];
}

export default function CompanyThemeForm({
  companyId,
  config,
  globalLanguages,
  globalTopics,
}: CompanyThemeFormProps) {
  const router = useRouter();

  // Normalize languages list safely to handle both string array and object array forms
  const normalizedLanguages = (globalLanguages || []).map((l: any) => {
    if (typeof l === 'string') {
      return { name: l.toUpperCase(), value: l };
    }
    return {
      name: l?.name || l?.value || 'Unknown',
      value: l?.value || l?.name || '',
    };
  });

  // Normalize topics list safely to handle both string array and object array forms
  const normalizedTopics = (globalTopics || []).map((t: any) => {
    if (typeof t === 'string') {
      return { name: t, value: t };
    }
    return {
      name: t?.name || t?.value || 'Unknown',
      value: t?.value || t?.name || '',
    };
  });

  // Initialize form state
  const [primaryColorLight, setPrimaryColorLight] = useState(config?.primaryColorLight || '#ffffff');
  const [accentColorLight, setAccentColorLight] = useState(config?.accentColorLight || '#d97706');
  const [primaryColorDark, setPrimaryColorDark] = useState(config?.primaryColorDark || '#1c1917');
  const [accentColorDark, setAccentColorDark] = useState(config?.accentColorDark || '#f59e0b');
  const [defaultTheme, setDefaultTheme] = useState(config?.defaultTheme || 'dark');
  const [defaultLanguage, setDefaultLanguage] = useState(config?.defaultLanguage || 'am');
  const [NumberFormat, setNumberFormat] = useState(config?.NumberFormat || 'english');
  const [menuBackgroundOpacity, setMenuBackgroundOpacity] = useState(config?.menuBackgroundOpacity || 1);
  const [subscriptionPackage, setSubscriptionPackage] = useState(config?.subscriptionPackage || 'trial');
  const [expirationDate, setExpirationDate] = useState(config?.expirationDate || '');
  const [leftMenu, setLeftMenu] = useState(config?.leftMenu ?? false);
  const [showBottomMenu, setShowBottomMenu] = useState(config?.showBottomMenu ?? true);
  const [reverseAdsAnimation, setReverseAdsAnimation] = useState(config?.reverseAdsAnimation ?? false);
  const [verticalAxisAdsAnimation, setVerticalAxisAdsAnimation] = useState(config?.verticalAxisAdsAnimation ?? true);

  const initialLogo = config?.logoLocation || 'topright';
  const initialAds = config?.adsScreenLocation || (adsOptionsMap[initialLogo]?.[0]?.value || 'left');

  const [logoLocation, setLogoLocation] = useState(initialLogo);
  const [adsScreenLocation, setAdsScreenLocation] = useState(initialAds);

  const handleLogoLocationChange = (val: string) => {
    setLogoLocation(val);
    const validAds = adsOptionsMap[val] || [];
    if (validAds.length > 0) {
      setAdsScreenLocation(validAds[0].value);
    }
  };

  // Selected topics list
  const [selectedTopics, setSelectedTopics] = useState<string[]>(config?.topic || []);

  // Image references
  const logoInputRef = useRef<HTMLInputElement>(null);
  const menuHeaderInputRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(config?.logo || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [menuHeaderPreview, setMenuHeaderPreview] = useState<string | null>(config?.menuHeaderImage || null);
  const [menuHeaderFile, setMenuHeaderFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image Upload Previews
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo must be under 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleMenuHeaderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Menu header image must be under 3MB');
        return;
      }
      setMenuHeaderFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setMenuHeaderPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('primaryColorLight', primaryColorLight);
      formData.append('accentColorLight', accentColorLight);
      formData.append('primaryColorDark', primaryColorDark);
      formData.append('accentColorDark', accentColorDark);
      formData.append('defaultTheme', defaultTheme);
      formData.append('defaultLanguage', defaultLanguage);
      formData.append('NumberFormat', NumberFormat);
      formData.append('menuBackgroundOpacity', String(menuBackgroundOpacity));
      formData.append('subscriptionPackage', subscriptionPackage);
      formData.append('expirationDate', expirationDate);
      formData.append('leftMenu', String(leftMenu));
      formData.append('showBottomMenu', String(showBottomMenu));
      formData.append('reverseAdsAnimation', String(reverseAdsAnimation));
      formData.append('verticalAxisAdsAnimation', String(verticalAxisAdsAnimation));
      formData.append('logoLocation', logoLocation);
      formData.append('adsScreenLocation', adsScreenLocation);
      
      // Send topics as comma-separated string or array string
      formData.append('topics', JSON.stringify(selectedTopics));

      if (logoFile) {
        formData.append('logo', logoFile);
      } else {
        formData.append('currentLogo', config?.logo || '');
      }

      if (menuHeaderFile) {
        formData.append('menuHeaderImage', menuHeaderFile);
      } else {
        formData.append('currentMenuHeaderImage', config?.menuHeaderImage || '');
      }

      const res = await fetch(`/api/company/${companyId}/theme`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save theme configuration');
      }

      setSuccess('Theme settings and Remote Config template published successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(1px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'not-allowed',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      )}
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
        
        {/* Row 1: Brand Assets (Images) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Logo Upload */}
          <div className="card flex flex-col items-center gap-3" style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Mobile App Logo</h4>
            <div
              onClick={() => logoInputRef.current?.click()}
              style={{
                width: '120px',
                height: '120px',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                overflow: 'hidden',
                background: 'var(--bg-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
              }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span className="text-xs text-muted">Upload Logo</span>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} disabled={loading} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => logoInputRef.current?.click()} disabled={loading}>
              Choose Logo
            </button>
          </div>

          {/* Menu Header Upload */}
          <div className="card flex flex-col items-center gap-3" style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Side Menu Header Banner</h4>
            <div
              onClick={() => menuHeaderInputRef.current?.click()}
              style={{
                width: '240px',
                height: '120px',
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
              {menuHeaderPreview ? (
                <img src={menuHeaderPreview} alt="Menu Header" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-xs text-muted">Upload Header Image</span>
              )}
            </div>
            <input ref={menuHeaderInputRef} type="file" accept="image/*" onChange={handleMenuHeaderChange} style={{ display: 'none' }} disabled={loading} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => menuHeaderInputRef.current?.click()} disabled={loading}>
              Choose Banner
            </button>
          </div>
        </div>

        {/* Row 2: Color Palette Settings */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            Brand Themes & Color Palette
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            {/* Light Mode Colors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Light Theme Colors</h4>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="primary-light">Primary Color (Background)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input id="primary-light" type="color" value={primaryColorLight} onChange={(e) => setPrimaryColorLight(e.target.value)} disabled={loading} style={{ width: '48px', height: '38px', padding: 0 }} />
                  <input type="text" value={primaryColorLight} onChange={(e) => setPrimaryColorLight(e.target.value)} disabled={loading} placeholder="#ffffff" />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="accent-light">Accent Color (Actions/Glow)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input id="accent-light" type="color" value={accentColorLight} onChange={(e) => setAccentColorLight(e.target.value)} disabled={loading} style={{ width: '48px', height: '38px', padding: 0 }} />
                  <input type="text" value={accentColorLight} onChange={(e) => setAccentColorLight(e.target.value)} disabled={loading} placeholder="#d97706" />
                </div>
              </div>
            </div>

            {/* Dark Mode Colors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Dark Theme Colors</h4>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="primary-dark">Primary Color (Background)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input id="primary-dark" type="color" value={primaryColorDark} onChange={(e) => setPrimaryColorDark(e.target.value)} disabled={loading} style={{ width: '48px', height: '38px', padding: 0 }} />
                  <input type="text" value={primaryColorDark} onChange={(e) => setPrimaryColorDark(e.target.value)} disabled={loading} placeholder="#1c1917" />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="accent-dark">Accent Color (Actions/Glow)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input id="accent-dark" type="color" value={accentColorDark} onChange={(e) => setAccentColorDark(e.target.value)} disabled={loading} style={{ width: '48px', height: '38px', padding: 0 }} />
                  <input type="text" value={accentColorDark} onChange={(e) => setAccentColorDark(e.target.value)} disabled={loading} placeholder="#f59e0b" />
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Row 3: Preferences & Behaviours */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>General Defaults</h3>
            
            <div className="form-group">
              <label htmlFor="defaultTheme">Default Mobile Theme</label>
              <select id="defaultTheme" value={defaultTheme} onChange={(e) => setDefaultTheme(e.target.value)} disabled={loading}>
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="system">System Theme</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="defaultLanguage">Default Language</label>
              <select id="defaultLanguage" value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} disabled={loading}>
                {normalizedLanguages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="NumberFormat">Number Formatting</label>
              <select id="NumberFormat" value={NumberFormat} onChange={(e) => setNumberFormat(e.target.value)} disabled={loading}>
                <option value="english">Western Arabic (1, 2, 3)</option>
                <option value="geez">Ethiopian Geez (፩, ፪, ፫)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="logoLocation">Logo Location</label>
              <select
                id="logoLocation"
                value={logoLocation}
                onChange={(e) => handleLogoLocationChange(e.target.value)}
                disabled={loading}
              >
                {logoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adsScreenLocation">Ads Screen Location</label>
              <select
                id="adsScreenLocation"
                value={adsScreenLocation}
                onChange={(e) => setAdsScreenLocation(e.target.value)}
                disabled={loading}
              >
                {(adsOptionsMap[logoLocation] || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="menuBackgroundOpacity">Side Menu Opacity ({menuBackgroundOpacity})</label>
              <input
                id="menuBackgroundOpacity"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={menuBackgroundOpacity}
                onChange={(e) => setMenuBackgroundOpacity(parseFloat(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Layout & Animation Toggles</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="leftMenu" type="checkbox" checked={leftMenu} onChange={(e) => setLeftMenu(e.target.checked)} disabled={loading} style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="leftMenu" style={{ margin: 0, cursor: 'pointer' }}>Left Position Menu</label>
              </div>

              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="showBottomMenu" type="checkbox" checked={showBottomMenu} onChange={(e) => setShowBottomMenu(e.target.checked)} disabled={loading} style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="showBottomMenu" style={{ margin: 0, cursor: 'pointer' }}>Show Bottom Navigation Menu</label>
              </div>

              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="reverseAdsAnimation" type="checkbox" checked={reverseAdsAnimation} onChange={(e) => setReverseAdsAnimation(e.target.checked)} disabled={loading} style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="reverseAdsAnimation" style={{ margin: 0, cursor: 'pointer' }}>Reverse Advertisements Direction</label>
              </div>

              <div className="flex items-center gap-2" style={{ userSelect: 'none' }}>
                <input id="verticalAxisAdsAnimation" type="checkbox" checked={verticalAxisAdsAnimation} onChange={(e) => setVerticalAxisAdsAnimation(e.target.checked)} disabled={loading} style={{ width: 'auto', cursor: 'pointer' }} />
                <label htmlFor="verticalAxisAdsAnimation" style={{ margin: 0, cursor: 'pointer' }}>Vertical Axis Ads Slide Animation</label>
              </div>
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label htmlFor="subscriptionPackage">Subscription Package</label>
              <select id="subscriptionPackage" value={subscriptionPackage} onChange={(e) => setSubscriptionPackage(e.target.value)} disabled={loading}>
                <option value="trial">Trial Account</option>
                <option value="basic">Basic Tier</option>
                <option value="premium">Premium Corporate Tier</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expirationDate">Subscription Expiration Date</label>
              <input id="expirationDate" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} disabled={loading} />
            </div>
          </div>
        </div>

        {/* Row 4: Topics Selection */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Subscribed Content Topics</h3>
          <p className="text-xs text-muted" style={{ marginBottom: '1.25rem' }}>Select which content channel topics are enabled and viewable for this tenant's app users.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {normalizedTopics.map((topic) => (
              <div key={topic.value} className="flex items-center gap-2" style={{ userSelect: 'none', background: 'var(--surface-2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <input
                  id={`topic-${topic.value}`}
                  type="checkbox"
                  checked={selectedTopics.includes(topic.value)}
                  onChange={() => toggleTopic(topic.value)}
                  disabled={loading}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor={`topic-${topic.value}`} style={{ margin: 0, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {topic.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish Theme Config'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push(`/dashboard/company/${companyId}`)} disabled={loading}>
            Back to Details
          </button>
        </div>

      </div>
    </form>
    </div>
  );
}
