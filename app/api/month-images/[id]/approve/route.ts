import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { approveCollection } from '@/services/month-image.service';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  if (!roles.isPublisher && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: publisher or admin role required' }, { status: 403 });
  }

  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'No company assigned' }, { status: 400 });
  }

  const { id } = await params;
  try {
    await approveCollection(companyId, id, session.email as string);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`POST /api/month-images/${id}/approve error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to approve collection' }, { status: 500 });
  }
}
