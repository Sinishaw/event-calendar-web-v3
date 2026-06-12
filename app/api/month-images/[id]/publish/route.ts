import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { publishCollection } from '@/services/month-image.service';

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
    const result = await publishCollection(companyId, id);

    if (result.ok) {
      return NextResponse.json({ success: true });
    }

    // Conflict: another collection is already published
    if ('conflict' in result && result.conflict) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: `"${result.conflictThm}" is currently published. Unpublish it first before publishing this collection.`,
          conflictId: result.conflictId,
          conflictThm: result.conflictThm,
        },
        { status: 409 }
      );
    }

    // Business-rule or RC failure
    return NextResponse.json({ error: result.error }, { status: 422 });
  } catch (err: any) {
    console.error(`POST /api/month-images/${id}/publish error:`, err);
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}
