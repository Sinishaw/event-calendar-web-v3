import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getTermsRecords, saveTermRecord } from '@/services/terms.service';

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
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
      return NextResponse.json({ success: true, data: [] });
    }
  }

  try {
    const records = await getTermsRecords(companyId);
    return NextResponse.json({ success: true, data: records });
  } catch (err: any) {
    console.error('GET /api/terms error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch terms records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  if (!roles.isCreater && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Creator or admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const scope = body.scope || 'company';
    
    let companyId = '';
    if (scope === 'general') {
      if (!roles.isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin role required for General terms' }, { status: 403 });
      }
      companyId = 'general';
    } else {
      companyId = roles.isAdmin && body.company ? body.company : (roles.company || '');
      if (!companyId || companyId === 'Not Assigned') {
        return NextResponse.json({ error: 'User is not assigned to any company' }, { status: 400 });
      }
    }

    const { description, terms, wUrl, appVersionNumber, appVersionName, appVersionSummary } = body;
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!terms?.trim()) {
      return NextResponse.json({ error: 'Terms content is required' }, { status: 400 });
    }

    const id = await saveTermRecord(
      companyId,
      {
        description: description.trim(),
        terms: terms.trim(),
        wUrl: wUrl?.trim() || '',
        appVersionNumber: appVersionNumber?.trim() || '',
        appVersionName: appVersionName?.trim() || '',
        appVersionSummary: appVersionSummary?.trim() || '',
      },
      session.email as string
    );

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: any) {
    console.error('POST /api/terms error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save terms record' }, { status: 500 });
  }
}
