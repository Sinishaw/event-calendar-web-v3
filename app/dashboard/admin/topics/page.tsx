import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTopics, getTopicsForSubscription } from '@/services/remote-config.service';
import GlobalTopicsClient from './GlobalTopicsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Global Topics | Calendar Platform',
};

export default async function ManageTopicsPage() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isAdmin) redirect('/dashboard');

  const topics = await getTopics();
  const topicsForSubscription = await getTopicsForSubscription();

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Global Topic Registry</h1>
          <p className="page-subtitle">Add or delete content channel topics and icons globally across all company tenants.</p>
        </div>
      </div>

      <GlobalTopicsClient initialTopics={topics} initialSubs={topicsForSubscription} />
    </div>
  );
}
