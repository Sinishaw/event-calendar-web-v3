'use client';

import { useRouter } from 'next/navigation';
import { Company } from '@/types/company';

interface CompanyFilterSelectProps {
  companies: Company[];
  currentCompanyId: string;
}

export default function CompanyFilterSelect({ companies, currentCompanyId }: CompanyFilterSelectProps) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label htmlFor="company-select" className="text-xs text-muted font-medium">Select Company:</label>
      <select
        id="company-select"
        className="form-input text-sm"
        style={{ width: '220px', padding: '0.35rem 0.5rem', cursor: 'pointer' }}
        value={currentCompanyId}
        onChange={(e) => {
          const targetComp = e.target.value;
          router.push(`/dashboard/terms?scope=company&company=${targetComp}`);
        }}
      >
        {companies.map((c) => (
          <option key={c.company} value={c.company}>
            {c.name} ({c.company})
          </option>
        ))}
      </select>
    </div>
  );
}
