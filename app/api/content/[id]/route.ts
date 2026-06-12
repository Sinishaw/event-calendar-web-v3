import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getContent, updateContent, deleteContent } from '@/services/content.service';
import { getCompany } from '@/services/company.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const updateContentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  body: z.string().min(2, 'Body must be at least 2 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  nationalDay: z.string().optional(),
  description: z.string().min(2, 'Description must be at least 2 characters').optional(),
  vUrl: z.string().optional(),
  wUrl: z.string().optional(),
  frD: z.string().datetime('Invalid From Date format').optional(),
  toD: z.string().datetime('Invalid To Date format').optional(),
  ageRestriction: z.string().optional(),
  notifyUser: z.boolean().optional(),
  markOnCalendar: z.boolean().optional(),
  markDate: z.string().datetime('Invalid Mark Date format').optional().or(z.literal('')),
  fetchExpirationDate: z.string().datetime('Invalid Expiration Date format').optional(),
  tagColor: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roles = getRoles(session);
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'User is not assigned to a company' }, { status: 400 });
  }

  try {
    const content = await getContent(companyId, id);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: content });
  } catch (error: any) {
    console.error(`API GET content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roles = getRoles(session);
  
  try {
    const formData = await req.formData();
    const companyId = roles.isAdmin 
      ? (formData.get('company') as string || roles.company) 
      : roles.company;

    if (!companyId || companyId === 'Not Assigned') {
      return NextResponse.json({ error: 'User is not assigned to a company' }, { status: 400 });
    }

    // Authorization: Admin or associated company Creator/Publisher
    if (!roles.isAdmin && roles.company !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companyProfile = await getCompany(companyId);
    if (!companyProfile) {
      return NextResponse.json({ error: `Company "${companyId}" not found` }, { status: 404 });
    }

    const dataObj: any = {};
    const textFields = [
      'title', 'body', 'category', 'nationalDay', 'description',
      'vUrl', 'wUrl', 'frD', 'toD', 'ageRestriction', 'tagColor'
    ];
    for (const f of textFields) {
      const val = formData.get(f);
      if (val !== null) dataObj[f] = val as string;
    }
    if (formData.get('notifyUser') !== null) {
      dataObj.notifyUser = formData.get('notifyUser') === 'true';
    }
    if (formData.get('markOnCalendar') !== null) {
      dataObj.markOnCalendar = formData.get('markOnCalendar') === 'true';
    }
    if (formData.get('markDate') !== null) {
      dataObj.markDate = formData.get('markDate') as string;
    }
    if (formData.get('fetchExpirationDate') !== null) {
      dataObj.fetchExpirationDate = formData.get('fetchExpirationDate') as string;
    }

    const result = updateContentSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const photoFile = formData.get('photo') as File | null;
    let iUrl: string | undefined = undefined;

    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const destinationPath = `CompanyImages/${companyId}/Contents/${companyId}_content_${timestamp}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload content image during update:', uploadError);
      }
    } else if (formData.get('deletePhoto') === 'true') {
      iUrl = ''; // Mark to delete
    }

    // Convert date parameters
    const updateInput: any = {
      ...result.data,
      iUrl: iUrl === '' ? null : iUrl,
    };
    if (result.data.frD) updateInput.frD = new Date(result.data.frD);
    if (result.data.toD) updateInput.toD = new Date(result.data.toD);
    if (result.data.markDate) updateInput.markDate = new Date(result.data.markDate);
    if (result.data.fetchExpirationDate) updateInput.fetchExpirationDate = new Date(result.data.fetchExpirationDate);
    updateInput.companyName = companyProfile.name;

    const updatedContent = await updateContent(companyId, id, updateInput, companyProfile.iUrl || '', session.email);
    return NextResponse.json({ success: true, data: updatedContent });
  } catch (error: any) {
    console.error(`API PUT content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roles = getRoles(session);
  const companyId = roles.company;

  if (!companyId || companyId === 'Not Assigned') {
    return NextResponse.json({ error: 'User is not assigned to a company' }, { status: 400 });
  }

  // Authorization: must be Publisher or Admin
  if (!roles.isAdmin && !roles.isPublisher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await deleteContent(companyId, id, session.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API DELETE content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete content' }, { status: 500 });
  }
}
