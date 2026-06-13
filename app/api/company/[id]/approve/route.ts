import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { approveCompany, getCompany } from '@/services/company.service';
import { syncCompanyProfileToRemoteConfig } from '@/services/remote-config.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isPublisher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    await approveCompany(id, session.email);
    const companyProfile = await getCompany(id);
    if (companyProfile) {
      await syncCompanyProfileToRemoteConfig(id, companyProfile);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST approve company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to approve company' }, { status: 500 });
  }
}
