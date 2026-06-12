import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { getTopicContent, updateTopicContent, deleteTopicContent } from '@/services/topic-content.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const updateTopicContentSchema = z.object({
  topic: z.string().min(1, 'Topic selection is required').optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  logoUrl: z.string().url('Invalid logo icon URL').or(z.literal('')).optional(),
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
  params: Promise<{ topic: string; id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, id } = await params;

  try {
    const content = await getTopicContent(topic, id);
    if (!content) {
      return NextResponse.json({ error: 'Topic content not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: content });
  } catch (error: any) {
    console.error(`API GET topic content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch topic content' }, { status: 500 });
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

  const { topic: topicParam, id } = await params;
  
  try {
    const formData = await req.formData();
    
    const dataObj: any = {};
    const textFields = [
      'topic', 'companyName', 'logoUrl', 'title', 'body', 'category', 'nationalDay', 'description',
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

    const result = updateTopicContentSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const photoFile = formData.get('photo') as File | null;
    let iUrl: string | undefined = undefined;
    const targetTopicId = result.data.topic || topicParam;

    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const destinationPath = `TopicsImage/${targetTopicId}/Contents/${targetTopicId}_content_${timestamp}.${ext}`;
        iUrl = await uploadToGCS(buffer, destinationPath, photoFile.type);
      } catch (uploadError) {
        console.error('Failed to upload content image during update:', uploadError);
      }
    } else if (formData.get('deletePhoto') === 'true') {
      iUrl = ''; // Mark to delete
    }

    const updateInput: any = {
      ...result.data,
      iUrl: iUrl === '' ? null : iUrl,
    };
    if (result.data.frD) updateInput.frD = new Date(result.data.frD);
    if (result.data.toD) updateInput.toD = new Date(result.data.toD);
    if (result.data.markDate) updateInput.markDate = new Date(result.data.markDate);
    if (result.data.fetchExpirationDate) updateInput.fetchExpirationDate = new Date(result.data.fetchExpirationDate);

    const updated = await updateTopicContent(topicParam, id, updateInput, session.email);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error(`API PUT topic content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update topic content' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin && !roles.isPublisher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { topic, id } = await params;

  try {
    await deleteTopicContent(topic, id, session.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API DELETE topic content ${id} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete topic content' }, { status: 500 });
  }
}
