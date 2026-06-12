import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { notifyContent } from '@/services/content.service';
import { getCompany } from '@/services/company.service';

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
    const companyProfile = await getCompany(companyId);
    if (!companyProfile) {
      return NextResponse.json({ error: `Company profile "${companyId}" not found` }, { status: 404 });
    }

    const messageId = await notifyContent(companyId, id, companyProfile.iUrl || '');
    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error(`API POST notify content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to send FCM notification' }, { status: 500 });
  }
}
