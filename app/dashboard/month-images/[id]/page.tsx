import { verifySession, getRoles } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getCollection } from '@/services/month-image.service';
import MonthImageForm from '../MonthImageForm';
import type { Metadata } from 'next';
import '../../dashboard.css';

export const metadata: Metadata = { title: 'Month Image Collection Details | Calendar Platform' };

type Props = { params: Promise<{ id: string }> };

export default async function MonthImageDetailPage({ params }: Props) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const roles = getRoles(session);
  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') redirect('/dashboard/month-images');

  const { id } = await params;
  const collection = await getCollection(companyId, id);
  if (!collection) notFound();

  return (
    <MonthImageForm
      mode="edit"
      roles={roles}
      collection={collection}
    />
  );
}
