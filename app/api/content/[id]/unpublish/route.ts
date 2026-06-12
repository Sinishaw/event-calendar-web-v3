import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { unpublishContent } from '@/services/content.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isPublisher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'User is not assigned to a company' }, { status: 400 });
  }

  try {
    await unpublishContent(companyId, id, session.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST unpublish content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to unpublish content' }, { status: 500 });
  }
}
