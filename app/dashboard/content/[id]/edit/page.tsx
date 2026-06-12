import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getContent } from '@/services/content.service';
import { getContentCategories } from '@/services/remote-config.service';
import ContentForm from '../../ContentForm';
import Link from 'next/link';
import type { Metadata } from 'next';

interface EditContentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditContentPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Article ${id}`,
  };
}

export default async function EditContentPage({ params }: EditContentPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;
  const roles = getRoles(session);
  
  // Authorization: Must be Admin or Creator
  if (!roles.isAdmin && !roles.isCreater) {
    redirect('/dashboard/content');
  }

  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    redirect('/dashboard/content');
  }

  const content = await getContent(companyId, id);
  if (!content) {
    redirect('/dashboard/content');
  }

  // Authorization: must belong to the same company (or be admin)
  if (!roles.isAdmin && content.topic !== companyId) {
    redirect('/dashboard/content');
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
            <Link href={`/dashboard/content/${id}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {content.title}
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Edit Article</span>
          </div>
          <h1 className="page-title">Edit Content Article</h1>
          <p className="page-subtitle">Update article details, schedules, status configuration, or banner images.</p>
        </div>
      </div>

      <div className="card">
        <ContentForm content={content} categories={categories} />
      </div>
    </div>
  );
}
