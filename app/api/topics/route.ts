import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getTopicContents, createTopicContent } from '@/services/topic-content.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const createTopicContentSchema = z.object({
  topic: z.string().min(1, 'Topic selection is required'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  logoUrl: z.string().url('Invalid logo icon URL').or(z.literal('')),
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
  tagColor: z.string().default('-1'),
});

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get('topic') || undefined;

  try {
    const contents = await getTopicContents(topicId);
    return NextResponse.json({ success: true, data: contents });
  } catch (error) {
    console.error(`API GET topic contents error:`, error);
    return NextResponse.json({ error: 'Failed to fetch topic content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  
  // Authorization: Must be Creator or Admin
  if (!roles.isAdmin && !roles.isCreater) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const topicId = formData.get('topic') as string;

    const dataObj: any = {
      topic: topicId,
      companyName: formData.get('companyName'),
      logoUrl: formData.get('logoUrl') || '',
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
      tagColor: formData.get('tagColor') || '-1',
    };

    const result = createTopicContentSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
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
        const destinationPath = `TopicsImage/${topicId}/Contents/${topicId}_content_${timestamp}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload topic content image during creation:', uploadError);
      }
    }

    const created = await createTopicContent(
      {
        ...result.data,
        iUrl,
        frD: new Date(result.data.frD),
        toD: new Date(result.data.toD),
        markDate: result.data.markDate ? new Date(result.data.markDate) : new Date(result.data.frD),
        fetchExpirationDate: new Date(result.data.fetchExpirationDate),
      },
      session.email
    );

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('API POST topic content error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create topic content' }, { status: 500 });
  }
}
