import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getCompany, updateCompany, deleteCompany } from '@/services/company.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  established: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  pobox: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  vUrl: z.string().optional(),
  wUrl: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  instagram: z.string().optional(),
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
  try {
    const company = await getCompany(id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error(`API GET company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isCreater) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const formData = await req.formData();
    const dataObj: any = {};
    
    // Parse text fields
    const textFields = [
      'name', 'category', 'description', 'established',
      'address', 'phone', 'pobox', 'website', 'email', 'vUrl', 'wUrl',
      'mission', 'vision', 'facebook', 'twitter', 'youtube', 'instagram'
    ];
    for (const f of textFields) {
      const val = formData.get(f);
      if (val !== null) dataObj[f] = val as string;
    }

    const result = updateCompanySchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const photoFile = formData.get('photo') as File | null;
    let iUrl: string | undefined = undefined;

    // Check if a new file is uploaded
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const destinationPath = `CompanyImages/${id}/Images/${id}_logo_${Date.now()}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload company logo during update:', uploadError);
      }
    } else if (formData.get('deletePhoto') === 'true') {
      iUrl = ''; // set to empty to remove it
    }

    const updatedCompany = await updateCompany(id, {
      ...result.data,
      iUrl: iUrl === '' ? null : iUrl,
    }, session.email);

    return NextResponse.json({ success: true, data: updatedCompany });
  } catch (error: any) {
    console.error(`API PUT company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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
    await deleteCompany(id, session.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API DELETE company ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 });
  }
}
