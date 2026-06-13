import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getTermDocument, editTermRecord, deleteTermRecord } from '@/services/terms.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;
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
      return NextResponse.json({ error: 'Company not assigned' }, { status: 400 });
    }
  }

  try {
    const doc = await getTermDocument(companyId, id);
    if (!doc) {
      return NextResponse.json({ error: 'Terms document not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (err: any) {
    console.error(`GET /api/terms/${id} error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve terms document' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;
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
    if (description !== undefined && !description.trim()) {
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 });
    }
    if (terms !== undefined && !terms.trim()) {
      return NextResponse.json({ error: 'Terms content cannot be empty' }, { status: 400 });
    }

    await editTermRecord(
      companyId,
      id,
      {
        description: description?.trim(),
        terms: terms?.trim(),
        wUrl: wUrl?.trim(),
        appVersionNumber: appVersionNumber?.trim(),
        appVersionName: appVersionName?.trim(),
        appVersionSummary: appVersionSummary?.trim(),
      },
      session.email as string
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`PUT /api/terms/${id} error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update terms document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: Params) {
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
    await deleteTermRecord(companyId, id, session.email as string);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`DELETE /api/terms/${id} error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to delete terms document' }, { status: 500 });
  }
}
