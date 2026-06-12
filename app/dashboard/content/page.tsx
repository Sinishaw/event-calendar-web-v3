import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompanyContents } from '@/services/content.service';
import ContentListClient from './ContentListClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Articles',
};

export default async function ContentListPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return (
      <div className="alert alert-warning mb-4" role="alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        </svg>
        Your account is not assigned to any company. Please ask an administrator to assign a company to your profile to manage content.
      </div>
    );
  }

  const contents = await getCompanyContents(companyId);

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Company Content</h1>
          <p className="page-subtitle">Add, edit, review, and broadcast news and announcement articles for your company app users.</p>
        </div>
        <div className="page-actions">
          {(roles.isAdmin || roles.isCreater) && (
            <Link href="/dashboard/content/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Content
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Content List & Grid Toggle */}
      <ContentListClient initialContents={contents} roles={roles} />
    </div>
  );
}
