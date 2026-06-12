import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getAllCompanies, createCompany } from '@/services/company.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const createCompanySchema = z.object({
  company: z.string().min(2, 'Company ID must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Company ID must be lowercase alphanumeric and dashes only'),
  name: z.string().min(2, 'Company name must be at least 2 characters'),
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

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companies = await getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error('API GET companies error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isCreater) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const dataObj: any = {};
    
    // Parse text fields
    const textFields = [
      'company', 'name', 'category', 'description', 'established',
      'address', 'phone', 'pobox', 'website', 'email', 'vUrl', 'wUrl',
      'mission', 'vision', 'facebook', 'twitter', 'youtube', 'instagram'
    ];
    for (const f of textFields) {
      const val = formData.get(f);
      if (val !== null) dataObj[f] = val as string;
    }

    const result = createCompanySchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const photoFile = formData.get('photo') as File | null;
    let iUrl = null;

    // Upload photo to GCS if present
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const destinationPath = `CompanyImages/${result.data.company}/Images/${result.data.company}_logo_${Date.now()}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload company logo during creation:', uploadError);
      }
    }

    const companyId = await createCompany({
      ...result.data,
      iUrl,
    }, session.email);

    return NextResponse.json({ success: true, data: { company: companyId } });
  } catch (error: any) {
    console.error('API POST company error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}
