import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { unpublishTermRecord } from '@/services/terms.service';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, props: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;
  const roles = getRoles(session);
  if (!roles.isPublisher && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Publisher or admin role required' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const scope = searchParams.get('scope') || 'company';
  const queryCompany = searchParams.get('company');

  let companyId = '';
  if (scope === 'general') {
    if (!roles.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin role required for General terms' }, { status: 403 });
    }
    companyId = 'general';
  } else {
    companyId = roles.isAdmin && queryCompany ? queryCompany : (roles.company || '');
    if (!companyId || companyId === 'Not Assigned') {
      return NextResponse.json({ error: 'Company not assigned' }, { status: 400 });
    }
  }

  try {
    const result = await unpublishTermRecord(companyId, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`POST /api/terms/${id}/unpublish error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to unpublish terms document' }, { status: 500 });
  }
}
