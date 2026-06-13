'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TermsAndPolicies } from '@/types/terms';

interface TermsFormProps {
  mode: 'create' | 'edit';
  scope: 'company' | 'general';
  companyId?: string; // only relevant if isAdmin and creating for another company
  term?: TermsAndPolicies | null;
  isAdmin?: boolean;
}

export default function TermsForm({ mode, scope, companyId, term, isAdmin }: TermsFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState(term?.description || '');
  const [terms, setTerms] = useState(term?.terms || '');
  const [wUrl, setWUrl] = useState(term?.wUrl || '');
  const [appVersionNumber, setAppVersionNumber] = useState(term?.appVersionNumber || '');
  const [appVersionName, setAppVersionName] = useState(term?.appVersionName || '');
  const [appVersionSummary, setAppVersionSummary] = useState(term?.appVersionSummary || '');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }
    if (!terms.trim()) {
      showToast('Terms content is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        scope,
        company: companyId,
        description: description.trim(),
        terms: terms.trim(),
        wUrl: wUrl.trim(),
        ...(scope === 'general' ? {
          appVersionNumber: appVersionNumber.trim(),
          appVersionName: appVersionName.trim(),
          appVersionSummary: appVersionSummary.trim()
        } : {})
      };

      const url = mode === 'edit' && term
        ? `/api/terms/${term.id}`
        : '/api/terms';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save terms');

      showToast('Terms version saved successfully!', 'success');
      const targetId = mode === 'edit' ? term!.id : json.data?.id;
      
      let redirectUrl = `/dashboard/terms/${targetId}?scope=${scope}`;
      if (companyId) {
        redirectUrl += `&company=${companyId}`;
      }

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-up">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
            padding: '0.85rem 1.25rem', borderRadius: 'var(--radius)',
            background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            color: '#fff', fontWeight: 600, boxShadow: 'var(--shadow-lg)',
            maxWidth: '360px', animation: 'fadeInUp 0.25s ease',
          }}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <p className="card-title">
              {scope === 'general' ? '🌍 General Platform Terms Details' : '🏢 Company Terms Details'}
            </p>
            {term && (
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                Version {term.version}
              </span>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', padding: '1rem 0' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="description">Revision Description *</label>
              <input
                id="description"
                className="form-input"
                type="text"
                placeholder="e.g. June 2026 update regarding user subscriptions"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="terms">Terms Content (Markdown/Text) *</label>
              <textarea
                id="terms"
                className="form-input"
                style={{ fontFamily: 'monospace', minHeight: '300px' }}
                placeholder="Paste terms and policies content here..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="wUrl">Web URL</label>
              <input
                id="wUrl"
                className="form-input"
                type="url"
                placeholder="e.g. https://coolcalendarplatform.com/terms-detail"
                value={wUrl}
                onChange={(e) => setWUrl(e.target.value)}
              />
            </div>

            {/* General scope fields */}
            {scope === 'general' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Mobile App Forced Update parameters</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="appVersionNumber">App Version Number</label>
                    <input
                      id="appVersionNumber"
                      className="form-input"
                      type="text"
                      placeholder="e.g. 100"
                      value={appVersionNumber}
                      onChange={(e) => setAppVersionNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="appVersionName">App Version Name</label>
                    <input
                      id="appVersionName"
                      className="form-input"
                      type="text"
                      placeholder="e.g. 1.0.0"
                      value={appVersionName}
                      onChange={(e) => setAppVersionName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="appVersionSummary">App Version Summary / Changelog</label>
                  <textarea
                    id="appVersionSummary"
                    className="form-input"
                    rows={3}
                    placeholder="Describe version updates or change log notes..."
                    value={appVersionSummary}
                    onChange={(e) => setAppVersionSummary(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
