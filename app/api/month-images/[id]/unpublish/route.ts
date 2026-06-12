import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { unpublishCollection } from '@/services/month-image.service';

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
    const result = await unpublishCollection(companyId, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`POST /api/month-images/${id}/unpublish error:`, err);
    return NextResponse.json({ error: err.message || 'Unpublish failed' }, { status: 500 });
  }
}
