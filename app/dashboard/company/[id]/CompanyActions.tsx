'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Company } from '@/types/company';

interface CompanyActionsProps {
  company: Company;
  isPublisher: boolean;
}

export default function CompanyActions({ company, isPublisher }: CompanyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localSt, setLocalSt] = useState(company.st);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleApprove() {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/company/${company.company}/approve`, {
        method: 'POST',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to approve company. Please verify your permissions.');
      }

      setLocalSt(1);
      setSuccess('Company approved and published successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to approve company. Please verify your permissions and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete company "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/company/${company.company}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete company. Please verify your permissions.');
      }

      setLocalSt(2);
      setSuccess('Company deleted successfully. Redirecting...');
      router.push('/dashboard/company');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete company. Please verify your permissions and try again.');
      setLoading(false);
    }
  }

  if (!isPublisher) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {error && (
        <div className="alert alert-danger" role="alert" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
          {success}
        </div>
      )}

      <div className="flex gap-2 w-full">
        {localSt !== 1 && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn btn-success btn-sm w-full"
          >
            {loading ? 'Processing…' : 'Approve & Publish'}
          </button>
        )}

        {localSt !== 2 && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger btn-sm w-full"
          >
            {loading ? 'Processing…' : 'Delete Company'}
          </button>
        )}
      </div>
    </div>
  );
}
