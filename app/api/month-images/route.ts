import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getCollections, createCollection } from '@/services/month-image.service';
import { uploadToGCS } from '@/lib/upload';
import { ETHIOPIAN_MONTHS } from '@/types/month-image';

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  const companyId = roles.company;
  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const collections = await getCollections(companyId);
    return NextResponse.json({ success: true, data: collections });
  } catch (err) {
    console.error('GET /api/month-images error:', err);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = getRoles(session);
  if (!roles.isCreater && !roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: creator or admin role required' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const companyId = roles.isAdmin
      ? ((formData.get('company') as string) || roles.company)
      : roles.company;

    if (!companyId || companyId === 'Not Assigned') {
      return NextResponse.json({ error: 'User is not assigned to any company' }, { status: 400 });
    }

    const thm = (formData.get('thm') as string)?.trim();
    const dsc = (formData.get('dsc') as string)?.trim();
    if (!thm) return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
    if (!dsc) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

    // Upload any provided month images
    const urlMap: Record<string, string | null> = {};
    for (const month of ETHIOPIAN_MONTHS) {
      const file = formData.get(`file_${month.key}`) as File | null;
      const existingUrl = formData.get(`url_${month.key}`) as string | null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `MonthImages/${companyId}/${month.key}_${Date.now()}.${ext}`;
        urlMap[month.urlField] = await uploadToGCS(buffer, path, file.type);
      } else {
        urlMap[month.urlField] = existingUrl || null;
      }
    }

    const id = await createCollection(
      companyId,
      { thm, dsc, ...urlMap } as any,
      session.email as string
    );

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: any) {
    console.error('POST /api/month-images error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create collection' }, { status: 500 });
  }
}
