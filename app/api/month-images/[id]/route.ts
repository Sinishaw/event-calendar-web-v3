import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import {
  getCollection,
  updateCollection,
  deleteCollection,
} from '@/services/month-image.service';
import { uploadToGCS } from '@/lib/upload';
import { ETHIOPIAN_MONTHS } from '@/types/month-image';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'No company assigned' }, { status: 400 });
  }

  const { id } = await params;
  try {
    const collection = await getCollection(companyId, id);
    if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: collection });
  } catch (err) {
    console.error(`GET /api/month-images/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  if (!roles.isCreater && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'No company assigned' }, { status: 400 });
  }

  const { id } = await params;
  try {
    const formData = await req.formData();
    const thm = (formData.get('thm') as string)?.trim();
    const dsc = (formData.get('dsc') as string)?.trim();

    const urlMap: Record<string, string | null> = {};
    for (const month of ETHIOPIAN_MONTHS) {
      const file = formData.get(`file_${month.key}`) as File | null;
      const existingUrl = formData.get(`url_${month.key}`) as string | null;
      const cleared = formData.get(`clear_${month.key}`) === 'true';

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `MonthImages/${companyId}/${month.key}_${Date.now()}.${ext}`;
        urlMap[month.urlField] = await uploadToGCS(buffer, path, file.type);
      } else if (cleared) {
        urlMap[month.urlField] = null;
      } else if (existingUrl !== null) {
        urlMap[month.urlField] = existingUrl || null;
      }
      // If nothing provided for this month, don't include in update (keep existing Firestore value)
    }

    await updateCollection(companyId, id, { thm, dsc, ...urlMap } as any, session.email as string);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`PUT /api/month-images/${id} error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  if (!roles.isPublisher && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'No company assigned' }, { status: 400 });
  }

  const { id } = await params;
  try {
    await deleteCollection(companyId, id, session.email as string);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`DELETE /api/month-images/${id} error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to delete collection' }, { status: 500 });
  }
}
