import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUser, updateUser, deleteUser } from '@/services/admin.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  emailVerified: z.boolean().optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (must start with +)').optional().or(z.literal('')),
  displayName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  disabled: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ uid: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;
  try {
    const user = await getUser(uid);
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error(`API GET user ${uid} error:`, error);
    return NextResponse.json({ error: error.message || 'User not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string | null;
    const displayName = formData.get('displayName') as string | null;
    const phoneNumber = formData.get('phoneNumber') as string | null;
    const password = formData.get('password') as string | null;
    const emailVerifiedVal = formData.get('emailVerified');
    const disabledVal = formData.get('disabled');
    const photoFile = formData.get('photo') as File | null;

    const dataObj: any = {};
    if (email !== null) dataObj.email = email;
    if (displayName !== null) dataObj.displayName = displayName;
    if (phoneNumber !== null) dataObj.phoneNumber = phoneNumber;
    if (password !== null && password !== '') dataObj.password = password;
    if (emailVerifiedVal !== null) dataObj.emailVerified = emailVerifiedVal === 'true';
    if (disabledVal !== null) dataObj.disabled = disabledVal === 'true';

    const result = updateUserSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const updateInput = {
      ...result.data,
      phoneNumber: result.data.phoneNumber === '' ? undefined : result.data.phoneNumber,
      password: result.data.password === '' ? undefined : result.data.password,
    };

    // If new photo uploaded
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const destinationPath = `BackendUsersProfilePictures/${uid}_${timestamp}.${ext}`;
        const photoURL = await uploadToGCS(buffer, destinationPath, photoFile.type);

        (updateInput as any).photoURL = photoURL;
      } catch (uploadError) {
        console.error('Failed to upload user profile photo during update:', uploadError);
      }
    }

    const updatedUser = await updateUser(uid, updateInput);
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error(`API PUT user ${uid} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;
  try {
    await deleteUser(uid);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API DELETE user ${uid} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
