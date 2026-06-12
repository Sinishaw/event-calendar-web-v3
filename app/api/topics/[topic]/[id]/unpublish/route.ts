import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { unpublishTopicContent } from '@/services/topic-content.service';

interface RouteParams {
  params: Promise<{ topic: string; id: string }>;
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

  const { topic, id } = await params;

  try {
    await unpublishTopicContent(topic, id, session.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST unpublish topic content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to unpublish topic content' }, { status: 500 });
  }
}
