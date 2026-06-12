import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getContentCategories, getTopics } from '@/services/remote-config.service';
import TopicContentForm from '../TopicContentForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Topic Article',
};

export default async function NewTopicPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);

  // Authorization: Must be Admin or Creator
  if (!roles.isAdmin && !roles.isCreater) {
    redirect('/dashboard/topics');
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

  const topics = await getTopics();

  return (
    <div className="fade-up" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/dashboard/topics" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Topic Articles
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Create Article</span>
          </div>
          <h1 className="page-title">Create Topic Article</h1>
          <p className="page-subtitle">Publish announcement posts, video updates, and schedule notifications for specific topic channel subscribers.</p>
        </div>
      </div>

      <div className="card">
        <TopicContentForm categories={categories} topics={topics} />
      </div>
    </div>
  );
}
