import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getContentCategories } from '@/services/remote-config.service';
import ContentForm from '../ContentForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Content Article',
};

export default async function NewContentPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  
  // Authorization: Must be Admin or Creator
  if (!roles.isAdmin && !roles.isCreater) {
    redirect('/dashboard/content');
  }

  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return (
      <div className="alert alert-warning mb-4" role="alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        </svg>
        Your account is not assigned to any company. Please ask an administrator to assign a company to your profile before creating articles.
      </div>
    );
  }

  let categories = await getContentCategories();
  if (categories.length === 0) {
    categories = [
      { name: 'Announcements', value: 'Announcements' },
      { name: 'News', value: 'News' },
      { name: 'Events', value: 'Events' },
      { name: 'Holiday', value: 'Holiday' },
      { name: 'Business', value: 'Business' }
    ];
  }

  return (
    <div className="fade-up" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/content" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Content Articles
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Create Article</span>
          </div>
          <h1 className="page-title">Create Content Article</h1>
          <p className="page-subtitle">Publish announcement posts, weather warnings, video updates, and schedule notifications for client applications.</p>
        </div>
      </div>

      <div className="card">
        <ContentForm categories={categories} />
      </div>
    </div>
  );
}
