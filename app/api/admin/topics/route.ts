import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getRoles } from '@/lib/auth';
import { 
  getTopics, 
  getTopicsForSubscription, 
  updateTopicsAndSubscription,
  TopicOption
} from '@/services/remote-config.service';
import { uploadToGCS } from '@/lib/upload';

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const topics = await getTopics();
    const topicsForSubscription = await getTopicsForSubscription();
    return NextResponse.json({ success: true, topics, topicsForSubscription });
  } catch (error: any) {
    console.error('API GET admin topics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Topic name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const value = trimmedName.toLowerCase().replace(/\s+/g, '_');

    const currentTopics = await getTopics();
    const currentSubs = await getTopicsForSubscription();

    const exists = currentTopics.some(t => t.value === value);
    if (exists) {
      return NextResponse.json({ error: `Topic "${trimmedName}" already exists.` }, { status: 400 });
    }

    // Handle optional icon file upload
    const iconFile = formData.get('icon') as File | null;
    let iconURL = '';
    if (iconFile && iconFile.size > 0) {
      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = iconFile.name.split('.').pop() || 'png';
      const destinationPath = `TopicsParamIcons/${value}.${ext}`;
      iconURL = await uploadToGCS(buffer, destinationPath, iconFile.type);
    }

    currentTopics.push({ name: trimmedName, value });
    currentSubs[value] = `${value}~${iconURL}`;

    const success = await updateTopicsAndSubscription(currentTopics, currentSubs);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save topics to Remote Config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, topic: { name: trimmedName, value, iconURL } });
  } catch (error: any) {
    console.error('API POST admin topics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create topic' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = getRoles(session);
  if (!roles.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const value = searchParams.get('value');
    if (!value) {
      return NextResponse.json({ error: 'Topic value parameter is required' }, { status: 400 });
    }

    const currentTopics = await getTopics();
    const currentSubs = await getTopicsForSubscription();

    const exists = currentTopics.some(t => t.value === value);
    if (!exists) {
      return NextResponse.json({ error: `Topic with value "${value}" not found.` }, { status: 404 });
    }

    // Filter out topic
    const updatedTopics = currentTopics.filter(t => t.value !== value);
    delete currentSubs[value];

    const success = await updateTopicsAndSubscription(updatedTopics, currentSubs);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update Remote Config after deletion' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE admin topics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete topic' }, { status: 500 });
  }
}
