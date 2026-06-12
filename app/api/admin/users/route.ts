import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAllUsers, createUser, updateUser } from '@/services/admin.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  emailVerified: z.boolean().default(false),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (must start with +)').optional().or(z.literal('')),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  disabled: z.boolean().default(false),
});

export async function GET() {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('API GET users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const password = formData.get('password') as string;
    const emailVerified = formData.get('emailVerified') === 'true';
    const disabled = formData.get('disabled') === 'true';
    const photoFile = formData.get('photo') as File | null;

    const dataObj = {
      email,
      displayName,
      phoneNumber,
      password,
      emailVerified,
      disabled,
    };

    const result = createUserSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    // 1. Create the user in Firebase Auth
    const uid = await createUser({
      email,
      emailVerified,
      phoneNumber: phoneNumber || undefined,
      displayName,
      password,
      disabled,
    });

    // 2. Upload photo if present, and update user record with photoURL
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const destinationPath = `BackendUsersProfilePictures/${uid}.${ext}`;
        const photoURL = await uploadToGCS(buffer, destinationPath, photoFile.type);

        await updateUser(uid, { photoURL });
      } catch (uploadError) {
        console.error('Failed to upload user profile photo during creation:', uploadError);
      }
    }

    return NextResponse.json({ success: true, data: { uid } });
  } catch (error: any) {
    console.error('API POST user error:', error);
    const message = error.message || 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
