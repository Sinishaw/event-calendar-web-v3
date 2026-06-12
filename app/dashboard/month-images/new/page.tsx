import { verifySession, getRoles } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCollection } from '@/services/month-image.service';
import MonthImageForm from '../MonthImageForm';
import type { Metadata } from 'next';
import '../../dashboard.css';

export const metadata: Metadata = { title: 'New Month Image Collection | Calendar Platform' };

type Props = { searchParams: Promise<{ clone?: string }> };

export default async function NewMonthImagePage({ searchParams }: Props) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  if (!roles.isCreater && !roles.isAdmin) redirect('/dashboard/month-images');

  const { clone } = await searchParams;

  // In clone mode, fetch the source collection to pre-fill
  let sourceCollection = undefined;
  if (clone && roles.company && roles.company !== 'Not Assigned') {
    const src = await getCollection(roles.company, clone);
    if (src) sourceCollection = src;
  }

  return (
    <MonthImageForm
      mode={sourceCollection ? 'clone' : 'create'}
      roles={roles}
      collection={sourceCollection}
    />
  );
}
