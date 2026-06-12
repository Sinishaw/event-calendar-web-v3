import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCollections } from '@/services/month-image.service';
import MonthImageListClient from './MonthImageListClient';
import type { Metadata } from 'next';
import '../dashboard.css';

export const metadata: Metadata = { title: 'Month Images | Calendar Platform' };

export default async function MonthImagesPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const companyId = roles.company;

  const collections = companyId && companyId !== 'Not Assigned'
    ? await getCollections(companyId)
    : [];

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📅 Month Images</h1>
          <p className="page-subtitle">
            Manage Ethiopian calendar month image collections for your company
          </p>
        </div>
      </div>

      <MonthImageListClient initialCollections={collections} roles={roles} />
    </div>
  );
}
