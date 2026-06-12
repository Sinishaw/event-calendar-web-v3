import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTopicContent } from '@/services/topic-content.service';
import { getContentCategories, getTopics } from '@/services/remote-config.service';
import TopicContentForm from '../../../TopicContentForm';
import Link from 'next/link';
import type { Metadata } from 'next';

interface EditTopicPageProps {
  params: Promise<{ topic: string; id: string }>;
}

export async function generateMetadata({ params }: EditTopicPageProps): Promise<Metadata> {
  const { topic, id } = await params;
  return {
    title: `Edit Topic Article ${id}`,
  };
}

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { topic, id } = await params;
  const decodedTopic = decodeURIComponent(topic);
  const roles = getRoles(session);

  // Authorization: Must be Admin or Creator
  if (!roles.isAdmin && !roles.isCreater) {
    redirect('/dashboard/topics');
  }

  const content = await getTopicContent(decodedTopic, id);
  if (!content) {
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
            <Link href={`/dashboard/topics/${topic}/${id}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {content.title}
            </Link>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>Edit Article</span>
          </div>
          <h1 className="page-title">Edit Topic Article</h1>
          <p className="page-subtitle">Update article details, schedules, status configuration, or banner images.</p>
        </div>
      </div>

      <div className="card">
        <TopicContentForm content={content} categories={categories} topics={topics} />
      </div>
    </div>
  );
}
