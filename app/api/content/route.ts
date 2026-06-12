import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getCompanyContents, createContent } from '@/services/content.service';
import { getCompany } from '@/services/company.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const createContentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  body: z.string().min(2, 'Body must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  nationalDay: z.string().optional(),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  vUrl: z.string().optional(),
  wUrl: z.string().optional(),
  frD: z.string().datetime('Invalid From Date format'),
  toD: z.string().datetime('Invalid To Date format'),
  ageRestriction: z.string().default('0'),
  notifyUser: z.boolean().default(false),
  markOnCalendar: z.boolean().default(false),
  markDate: z.string().datetime('Invalid Mark Date format').optional().or(z.literal('')),
  fetchExpirationDate: z.string().datetime('Invalid Expiration Date format'),
  tagColor: z.string().default('#000000'),
});

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const contents = await getCompanyContents(companyId);
    return NextResponse.json({ success: true, data: contents });
  } catch (error) {
    console.error(`API GET contents error for company ${companyId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  
  // Administrators can specify the company, otherwise default to user's assigned company
  try {
    const formData = await req.formData();
    const companyId = roles.isAdmin 
      ? (formData.get('company') as string || roles.company) 
      : roles.company;

    if (!companyId || companyId === 'Not Assigned') {
      return NextResponse.json({ error: 'User is not assigned to any company' }, { status: 400 });
    }

    // Authorization: Must be admin or associated with this company
    if (!roles.isAdmin && roles.company !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get company profile detail for audit logging
    const companyProfile = await getCompany(companyId);
    if (!companyProfile) {
      return NextResponse.json({ error: `Company "${companyId}" not found` }, { status: 404 });
    }

    const dataObj: any = {
      title: formData.get('title'),
      body: formData.get('body'),
      category: formData.get('category'),
      nationalDay: formData.get('nationalDay') || '',
      description: formData.get('description'),
      vUrl: formData.get('vUrl') || '',
      wUrl: formData.get('wUrl') || '',
      frD: formData.get('frD'),
      toD: formData.get('toD'),
      ageRestriction: formData.get('ageRestriction') || '0',
      notifyUser: formData.get('notifyUser') === 'true',
      markOnCalendar: formData.get('markOnCalendar') === 'true',
      markDate: formData.get('markDate') || '',
      fetchExpirationDate: formData.get('fetchExpirationDate'),
      tagColor: formData.get('tagColor') || '#000000',
    };

    const result = createContentSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const photoFile = formData.get('photo') as File | null;
    let iUrl = null;

    // Upload header photo to GCS if present
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const destinationPath = `CompanyImages/${companyId}/Contents/${companyId}_content_${timestamp}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload content image during creation:', uploadError);
      }
    }

    const contentId = await createContent(
      companyId,
      {
        ...result.data,
        iUrl,
        frD: new Date(result.data.frD),
        toD: new Date(result.data.toD),
        markDate: result.data.markDate ? new Date(result.data.markDate) : new Date(result.data.frD),
        fetchExpirationDate: new Date(result.data.fetchExpirationDate),
        companyName: companyProfile.name,
      },
      companyProfile.iUrl || '',
      session.email
    );

    return NextResponse.json({ success: true, data: { id: contentId } });
  } catch (error: any) {
    console.error('API POST content error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create content' }, { status: 500 });
  }
}
