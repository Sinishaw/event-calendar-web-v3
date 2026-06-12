import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTopicContents } from '@/services/topic-content.service';
import { getTopics } from '@/services/remote-config.service';
import TopicListClient from './TopicListClient';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Topic Articles',
};

export default async function TopicListPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const contents = await getTopicContents();
  const topics = await getTopics();

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Topic Content Management</h1>
          <p className="page-subtitle">Add, edit, review, and broadcast news and announcement articles for custom channel subscribers.</p>
        </div>
        <div className="page-actions">
          {(roles.isAdmin || roles.isCreater) && (
            <Link href="/dashboard/topics/new" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Topic Article
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Topic List & Grid/List Toggle */}
      <TopicListClient initialContents={contents} topics={topics} roles={roles} />
    </div>
  );
}
